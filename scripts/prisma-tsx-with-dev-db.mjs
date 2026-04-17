import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { prismaDevDatabaseUrl, repoRoot } from "./prisma-dev-database-url.mjs";

const rel = process.argv[2];
if (!rel) {
  console.error("usage: node scripts/prisma-tsx-with-dev-db.mjs <script-relative-to-repo-root>");
  process.exit(1);
}

const tsx = resolve(repoRoot, "node_modules/tsx/dist/cli.mjs");
const r = spawnSync(process.execPath, [tsx, rel], {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: prismaDevDatabaseUrl },
});

process.exit(r.status ?? 1);
