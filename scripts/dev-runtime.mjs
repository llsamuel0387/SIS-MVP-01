import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { prismaDevDatabaseUrl } from "./prisma-dev-database-url.mjs";

/**
 * `npm run dev` must hit the same PostgreSQL database as `db:push` / `db:seed`.
 * If the shell already exports `DATABASE_URL`, dotenv will not override it and auth/tests drift.
 * Set `SIS_DEV_DATABASE_URL` to force a different local PostgreSQL database.
 */
function ensureDevDatabaseUrlForWorkspace() {
  process.env.DATABASE_URL = prismaDevDatabaseUrl;
}

const HOST = "127.0.0.1";
const PORT = 3000;
/** Keep PID outside `.next` so wipes / Next itself never strand a half-deleted dist with a live pid. */
const PID_DIR = resolve(process.cwd(), ".sis-dev");
const PID_FILE = resolve(PID_DIR, ".dev-server.pid");
const NEXT_DIST = ".next";

/** Match `next` package `engines.node`: `^18.18.0 || ^19.8.0 || >= 20.0.0` */
function isNodeSupportedByNextEngines() {
  const parts = process.versions.node.split(".");
  const major = Number.parseInt(parts[0] ?? "", 10);
  const minor = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(major) || !Number.isFinite(minor)) {
    return false;
  }
  if (major >= 20) {
    return true;
  }
  if (major === 19) {
    return minor >= 8;
  }
  if (major === 18) {
    return minor >= 18;
  }
  return false;
}

/**
 * Before spawning `next dev`, drop a corrupt/partial `.next` so the first request does not hit
 * `ENOENT ... app-paths-manifest.json` / `middleware-manifest.json` / unstyled shell (stale tree
 * from crash, interrupted compile, or dev:clean + first-request races from a previous run).
 */
function removeCorruptNextDistBeforeDev() {
  const distRoot = resolve(process.cwd(), NEXT_DIST);
  if (!existsSync(distRoot)) {
    return;
  }

  const cwd = process.cwd();
  const hasMiddlewareSource =
    existsSync(resolve(cwd, "middleware.ts")) || existsSync(resolve(cwd, "middleware.js"));

  const reasons = [];

  const appBuildManifest = resolve(distRoot, "app-build-manifest.json");
  const staticDir = resolve(distRoot, "static");
  if (existsSync(appBuildManifest) && !existsSync(staticDir)) {
    reasons.push("app-build-manifest present but no static/");
  }

  const serverDir = resolve(distRoot, "server");
  const appPathsManifest = resolve(serverDir, "app-paths-manifest.json");
  const middlewareManifest = resolve(serverDir, "middleware-manifest.json");
  if (existsSync(serverDir) && !existsSync(appPathsManifest)) {
    reasons.push(".next/server exists but app-paths-manifest.json is missing");
  }
  if (hasMiddlewareSource && existsSync(serverDir) && !existsSync(middlewareManifest)) {
    reasons.push(".next/server exists but middleware-manifest.json is missing");
  }

  if (reasons.length === 0) {
    return;
  }

  console.warn(`[sis-mvp] .next looks incomplete (${reasons.join(" · ")}). Removing it for a clean dev rebuild.`);
  rmSync(distRoot, { recursive: true, force: true });
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

/**
 * After `next dev` starts, pre-compile the most-accessed routes by sending a single GET each.
 * This prevents the first real user click from hitting an uncompiled route and getting HTML 500.
 * Failures are silently ignored — this is best-effort only.
 */
async function warmupDevRoutes() {
  const routes = ["/api/me", "/api/auth/sso/providers", "/api/staff/segmentation-config"];
  const base = `http://${HOST}:${PORT}`;

  // Wait for the server to accept connections before warming up
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(`${base}/api/me`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  await Promise.allSettled(routes.map((r) => fetch(`${base}${r}`).catch(() => {})));
  console.log("[sis-mvp] Route warm-up done — common API routes pre-compiled.");
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

  // Warm up common routes in the background after the server is ready
  warmupDevRoutes().catch(() => {});

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
  removeCorruptNextDistBeforeDev();
  ensureRuntimeDir();
  ensureSingleInstance();
  await ensurePortFree();
  // Do not delete `.next` while Next is already running. Use `npm run dev:clean` for a cold cache.
  // For Docker bind mounts, set `SIS_DEV_FILE_POLLING=1` to re-enable polling.

  const bundler = process.env.SIS_NEXT_DEV_BUNDLER === "turbo" ? "turbo" : "webpack";
  const useWebpack = bundler === "webpack";
  const devArgs = [
    "./node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    HOST,
    "--port",
    String(PORT),
    ...(useWebpack ? [] : ["--turbo"])
  ];

  if (useWebpack) {
    console.log(
      "[sis-mvp] Using webpack dev by default for stability. Set `SIS_NEXT_DEV_BUNDLER=turbo` only when you explicitly want Turbopack."
    );
  } else {
    console.warn(
      "[sis-mvp] Using Turbopack (`SIS_NEXT_DEV_BUNDLER=turbo`). If you see ENOENT on `.next/server/*.json` or `_buildManifest.js.tmp`, switch back to the default webpack dev."
    );
  }

  console.log(
    `[sis-mvp] Starting Next dev on http://${HOST}:${PORT} — wait until the terminal shows Ready/Compiled before opening the app (avoids ENOENT from a half-built .next on the first request).`
  );

  if (isNodeSupportedByNextEngines()) {
    startDev("node", devArgs);
    return;
  }

  console.warn(
    `[sis-mvp] Detected Node v${process.versions.node} (outside Next.js supported range). ` +
      "Using isolated Node 22 runtime for Next.js dev — prefer Node 20+ or 18.18+ so dev matches `npm install`."
  );
  startDev("npx", ["-y", "node@22", ...devArgs]);
}

void main();
