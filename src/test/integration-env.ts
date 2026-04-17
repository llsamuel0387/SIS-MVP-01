import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** SQLite file used only for API integration tests (never commit the DB file). */
export const INTEGRATION_DATABASE_URL = pathToFileURL(path.join(root, "prisma", "test-integration.db")).href;

/** Deterministic keys so encryption paths work in CI without copying `.env`. */
export const INTEGRATION_CRYPTO_ENV = {
  PERSON_DATA_KEY_BASE64: "BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  PII_INDEX_KEY_BASE64: "BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  JWT_ACCESS_SECRET: "integration-test-jwt-access-secret-key-32x!!",
  JWT_REFRESH_SECRET: "integration-test-jwt-refresh-secret-key-32x!!"
} as const;
