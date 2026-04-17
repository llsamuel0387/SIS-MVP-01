import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = 3100;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${port} -H ${host}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    // Isolate from `npm run dev` (port 3000), which uses the default `.next` output dir.
    env: { ...process.env, NEXT_DIST_DIR: ".next-e2e" }
  }
});
