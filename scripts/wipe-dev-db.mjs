import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  isSafePostgresDatabaseName,
  prismaDevAdminDatabaseUrl,
  prismaDevDatabaseName,
  prismaDevDatabaseUrl,
  repoRoot
} from "./prisma-dev-database-url.mjs";

const root = repoRoot;
const databaseUrl = prismaDevDatabaseUrl;
const prismaCli = resolve(root, "node_modules/prisma/build/index.js");
const tsxCli = resolve(root, "node_modules/tsx/dist/cli.mjs");

function rmQuiet(path) {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch {
    /* ignore */
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

if (!isSafePostgresDatabaseName(prismaDevDatabaseName)) {
  console.error(`[sis-mvp] Unsafe PostgreSQL database name: ${prismaDevDatabaseName}`);
  process.exit(1);
}

run("dropdb", ["--if-exists", "--force", "--maintenance-db", prismaDevAdminDatabaseUrl, prismaDevDatabaseName]);
run("createdb", ["--maintenance-db", prismaDevAdminDatabaseUrl, prismaDevDatabaseName]);
run(process.execPath, [prismaCli, "migrate", "deploy"]);
run(process.execPath, [tsxCli, "prisma/seed.ts"]);

console.log(`[sis-mvp] Wiped and re-seeded PostgreSQL database: ${prismaDevDatabaseName}`);
console.log(`[sis-mvp] Use DATABASE_URL=${databaseUrl} in .env for local development.`);
console.log("[sis-mvp] Login: admin / AdminDemo#1");
console.log(
  "[sis-mvp] Next.js build output was removed (.next / legacy .next-dev / .next-e2e / .sis-dev). Stop any dev server on port 3000, then run: npm run dev"
);
