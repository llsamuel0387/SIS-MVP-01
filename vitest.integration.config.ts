import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { INTEGRATION_CRYPTO_ENV, INTEGRATION_DATABASE_URL } from "./src/test/integration-env";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: "integration",
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    globalSetup: [path.join(root, "src/test/prisma-integration-global-setup.ts")],
    env: {
      DATABASE_URL: INTEGRATION_DATABASE_URL,
      NODE_ENV: "test",
      ...INTEGRATION_CRYPTO_ENV
    }
  },
  resolve: {
    alias: {
      "@": path.join(root, "src")
    }
  }
});
