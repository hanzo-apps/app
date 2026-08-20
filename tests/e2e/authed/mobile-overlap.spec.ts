import { expect, test } from '@playwright/test';

/**
 * The builder on a small screen, measured. Both guards here are about a BOX,
 * which is the one thing no unit test and no desktop screenshot can see.
 */
/** The builder, on a real project, at a pinned size. `false` = this account has none. */
async function builderAt(page: any, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/dashboard');
  const project = await page.evaluate(async () => {
    const r = await fetch('/v1/projects', { credentials: 'include' });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<Record<string, unknown>>;
    for (const row of rows) if (typeof row.slug === 'string' && typeof row.org === 'string') return { org: row.org, slug: row.slug };
    return null;
  });
  if (!project) return false;
  await page.goto(`/dev/${project.org}/${project.slug}`);
  await page.waitForTimeout(5000);
  return true;
}

async function overlapsAt(page: any, width: number, height: number) {
  if (!(await builderAt(page, width, height))) return null;
  return page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll('header button, header a, [role="tablist"] [role="tab"], button, a'));
    const rects = controls
      .map((el) => ({ label: (el.getAttribute('aria-label') || el.textContent || '?').slice(0, 24), r: el.getBoundingClientRect() }))
      .filter((x) => x.r.width > 0 && x.r.height > 0 && x.r.top >= 0 && x.r.bottom <= 60);
    const overlaps: string[] = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].r, b = rects[j].r;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      // >4px both axes: adjacent controls legitimately touch; a PRESS-stealing
      // overlap is a real intersection, not a shared border.
      if (ox > 4 && oy > 4) overlaps.push(`${rects[i].label} ∩ ${rects[j].label} ${Math.round(ox)}x${Math.round(oy)}`);
    }
    return { count: rects.length, overlaps };
  });
}

/**
 * The top band never overlaps itself. Below ~1440px the centre cluster and the
 * pinned Share/Publish actions USED to overlap (390px: 4 pairs, Code ∩ Publish
 * by 42x44px) — a press landed on whichever painted last. The mobile header
 * collapses to one icon row, and this is what keeps it collapsed.
 */
for (const [w, h, name] of [[390, 844, 'phone'], [834, 1194, 'tablet']] as const) {
  test(`top band has no overlapping controls at ${name} (${w})`, async ({ page }) => {
    const out = await overlapsAt(page, w, h);
    test.skip(!out, 'no projects');
    // Coverage floor first: a page that rendered nothing passes vacuously.
    expect(out!.count).toBeGreaterThanOrEqual(3);
    expect(out!.overlaps).toEqual([]);
  });
}

/**
 * THE MODEL + SANDBOX PANEL IS A SHEET AT PHONE WIDTH, and only a rendered box
 * can say whether it is one.
 *
 * `.hz-picker-panel` asks for `position: fixed` with 8px of inset a side. A
 * fixed box takes its containing block from the nearest TRANSFORMED ancestor,
 * and gui translates the popper box the panel sits in, which is 0x0 — so left
 * and right meet and the sheet renders as a ~10px hairline off the top of the
 * screen, with every declaration in the stylesheet still reading correct. A
 * width is what tells those two apart.
 */
test('the model picker opens as a sheet at phone width', async ({ page }) => {
  test.skip(!(await builderAt(page, 390, 844)), 'no projects');
  await page.locator('#composer-settings').click();
  const panel = page.locator('.hz-picker-panel');
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  // Nearly the whole screen wide, and wholly on it. Stated as a property rather
  // than as 374, so the inset can be retuned without rewriting the guard.
  expect(box.width, `the sheet measured ${Math.round(box.width)}px on a 390px screen`)
    .toBeGreaterThan(390 - 40);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  // And a row inherits it, which is the thing a person actually reads.
  const row = (await page.getByTestId('runtime-kata-fc').boundingBox())!;
  expect(row.width).toBeGreaterThan(390 - 60);
  await page.screenshot({ path: 'tests/e2e/test-results/picker-sheet-390.png' });
});
