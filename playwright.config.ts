import { defineConfig, devices } from "@playwright/test";

/**
 * Guided-tour tests (docs/SCOPE.md #41): `npm run test:tour`. Runs against http://localhost:3000, reusing a dev
 * server that's already up, otherwise starting one. Chromium only (`npx playwright install chromium`).
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 800 },
    // Tour animations off: faster, and it exercises the reduced-motion path.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
