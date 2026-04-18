import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const DEFAULT_HOST = process.env.SIS_POSTGRES_HOST?.trim() || "127.0.0.1";
const DEFAULT_PORT = process.env.SIS_POSTGRES_PORT?.trim() || "5432";
const DEFAULT_USER = process.env.SIS_POSTGRES_USER?.trim() || process.env.USER || "postgres";
const DEFAULT_PASSWORD = process.env.SIS_POSTGRES_PASSWORD?.trim() || "";
const DEFAULT_SCHEMA = process.env.SIS_POSTGRES_SCHEMA?.trim() || "public";

function buildDatabaseUrl(dbName) {
  const url = new URL("postgresql://localhost");
  url.hostname = DEFAULT_HOST;
  url.port = DEFAULT_PORT;
  url.pathname = `/${dbName}`;
  url.searchParams.set("schema", DEFAULT_SCHEMA);
  if (DEFAULT_USER) {
    url.username = DEFAULT_USER;
  }
  if (DEFAULT_PASSWORD) {
    url.password = DEFAULT_PASSWORD;
  }
  return url.toString();
}

export function databaseNameFromUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  return parsed.pathname.replace(/^\//, "");
}

export function adminDatabaseUrlFromUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  parsed.pathname = "/postgres";
  parsed.searchParams.delete("schema");
  return parsed.toString();
}

export function isSafePostgresDatabaseName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

export const prismaDevDatabaseUrl =
  process.env.SIS_DEV_DATABASE_URL?.trim() || buildDatabaseUrl("sis_mvp_dev");
export const prismaDevDatabaseName = databaseNameFromUrl(prismaDevDatabaseUrl);
export const prismaDevAdminDatabaseUrl = adminDatabaseUrlFromUrl(prismaDevDatabaseUrl);

/** Same default as `src/test/integration-env.ts` (Vitest integration DB). */
export const prismaIntegrationDatabaseUrl =
  process.env.SIS_TEST_DATABASE_URL?.trim() || buildDatabaseUrl("sis_mvp_integration");
export const prismaIntegrationDatabaseName = databaseNameFromUrl(prismaIntegrationDatabaseUrl);
export const prismaIntegrationAdminDatabaseUrl = adminDatabaseUrlFromUrl(prismaIntegrationDatabaseUrl);

export const repoRoot = root;
