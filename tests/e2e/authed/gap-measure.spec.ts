import { expect, test } from '@playwright/test';

/** Measure the REAL gap: composer's right edge → preview panel's left edge. */
test('measure the chat→preview gap', async ({ page }) => {
  await page.goto('/dashboard');
  const project = await page.evaluate(async () => {
    const r = await fetch('/v1/projects', { credentials: 'include' });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<Record<string, unknown>>;
    for (const row of rows) {
      if (typeof row.slug === 'string' && typeof row.org === 'string')
        return { org: row.org, slug: row.slug };
    }
    return null;
  });
  test.skip(!project, 'no projects');
  await page.goto(`/dev/${project!.org}/${project!.slug}`);
  await expect(page.getByRole('tablist', { name: 'Editor view' })).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(800);

  const out = await page.evaluate(() => {
    // The COMPOSER's glass, not a chip's: the one that contains the textarea.
    const glass = Array.from(document.querySelectorAll('.glass')).find((el) => el.querySelector('textarea')) ?? null;
    // The preview frame, which is inset 0 of the stage and so shares its left
    // edge. The stage used to be found by a decorative class (`.preview-stage`,
    // the old grid); that class is gone, and reaching for the pane through the
    // thing it exists to show is the sturdier handle anyway.
    const stage = document.querySelector('iframe.preview-frame');
    const sep = document.querySelector('[aria-label="Resize chat and preview panes"]');
    const r = (el: Element | null) => el?.getBoundingClientRect() ?? null;
    return {
      composer: r(glass),
      panel: r(stage),
      resizer: r(sep),
      viewport: window.innerWidth,
    };
  });
  const gap =
    out.panel && out.composer ? Math.round(out.panel.x - (out.composer.x + out.composer.width)) : -1;
  console.log(
    `[gap] viewport=${out.viewport} composerRight=${Math.round((out.composer?.x ?? 0) + (out.composer?.width ?? 0))} panelLeft=${Math.round(out.panel?.x ?? -1)} GAP=${gap}px resizerW=${Math.round(out.resizer?.width ?? -1)}`,
  );
  // The guard: the whole seam (chat pad + resizer + gutter) stays under 40px.
  // It measured 56 when the resizer's width="$3" resolved to 36 through the
  // size scale. -1 means an element was not found, which must fail loudly.
  expect(gap).toBeGreaterThan(0);
  expect(gap).toBeLessThanOrEqual(40);
  expect(out.resizer?.width ?? 99).toBeLessThanOrEqual(12);
});
