import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Real Hanzo IAM sign-in (HIP-0111 OIDC PKCE via hanzo.id) — the ONE way the app
 * authenticates. Runs once as a Playwright dependency project and persists the
 * session (cookies incl. the httpOnly `hanzo_token`) to storageState, which every
 * `authed/*.spec.ts` reuses. No mock cookies — a real logged-in session.
 *
 * Credentials come from the environment (CI secrets, sourced from KMS) — NEVER
 * hardcoded. `E2E_EMAIL` / `E2E_PASSWORD` (e.g. the seeded superuser z@<domain>).
 */
const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate via Hanzo IAM (hanzo.id OIDC)', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'E2E_EMAIL and E2E_PASSWORD must be set (CI secrets / KMS) for authenticated E2E.',
    );
  }

  // A protected route redirects straight to the hanzo.id (Casdoor) authorize form
  // — there is no intermediate in-app login to click through. Do NOT touch the
  // "Continue with <provider>" buttons; use the email/password fields + "Sign in".
  await page.goto('/dashboard');
  await page.waitForURL(/hanzo\.id\/login\/oauth\/authorize/, { timeout: 30_000 });

  // The custom hanzo/id UI renders bare inputs (no name/id): one text, one password.
  await page.locator('input[type="text"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Success → callback exchanges the PKCE code → back on hanzo.app. Casdoor may
  // interpose a one-time consent; approve it if shown. If we're bounced back to the
  // form with an error, the creds are wrong — fail loudly rather than hang.
  const consent = page.getByRole('button', { name: /^(authorize|allow|agree|continue)$/i });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (/hanzo\.app\//.test(url) && !/\/auth\/callback/.test(url)) break;
    if (await consent.count().catch(() => 0)) {
      await consent.first().click().catch(() => {});
    }
    const err = await page
      .getByText(/incorrect|invalid|wrong password|does not exist|not found/i)
      .count()
      .catch(() => 0);
    if (err) throw new Error('IAM sign-in rejected the credentials (E2E_EMAIL/E2E_PASSWORD).');
    await page.waitForTimeout(500);
  }

  // Prove the session is real: the dashboard renders WITHOUT bouncing to login.
  await page.goto('/dashboard');
  await expect(page).not.toHaveURL(/hanzo\.id|\/login(\?|$)/);
  await expect(page.locator('body')).toContainText(/dashboard|projects|build|ready to build/i, {
    timeout: 15_000,
  });

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
