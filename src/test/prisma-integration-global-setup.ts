import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INTEGRATION_CRYPTO_ENV, INTEGRATION_DATABASE_URL } from "./integration-env";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");

function databaseNameFromUrl(rawUrl: string): string {
  return new URL(rawUrl).pathname.replace(/^\//, "");
}

function adminDatabaseUrlFromUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.pathname = "/postgres";
  url.searchParams.delete("schema");
  return url.toString();
}

function recreateIntegrationDatabase(databaseUrl: string) {
  const dbName = databaseNameFromUrl(databaseUrl);
  const adminUrl = adminDatabaseUrlFromUrl(databaseUrl);
  execFileSync("dropdb", ["--if-exists", "--force", "--maintenance-db", adminUrl, dbName], {
    cwd: root,
    stdio: "inherit"
  });
  execFileSync("createdb", ["--maintenance-db", adminUrl, dbName], {
    cwd: root,
    stdio: "inherit"
  });
}

export default async function prismaIntegrationGlobalSetup(): Promise<void> {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: INTEGRATION_DATABASE_URL,
    NODE_ENV: "test",
    ...INTEGRATION_CRYPTO_ENV
  };

  Object.assign(process.env, env);
  recreateIntegrationDatabase(INTEGRATION_DATABASE_URL);

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: root,
    env: { ...env },
    stdio: "inherit"
  });
  execFileSync(process.execPath, [tsxCli, "prisma/seed.ts"], { cwd: root, env: { ...env }, stdio: "inherit" });
  execFileSync(process.execPath, [tsxCli, "prisma/seed-integration-fixtures.ts"], {
    cwd: root,
    env: { ...env },
    stdio: "inherit"
  });
}
