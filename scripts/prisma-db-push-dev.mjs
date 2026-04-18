import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  isSafePostgresDatabaseName,
  prismaDevAdminDatabaseUrl,
  prismaDevDatabaseName,
  prismaDevDatabaseUrl,
  repoRoot
} from "./prisma-dev-database-url.mjs";

const prismaCli = resolve(repoRoot, "node_modules/prisma/build/index.js");
const extra = process.argv.slice(2);

function run(cmd, args, env = process.env) {
  return spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env
  });
}

if (!isSafePostgresDatabaseName(prismaDevDatabaseName)) {
  console.error(`[sis-mvp] Unsafe PostgreSQL database name: ${prismaDevDatabaseName}`);
  process.exit(1);
}

const exists = spawnSync("psql", [prismaDevAdminDatabaseUrl, "-Atqc", `SELECT 1 FROM pg_database WHERE datname = '${prismaDevDatabaseName}'`], {
  cwd: repoRoot,
  encoding: "utf8"
});
if (exists.status !== 0) {
  process.exit(exists.status ?? 1);
}
if (!exists.stdout?.trim()) {
  const created = run("createdb", ["--maintenance-db", prismaDevAdminDatabaseUrl, prismaDevDatabaseName]);
  if (created.status !== 0) {
    process.exit(created.status ?? 1);
  }
}

const r = run(process.execPath, [prismaCli, "db", "push", ...extra], {
  ...process.env,
  DATABASE_URL: prismaDevDatabaseUrl
});

process.exit(r.status ?? 1);
