import { expect, test } from '@playwright/test';

/**
 * The builder chrome, photographed.
 *
 * Not an assertion suite — a way to LOOK at the panes on a real signed-in
 * session, because every previous chrome defect in this app (the squashed
 * glyphs, the 2px hover halo, the starved centre cluster) was invisible in the
 * source and obvious in a screenshot. It asserts only the floor: that the bar
 * is there and each pane opens, so a run that silently photographed a login
 * page fails instead of producing four pictures of nothing.
 *
 * Run: `E2E_EMAIL=… E2E_PASSWORD=… npx playwright test --project=authed builder-look`
 */
const PANES = ['Preview', 'Files', 'Code', 'More'] as const;

test('every pane opens and is photographed', async ({ page }) => {
  await page.goto('/dev');
  // The floor: a signed-out run lands on hanzo.id and would otherwise take four
  // screenshots of a login form and pass.
  await expect(page).toHaveURL(/hanzo\.app\/dev/, { timeout: 30_000 });

  const bar = page.getByRole('tablist', { name: 'Editor view' });
  await expect(bar).toBeVisible({ timeout: 30_000 });

  for (const pane of PANES) {
    await bar.getByRole('tab', { name: pane }).click();
    // The open pane is the one wearing its label — that IS the design, so it is
    // also the thing worth asserting.
    await expect(bar.getByRole('tab', { name: pane })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.waitForTimeout(600);
    await page.screenshot({ path: `.shots/builder-${pane.toLowerCase()}.png`, fullPage: false });
  }
});
