import { test, expect } from '@playwright/test';

/**
 * Auth contract (HIP-0111): hanzo.app has NO local login. A protected route
 * 302s through the app to the hanzo.id IAM authorize endpoint with
 * client_id=hanzo-app (PKCE). These tests pin THAT redirect contract — the
 * one thing the app owns. IAM's own login DOM belongs to hanzo.id and is not
 * asserted here; real sign-in is covered by the authenticated project
 * (auth.setup.ts + storageState) when E2E_EMAIL/E2E_PASSWORD are provisioned.
 */
test.describe('Authentication Flow', () => {
  test('protected route redirects to hanzo.id authorize with the app client_id', async ({ page }) => {
    await page.goto('/dashboard');

    // Lands on the IAM host (authorize may forward to its /login UI).
    await expect(page).toHaveURL(/hanzo\.id/);
    expect(page.url()).toContain('client_id=hanzo-app');
  });

  test('the IAM hand-off carries the PKCE authorize parameters', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/hanzo\.id/);

    const url = new URL(page.url());
    const params = new URLSearchParams(url.search);
    expect(params.get('client_id')).toBe('hanzo-app');
    expect(params.get('response_type')).toBe('code');
    expect(params.get('redirect_uri')).toContain('hanzo.app');
    expect(params.get('scope') || '').toContain('openid');
  });

  test('public routes stay public — no login wall on the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/hanzo\.id/);
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
