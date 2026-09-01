import { defineConfig, devices } from "@playwright/test";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  timeout: 30_000,

  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Levanta la app sola para los tests. Si ya tenes una corriendo, la reusa.
  webServer: {
    command: "npm run build && npm run start",
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
