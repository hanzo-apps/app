import { expect, test } from '@playwright/test';

/**
 * The signed-in surfaces, photographed dark on production — settings,
 * dashboard, and the composer's [+] menu. Same discipline as builder-look:
 * assert only the floor (the right URL, a landmark present) so a run that
 * photographed a login page fails instead of producing pictures of nothing.
 */
test('dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/hanzo\.app\/dashboard/, { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '.shots/dashboard.png', fullPage: false });
});

test('settings', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL(/hanzo\.app\/settings/, { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '.shots/settings.png', fullPage: false });
  // The appearance knobs are the "fully customizable" claim — capture the
  // whole page too, since the sections collapse.
  await page.screenshot({ path: '.shots/settings-full.png', fullPage: true });
});

test('the composer plus menu, open', async ({ page }) => {
  await page.goto('/dashboard');
  const project = await page.evaluate(async () => {
    try {
      const r = await fetch('/v1/projects', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!r.ok) return null;
      const rows = (await r.json()) as Array<Record<string, unknown>>;
      for (const row of rows) {
        const slug = typeof row.slug === 'string' ? row.slug : '';
        const org = typeof row.org === 'string' ? row.org : '';
        if (slug && org) return { org, slug };
      }
      return null;
    } catch {
      return null;
    }
  });
  test.skip(!project, 'no projects');
  await page.goto(`/dev/${project!.org}/${project!.slug}`);
  const plus = page.getByRole('button', { name: 'Add to this build' });
  await expect(plus).toBeVisible({ timeout: 45_000 });
  await plus.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '.shots/plus-menu.png' });
});
