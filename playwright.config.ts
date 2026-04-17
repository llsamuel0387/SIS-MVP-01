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
    // Production build + start avoids a separate `.next-e2e` dist dir. Uses the default `.next`.
    // Do not run alongside `npm run dev` locally: `next build` overwrites `.next` while the dev server is running.
    command: `npm run build && npx next start -p ${port} -H ${host}`,
    url: baseURL,
    // Avoid reusing an unrelated process already bound to :3100 (tests then see the wrong app).
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe"
  }
});
