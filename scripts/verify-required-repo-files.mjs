#!/usr/bin/env node
/**
 * Fails if eslint.config.mjs or AGENTS.md are missing from disk or not in the Git index,
 * so they cannot be accidentally omitted from commits / CI checkouts.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const required = ["eslint.config.mjs", "AGENTS.md"];

const errors = [];
for (const rel of required) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`${rel} is missing on disk — add the file and commit it`);
    continue;
  }
  let tracked = "";
  try {
    tracked = execSync(`git ls-files -- ${rel}`, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    tracked = "";
  }
  if (!tracked) {
    errors.push(`${rel} is not in the Git index — run: git add ${rel}`);
  }
}

if (errors.length > 0) {
  console.error("check:repo-files failed:\n\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log("check:repo-files OK");
