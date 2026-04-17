import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { prismaDevDatabaseUrl, prismaDevDbFile, repoRoot } from "./prisma-dev-database-url.mjs";

const root = repoRoot;
const prismaDir = resolve(root, "prisma");
const devDbFile = prismaDevDbFile;
const databaseUrl = prismaDevDatabaseUrl;

function rmQuiet(path) {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

function rmSqliteFamily(dbPath) {
  rmQuiet(dbPath);
  rmQuiet(`${dbPath}-journal`);
  rmQuiet(`${dbPath}-wal`);
  rmQuiet(`${dbPath}-shm`);
}

/** Prisma resolves `file:./x` relative to the directory containing `schema.prisma`. */
function sqlitePathFromDatabaseUrl(raw) {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (!trimmed.startsWith("file:")) {
    return null;
  }
  if (trimmed.startsWith("file://")) {
    try {
      return fileURLToPath(trimmed);
    } catch {
      return null;
    }
  }
  const rel = trimmed.slice("file:".length).replace(/^\.\//, "");
  return resolve(prismaDir, rel);
}

function removeEnvDatabaseUrlTargets() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) {
    return;
  }
  const text = readFileSync(envPath, "utf8");
  const m = text.match(/^DATABASE_URL=(.*)$/m);
  if (!m) {
    return;
  }
  const path = sqlitePathFromDatabaseUrl(m[1]);
  if (!path || path === devDbFile) {
    return;
  }
  console.log(`[sis-mvp] Removing extra SQLite from .env DATABASE_URL: ${path}`);
  rmSqliteFamily(path);
}

function removeTmpSisSeedSqlites() {
  const tmp = "/tmp";
  try {
    if (!existsSync(tmp)) {
      return;
    }
    for (const name of readdirSync(tmp)) {
      if (/^sis-.*\.sqlite$/i.test(name) || /^sis-.*\.db$/i.test(name)) {
        const p = join(tmp, name);
        console.log(`[sis-mvp] Removing temp SQLite: ${p}`);
        rmSqliteFamily(p);
      }
    }
  } catch {
    /* ignore permission errors */
  }
}

/** Avoid deleting `.next` while `npm run dev` is still running (Next then 500s on missing manifests). */
function assertDevPortFreeBeforeWipe() {
  const r = spawnSync("lsof", ["-nP", "-iTCP:3000", "-sTCP:LISTEN"], { encoding: "utf8" });
  if (r.error) {
    return;
  }
  if (r.stdout?.trim()) {
    console.error(
      "[sis-mvp] Port 3000 is in use (e.g. `npm run dev`). Stop the dev server, then run db:wipe-dev again.\n" +
        "[sis-mvp] Wiping `.next` while Next is running causes ENOENT / Internal Server Error until you restart dev."
    );
    process.exit(1);
  }
}

assertDevPortFreeBeforeWipe();

removeEnvDatabaseUrlTargets();
removeTmpSisSeedSqlites();

for (const name of ["dev.db", "test-integration.db", "ci.sqlite"]) {
  rmSqliteFamily(resolve(prismaDir, name));
}

rmSqliteFamily(resolve(root, "dev.db"));

try {
  for (const ent of readdirSync(prismaDir, { withFileTypes: true })) {
    if (ent.isFile() && /^ci.*\.sqlite$/i.test(ent.name)) {
      rmSqliteFamily(resolve(prismaDir, ent.name));
    }
  }
} catch {
  /* ignore */
}

rmQuiet(resolve(prismaDir, "prisma", "ci-verify.sqlite"));
rmQuiet(resolve(prismaDir, "prisma"));

for (const dir of [".next", ".next-dev", ".next-e2e", ".sis-dev"]) {
  rmQuiet(resolve(root, dir));
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

run(process.execPath, [resolve(root, "node_modules/prisma/build/index.js"), "db", "push"]);
run(process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "prisma/seed.ts"]);

console.log(`[sis-mvp] Wiped and re-seeded: ${devDbFile}`);
console.log("[sis-mvp] Use DATABASE_URL=file:./dev.db in .env (Prisma resolves to prisma/dev.db).");
console.log("[sis-mvp] Login: admin / AdminDemo#1");
console.log(
  "[sis-mvp] Next.js build output was removed (.next / legacy .next-dev / .next-e2e / .sis-dev). Stop any dev server on port 3000, then run: npm run dev"
);
