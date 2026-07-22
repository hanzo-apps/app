import { test, expect, type Page } from '@playwright/test';

/**
 * Authenticated product E2E — runs with the real signed-in session captured by
 * auth.setup.ts (storageState). Read-only against the target (no project
 * creation / no pushes), so it is safe to run against production.
 *
 * Covers the work this stream shipped: the unified shell + nav, the light/dark
 * migration (incl. the Tamagui --background fix), the now-functional settings
 * page, and git.hanzo.ai import discoverability.
 */

const bgToken = (page: Page) =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
  );

test.describe('hanzo.app — authenticated', () => {
  test('dashboard renders for a signed-in user (no login bounce)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/hanzo\.id|\/login(\?|$)/);
    await expect(
      page.getByText(/ready to build|your projects|dashboard/i).first(),
    ).toBeVisible();
  });

  test('light/dark: dark by default; toggling to light paints the app white', async ({ page }) => {
    await page.goto('/dashboard');

    // Default theme is dark → --background resolves to (near) black. This also
    // proves the Tamagui-override fix (bg-background would otherwise be #141414).
    const dark = await bgToken(page);
    expect(dark).toMatch(/oklch\(0%|^#000|rgb\(0, ?0, ?0/i);

    // Flip to light via the same next-themes store the user-menu toggle drives.
    await page.evaluate(() => localStorage.setItem('hanzo-app-theme', 'light'));
    await page.reload();

    const light = await bgToken(page);
    expect(light).toMatch(/oklch\(100%|^#fff|rgb\(255, ?255, ?255/i);
    // The body actually paints white — the split-theme bug that was fixed.
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toMatch(/rgb\(255, ?255, ?255|oklch\(1 /i);

    await page.evaluate(() => localStorage.setItem('hanzo-app-theme', 'dark')); // restore
  });

  test('settings page is functional: theme + live model list, no dead placeholders', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /general settings/i })).toBeVisible();

    // Theme select is enabled + wired to next-themes (was a disabled placeholder).
    const theme = page.locator('#theme-select');
    await expect(theme).toBeEnabled();
    await expect(theme).toHaveValue(/light|dark|system/);

    // Default AI Model carries the LIVE catalog (enso), not the stale zen3-omni.
    const model = page.locator('#model-select');
    await expect(model).toBeEnabled();
    await expect(model.locator('option')).toContainText([/enso/i]);
    await expect(model.locator('option').filter({ hasText: /zen3-omni/i })).toHaveCount(0);

    // Language dead-control was removed.
    await expect(page.getByText(/^language$/i)).toHaveCount(0);
  });

  test('unified shell: core nav routes resolve without 404 or login bounce', async ({ page }) => {
    for (const route of ['/dashboard', '/projects', '/agents', '/skills', '/usage', '/settings']) {
      await page.goto(route);
      await expect(page, `route ${route}`).not.toHaveURL(/hanzo\.id|\/login(\?|$)/);
      await expect(page.locator('body'), `route ${route}`).not.toContainText(/404|page not found/i);
    }
  });

  test('import surfaces git.hanzo.ai (edit your own repos)', async ({ page }) => {
    // The import panel (ImportGitPanel) renders on /new — the New Project flow. Its
    // always-available paste-URL fallback names git.hanzo.ai first (the
    // discoverability fix): paste git.hanzo.ai/<org>/<repo> → edit → Push to Git.
    await page.goto('/new');
    await expect(page.getByText(/git\.hanzo\.ai/i).first()).toBeVisible({ timeout: 15_000 });
    // And the paste input carries the git.hanzo.ai example.
    await expect(
      page.getByPlaceholder(/git\.hanzo\.ai/i),
    ).toBeVisible();
  });
});
