import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * `npm run dev` must hit the same SQLite as `db:wipe-dev` / `db:push`.
 * If the shell already exports `DATABASE_URL` (e.g. to `/tmp/...`), dotenv will not override it and login hits the wrong DB.
 * Set `SIS_DEV_DATABASE_URL` to force a different file for local dev.
 */
function ensureDevDatabaseUrlForWorkspace() {
  const override = process.env.SIS_DEV_DATABASE_URL?.trim();
  if (override) {
    process.env.DATABASE_URL = override;
    return;
  }
  const devDbPath = resolve(process.cwd(), "prisma", "dev.db");
  process.env.DATABASE_URL = pathToFileURL(devDbPath).href;
}

const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
const supportedMajors = new Set([18, 20, 22]);
const HOST = "127.0.0.1";
const PORT = 3000;
/** Keep PID outside `.next` so wipes / Next itself never strand a half-deleted dist with a live pid. */
const PID_DIR = resolve(process.cwd(), ".sis-dev");
const PID_FILE = resolve(PID_DIR, ".dev-server.pid");
const NEXT_DIST = ".next";

/**
 * After a crash, partial wipe, or an interrupted compile, `.next` can contain manifests but no
 * `static/` → HTML references `/_next/static/...` that always 404 (unstyled UI, no hydration).
 * Custom `NEXT_DIST_DIR` was especially prone to this; `npm run dev` now uses the default `.next`.
 */
function removeIncompleteNextDist() {
  const distRoot = resolve(process.cwd(), NEXT_DIST);
  const manifestPath = resolve(distRoot, "app-build-manifest.json");
  const staticDir = resolve(distRoot, "static");
  if (existsSync(manifestPath) && !existsSync(staticDir)) {
    console.warn(
      "[sis-mvp] `.next` is incomplete (manifest present but no static/). Removing it so Next can rebuild dev assets."
    );
    rmSync(distRoot, { recursive: true, force: true });
  }
}

function ensureRuntimeDir() {
  mkdirSync(PID_DIR, { recursive: true });
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function ensureSingleInstance() {
  try {
    const existingPid = Number.parseInt(readFileSync(PID_FILE, "utf8").trim(), 10);
    if (Number.isFinite(existingPid) && isProcessAlive(existingPid)) {
      console.error(`[sis-mvp] Dev server already running (pid ${existingPid}). Use existing instance on http://${HOST}:${PORT}`);
      process.exit(1);
    }
  } catch {
    // No existing pid file.
  }
}

async function ensurePortFree() {
  await new Promise((resolvePromise, rejectPromise) => {
    const tester = createServer();
    tester.once("error", (error) => {
      rejectPromise(error);
    });
    tester.once("listening", () => {
      tester.close(() => resolvePromise(undefined));
    });
    tester.listen(PORT, HOST);
  }).catch(() => {
    console.error(`[sis-mvp] Port ${PORT} is already in use. Stop existing process first.`);
    process.exit(1);
  });
}

function startDev(command, args) {
  const env = { ...process.env };
  delete env.NEXT_DIST_DIR;
  delete env.WATCHPACK_POLLING;
  delete env.CHOKIDAR_USEPOLLING;
  if (process.env.SIS_DEV_FILE_POLLING === "1") {
    env.WATCHPACK_POLLING = "true";
    env.CHOKIDAR_USEPOLLING = "1";
  }

  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env
  });

  writeFileSync(PID_FILE, String(child.pid ?? ""));

  const shutdown = () => {
    child.kill("SIGTERM");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  child.on("exit", (code) => {
    rmSync(PID_FILE, { force: true });
    process.exit(code ?? 0);
  });
}

async function main() {
  ensureDevDatabaseUrlForWorkspace();
  removeIncompleteNextDist();
  ensureRuntimeDir();
  ensureSingleInstance();
  await ensurePortFree();
  // Do not delete `.next/server`, `static`, or `cache` while Next is running. Use `npm run dev:clean`
  // for a cold cache. For Docker bind mounts, set `SIS_DEV_FILE_POLLING=1` to re-enable polling.

  if (supportedMajors.has(major)) {
    startDev("node", ["./node_modules/next/dist/bin/next", "dev", "--hostname", HOST, "--port", String(PORT)]);
    return;
  }

  console.warn(
    `[sis-mvp] Detected Node v${process.versions.node}. ` + "Using isolated Node 22 runtime for stable Next.js dev."
  );
  startDev("npx", ["-y", "node@22", "./node_modules/next/dist/bin/next", "dev", "--hostname", HOST, "--port", String(PORT)]);
}

void main();
