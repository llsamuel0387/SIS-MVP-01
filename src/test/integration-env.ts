const DEFAULT_HOST = process.env.SIS_POSTGRES_HOST?.trim() || "127.0.0.1";
const DEFAULT_PORT = process.env.SIS_POSTGRES_PORT?.trim() || "5432";
const DEFAULT_USER = process.env.SIS_POSTGRES_USER?.trim() || process.env.USER || "postgres";
const DEFAULT_PASSWORD = process.env.SIS_POSTGRES_PASSWORD?.trim() || "";
const DEFAULT_SCHEMA = process.env.SIS_POSTGRES_SCHEMA?.trim() || "public";

function buildIntegrationDatabaseUrl(dbName: string): string {
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

/** PostgreSQL database used only for API integration tests. */
export const INTEGRATION_DATABASE_URL =
  process.env.SIS_TEST_DATABASE_URL?.trim() || buildIntegrationDatabaseUrl("sis_mvp_integration");

/** Deterministic keys so encryption paths work in CI without copying `.env`. */
export const INTEGRATION_CRYPTO_ENV = {
  PERSON_DATA_KEY_BASE64: "BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  PII_INDEX_KEY_BASE64: "BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  JWT_ACCESS_SECRET: "integration-test-jwt-access-secret-key-32x!!",
  JWT_REFRESH_SECRET: "integration-test-jwt-refresh-secret-key-32x!!"
} as const;
