import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Make Clerk dev keys from .env.local visible to the test runner (global setup
// and `hasClerkTestKeys()`), like `next dev` does for the app. Variables
// already set in the environment (CI) win.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const isCI = Boolean(process.env.CI);
const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

/**
 * Optional path to a Chromium binary, for machines where browsers are
 * preinstalled for a different Playwright version (e.g. agent sandboxes:
 * `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`). CI and dev
 * machines leave it unset and use `npx playwright install` browsers.
 */
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

/**
 * E2E tests (see tests/README.md). Two projects: desktop Chromium and WebKit
 * with an iPhone 14 viewport (mobile Safari is a primary target).
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutablePath && {
          launchOptions: { executablePath: chromiumExecutablePath },
        }),
      },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
  // CI tests the production build; locally `next dev` starts faster and an
  // already running dev server on the same port is reused.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: isCI
          ? `npm run build && npm run start -- --port ${port}`
          : `npm run dev -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
