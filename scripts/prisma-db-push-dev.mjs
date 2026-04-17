import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { prismaDevDatabaseUrl, repoRoot } from "./prisma-dev-database-url.mjs";

const prismaCli = resolve(repoRoot, "node_modules/prisma/build/index.js");
const extra = process.argv.slice(2);

const r = spawnSync(process.execPath, [prismaCli, "db", "push", ...extra], {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: prismaDevDatabaseUrl },
});

process.exit(r.status ?? 1);
