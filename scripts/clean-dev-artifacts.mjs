/**
 * `clean:dev` — 로컬을 **GitHub에서 이 저장소를 처음 클론한 직후**와 같은 전제로 맞춥니다.
 * **README 1단계(저장소 클론)는 생략**하고, 그 다음에 생기는 것들만 제거합니다(의존성·산출물·`.env`·로컬 Postgres dev/test DB 등).
 */
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  isSafePostgresDatabaseName,
  prismaDevAdminDatabaseUrl,
  prismaDevDatabaseName,
  prismaIntegrationAdminDatabaseUrl,
  prismaIntegrationDatabaseName,
  repoRoot
} from "./postgres-database-url.mjs";

/** Same guard as `wipe-dev-db.mjs`: do not delete `.next` while Next is listening on 3000. */
function assertDevPortFree() {
  const r = spawnSync("lsof", ["-nP", "-iTCP:3000", "-sTCP:LISTEN"], { encoding: "utf8" });
  if (r.error) {
    return;
  }
  if (r.stdout?.trim()) {
    console.error(
      "[sis-mvp] Port 3000 is in use (e.g. `npm run dev`). Stop the dev server, then run clean:dev again.\n" +
        "[sis-mvp] Removing `.next` while Next is running causes ENOENT / Internal Server Error until you restart dev."
    );
    process.exit(1);
  }
}

function rmQuiet(rel) {
  try {
    rmSync(resolve(repoRoot, rel), { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

function dropIfSafe(name, maintenanceDbUrl) {
  if (!isSafePostgresDatabaseName(name)) {
    console.error(`[sis-mvp] Unsafe PostgreSQL database name, skip drop: ${name}`);
    return;
  }
  const r = spawnSync("dropdb", ["--if-exists", "--maintenance-db", maintenanceDbUrl, name], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

assertDevPortFree();

if (process.env.SIS_CLEAN_KEEP_ENV === "1") {
  console.log("[sis-mvp] SIS_CLEAN_KEEP_ENV=1 — keeping .env and .env.local");
} else {
  rmQuiet(".env");
  rmQuiet(".env.local");
  console.log("[sis-mvp] Removed .env / .env.local if present (README 3단계: cp .env.example .env)");
}

const dropTargets = [
  { name: prismaDevDatabaseName, admin: prismaDevAdminDatabaseUrl },
  { name: prismaIntegrationDatabaseName, admin: prismaIntegrationAdminDatabaseUrl }
];
const seen = new Set();
for (const { name, admin } of dropTargets) {
  if (seen.has(name)) {
    continue;
  }
  seen.add(name);
  dropIfSafe(name, admin);
}

for (const dir of [
  "node_modules",
  "node_modules 2",
  ".next",
  ".next-dev",
  ".next-e2e",
  ".sis-dev",
  "coverage",
  "dist",
  "playwright-report",
  "test-results"
]) {
  rmQuiet(dir);
}
try {
  rmSync(resolve(repoRoot, "tsconfig.tsbuildinfo"), { force: true });
} catch {
  /* ignore */
}

rmQuiet("prisma/prisma");

console.log("[sis-mvp] Local state aligned with a fresh clone (step 1 clone excluded).");
console.log("[sis-mvp] Next: README 2단계 npm install → 3단계 cp .env.example .env 및 변수 채우기 → db:generate / db:push / db:seed");
