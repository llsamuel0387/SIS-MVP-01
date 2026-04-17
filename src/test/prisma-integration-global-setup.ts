import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INTEGRATION_CRYPTO_ENV, INTEGRATION_DATABASE_URL } from "./integration-env";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default async function prismaIntegrationGlobalSetup(): Promise<void> {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: INTEGRATION_DATABASE_URL,
    NODE_ENV: "test",
    ...INTEGRATION_CRYPTO_ENV
  };

  Object.assign(process.env, env);

  execSync("npx prisma db push", { cwd: root, env: { ...env }, stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { cwd: root, env: { ...env }, stdio: "inherit" });
  execSync("npx tsx prisma/seed-integration-fixtures.ts", { cwd: root, env: { ...env }, stdio: "inherit" });
}
