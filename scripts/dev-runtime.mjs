import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const DEV_DIST_DIR = ".next-dev";
const PID_DIR = resolve(DEV_DIST_DIR);
const PID_FILE = resolve(`${DEV_DIST_DIR}/.dev-server.pid`);

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

function cleanupBuildArtifacts() {
  rmSync(resolve(`${DEV_DIST_DIR}/server`), { recursive: true, force: true });
  rmSync(resolve(`${DEV_DIST_DIR}/static`), { recursive: true, force: true });
  rmSync(resolve(`${DEV_DIST_DIR}/cache`), { recursive: true, force: true });
}

function startDev(command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      NEXT_DIST_DIR: DEV_DIST_DIR,
      WATCHPACK_POLLING: "true",
      CHOKIDAR_USEPOLLING: "1"
    }
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
  ensureRuntimeDir();
  ensureSingleInstance();
  await ensurePortFree();
  cleanupBuildArtifacts();

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
