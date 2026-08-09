import { expect, test, type Page } from '@playwright/test';

/**
 * The builder chrome, photographed on a REAL signed-in session.
 *
 * Not an assertion suite — a way to LOOK. Every chrome defect this app has had
 * was invisible in the source and obvious in a picture. It asserts only the
 * floor (we are on the builder, the chrome is present) so a run that silently
 * photographed a login page fails instead of producing pictures of nothing.
 *
 * Run: E2E_EMAIL=… E2E_PASSWORD=… npx playwright test --project=authenticated builder-look
 */
const PANES = ['Preview', 'Files', 'Code', 'More'] as const;

/** The org/slug of a project that has real content, found through the session. */
async function firstProject(page: Page): Promise<{ org: string; slug: string } | null> {
  const rows = await page.evaluate(async () => {
    try {
      const r = await fetch('/v1/projects', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!r.ok) return null;
      return (await r.json()) as Array<Record<string, unknown>>;
    } catch {
      return null;
    }
  });
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    const slug = typeof row.slug === 'string' ? row.slug : typeof row.name === 'string' ? row.name : '';
    const org = typeof row.org === 'string' ? row.org : '';
    if (slug && org) return { org, slug };
  }
  return null;
}

test('the boot state, photographed', async ({ page }) => {
  await page.goto('/dev');
  await expect(page).toHaveURL(/hanzo\.app\/dev/, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '.shots/boot.png' });
});

test('every pane opens on a real project and is photographed', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/hanzo\.app\/dashboard/, { timeout: 30_000 });

  const project = await firstProject(page);
  test.skip(!project, 'the account has no projects to open');

  await page.goto(`/dev/${project!.org}/${project!.slug}`);
  const bar = page.getByRole('tablist', { name: 'Editor view' });
  await expect(bar).toBeVisible({ timeout: 45_000 });

  for (const pane of PANES) {
    await bar.getByRole('tab', { name: pane }).click();
    await expect(bar.getByRole('tab', { name: pane })).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(700);
    await page.screenshot({ path: `.shots/builder-${pane.toLowerCase()}.png` });
  }

  // The console pulls up from the invisible edge: open it by keyboard on the
  // named separator, photograph, close.
  const edge = page.getByRole('separator', { name: /console/i });
  await edge.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '.shots/builder-console.png' });
});
