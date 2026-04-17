#!/usr/bin/env node
/**
 * Ensures every App Router API route that exports a mutating handler (POST/PUT/PATCH/DELETE)
 * calls `writeAuditLogForRequest` so audit `detail` always gets `path` + `httpMethod` via @/lib/audit.
 *
 * By default the call must appear in that route's `route.ts`. A tiny explicit allowlist
 * (`ALLOWED_HELPER_AUDIT_ROUTES`) documents exceptions where audits live only in named helpers.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiDir = path.join(root, "src", "app", "api");

const mutationExportRe = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/;

/**
 * Mutating App Router paths (e.g. `/api/auth/login`) where audit is allowed to live
 * only in the listed helper file(s). Every other mutating route must contain
 * `writeAuditLogForRequest` in its own `route.ts` so the check cannot silently miss
 * a thin route that forgot to audit.
 */
const ALLOWED_HELPER_AUDIT_ROUTES = [
  {
    routePath: "/api/auth/login",
    helperPaths: [path.join(root, "src", "lib", "auth", "login-route.helpers.ts")],
    // Login response branching and audit are intentionally centralized in the helper.
  },
];

function routeFileFromApiRoutePath(routePath) {
  const withoutApi = routePath.replace(/^\/api\/?/, "");
  const segments = withoutApi.split("/").filter(Boolean);
  return path.join(apiDir, ...segments, "route.ts");
}

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walk(p));
    } else if (ent.name === "route.ts") {
      out.push(p);
    }
  }
  return out;
}

const allowedRouteFiles = new Map(
  ALLOWED_HELPER_AUDIT_ROUTES.map((entry) => [
    path.normalize(routeFileFromApiRoutePath(entry.routePath)),
    entry.helperPaths.map((p) => path.normalize(p)),
  ])
);

const routeFiles = walk(apiDir);

const offenders = [];
for (const file of routeFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (!mutationExportRe.test(text)) {
    continue;
  }
  if (text.includes("writeAuditLogForRequest")) {
    continue;
  }
  const normalizedFile = path.normalize(file);
  const helperPaths = allowedRouteFiles.get(normalizedFile);
  if (helperPaths) {
    const allHelpersAudited = helperPaths.every(
      (helperPath) =>
        fs.existsSync(helperPath) &&
        fs.readFileSync(helperPath, "utf8").includes("writeAuditLogForRequest")
    );
    if (allHelpersAudited) {
      continue;
    }
  }
  offenders.push(path.relative(root, file));
}

if (offenders.length > 0) {
  console.error(
    "Mutation API routes must import and call writeAuditLogForRequest in route.ts, " +
      "unless listed in ALLOWED_HELPER_AUDIT_ROUTES with audited helperPaths (see src/lib/audit.ts):\n\n" +
      offenders.map((f) => `  - ${f}`).join("\n")
  );
  process.exit(1);
}

console.log(`check:mutation-audit OK (${routeFiles.length} route files scanned)`);
