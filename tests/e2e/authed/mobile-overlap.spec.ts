import { expect, test } from '@playwright/test';

/**
 * The top band never overlaps itself. Below ~1440px the centre cluster and the
 * pinned Share/Publish actions USED to overlap (390px: 4 pairs, Code ∩ Publish
 * by 42x44px) — a press landed on whichever painted last. The fix was the
 * mobile header collapsing to one icon row; this guard is what keeps it
 * collapsed. Only a browser reading rendered geometry can see this — a desktop
 * screenshot cannot.
 */
async function overlapsAt(page: any, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/dashboard');
  const project = await page.evaluate(async () => {
    const r = await fetch('/v1/projects', { credentials: 'include' });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<Record<string, unknown>>;
    for (const row of rows) if (typeof row.slug === 'string' && typeof row.org === 'string') return { org: row.org, slug: row.slug };
    return null;
  });
  if (!project) return null;
  await page.goto(`/dev/${project.org}/${project.slug}`);
  await page.waitForTimeout(5000);
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

for (const [w, h, name] of [[390, 844, 'phone'], [834, 1194, 'tablet']] as const) {
  test(`top band has no overlapping controls at ${name} (${w})`, async ({ page }) => {
    const out = await overlapsAt(page, w, h);
    test.skip(!out, 'no projects');
    // Coverage floor first: a page that rendered nothing passes vacuously.
    expect(out!.count).toBeGreaterThanOrEqual(3);
    expect(out!.overlaps).toEqual([]);
  });
}
