import { defineConfig, devices } from '@playwright/test';

/**
 * Its own config: these specs need no server and no session. They drive
 * `page.setContent` against a real sandboxed iframe, which is the only place the
 * property under test — what a browser denies across an opaque origin — is real.
 * The suite in e2e/ proper needs a running app and an authenticated user.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'] },
});
