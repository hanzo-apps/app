import { defineConfig, devices } from '@playwright/test';

// Target the deployed app by default; override for local dev
// (PLAYWRIGHT_BASE_URL=http://localhost:3000).
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://hanzo.app';
const isLocal = /localhost|127\.0\.0\.1/.test(baseURL);
const authFile = 'tests/e2e/.auth/user.json';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  timeout: 45 * 1000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'tests/e2e/playwright-report', open: 'never' }],
    ['junit', { outputFile: 'tests/e2e/junit.xml' }],
    ['json', { outputFile: 'tests/e2e/test-results.json' }],
    ['list'],
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Public / unauthenticated specs (homepage, games, auth-redirect, …).
    {
      name: 'public',
      testIgnore: ['**/authed/**', '**/auth.setup.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    // One-time real sign-in via hanzo.id (OIDC PKCE); persists the session.
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    // Authenticated product specs — reuse the signed-in session.
    {
      name: 'authenticated',
      testMatch: '**/authed/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },
  ],

  // Only spin up a local dev server when actually targeting localhost.
  ...(isLocal
    ? {
        webServer: {
          command: 'pnpm run dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }
    : {}),
});
