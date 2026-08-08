import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Real Hanzo IAM sign-in (HIP-0111 OIDC PKCE via hanzo.id) — the ONE way the app
 * authenticates. Runs once as a Playwright dependency project and persists the
 * session (localStorage token store + session cookie) to storageState, which every
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

  // A protected route redirects straight to the hanzo.id (IAM) authorize form
  // — there is no intermediate in-app login to click through. Do NOT touch the
  // "Continue with <provider>" buttons; use the email/password fields + "Sign in".
  await page.goto('/dashboard');
  await page.waitForURL(/hanzo\.id\/login\/oauth\/authorize/, { timeout: 30_000 });

  // WAIT FOR THE FORM'S OWN CONFIG. The login SPA fetches `get-app-login`,
  // which supplies the ORGANIZATION the credential belongs to; submit before it
  // lands and IAM answers 400 "organization, username and password are
  // required" while the form silently stays put — measured on the wire, twice.
  // A person types slower than the fetch; a harness must wait for it.
  await page
    .waitForResponse((r) => r.url().includes('get-app-login') && r.ok(), { timeout: 15_000 })
    .catch(() => {
      /* already loaded before we attached — fine */
    });
  await page.waitForLoadState('networkidle').catch(() => {});

  // The identity field is found by what it SAYS, not by what it is typed as.
  //
  // This read `input[type="text"]`, and hanzo.id's form now labels that field
  // "Email or username" — whose input is `type="email"`. The locator matched
  // nothing, `fill` resolved against nothing, and the run pressed Sign in on an
  // EMPTY form: the failure looked exactly like wrong credentials (bounced back
  // to the login page), which is the most expensive way for a harness to lie.
  //
  // Three strategies, first hit wins, so a form that changes its markup again
  // does not take the whole authenticated suite down with it. A label is the
  // most stable of the three because it is the thing a person reads.
  const identity = page
    .getByLabel(/email|username/i)
    .or(page.locator('input[type="email"]'))
    .or(page.locator('input[type="text"]'))
    .first();
  await identity.waitFor({ state: 'visible', timeout: 15_000 });
  await identity.fill(email);

  const secret = page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first();
  await secret.fill(password);

  // Assert the form CARRIES what was typed before submitting. An empty submit
  // and a rejected submit land in the same place, and only this tells them
  // apart — so a selector that stops matching fails here, naming itself, rather
  // than 30 seconds later as "the credentials are wrong".
  await expect(identity).toHaveValue(email);
  await expect(secret).not.toHaveValue('');

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Success → callback exchanges the PKCE code → back on hanzo.app. IAM may
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
