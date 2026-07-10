import { defineConfig, devices } from '@playwright/test';

// Lean config for the games visual e2e gate. The WebGL player animates a canvas
// via requestAnimationFrame; recording video/trace of that pins the CPU and
// starves the dev server, so we disable both here and rely on the explicit
// screenshots the spec saves to tests/e2e/screenshots. Chromium only, retries on
// (dev cold-compile), single worker for determinism.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /games\.spec\.ts/,
  outputDir: './tests/e2e/test-results',
  timeout: 60 * 1000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 2,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
