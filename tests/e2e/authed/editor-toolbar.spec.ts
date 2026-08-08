import { test, expect } from '@playwright/test'

/**
 * The builder toolbar, measured in a browser.
 *
 * The defect this exists for was arithmetic, and it was invisible to every kind
 * of check except this one. A Tamagui Button carries 12px of horizontal padding
 * for its label. Pin the box to a fixed width without zeroing that padding and
 * only `size - 24` is left for the glyph; `svg { max-width: 100% }` then shrinks
 * the icon to fit rather than overflowing. Nothing throws, nothing warns,
 * nothing clips — the icon just quietly stops being square:
 *
 *   28px device toggle          -> 16px icon rendered at  2px
 *   32px history/refresh/open   -> 16px icon rendered at  6px
 *   36px control                -> 16px icon rendered at 10px
 *
 * Six icons in one bar, each a different sliver. That is what "the buttons and
 * icons look wildly inconsistent" was.
 *
 * The fix is `@hanzo/ui`'s own `size="icon-sm" | "icon" | "icon-lg"` (32/36/40),
 * which zeroes the padding from INSIDE the component. A local helper spreading
 * `paddingHorizontal: 0` was tried first and was silently dropped by Button —
 * so it shipped, the unit test guarding it stayed green, and the icons stayed
 * squashed. That helper is deleted. THIS is the guard, because only a browser
 * reading rendered geometry can tell a correct recipe from one that arrives.
 *
 * COVERAGE FLOOR FIRST. Every assertion below is of the form "no glyph is
 * squashed", and a page with no glyphs satisfies that perfectly. Written without
 * the floor, this spec passes against the hanzo.id sign-in page — measured, not
 * hypothesised: an anonymous run of exactly these assertions reported "no
 * squashed glyphs" while looking at a login form. So the count is asserted
 * before the geometry is.
 */

/** `size="icon-sm"` — the bar's one icon-control size. */
const CONTROL = 32

/** Toolbar sits in the top band of the viewport. */
const TOP_BAND = 120

/**
 * How many icons the builder toolbar shows at 1440px. The bar carries the
 * back/home control, the history and refresh and open-in-new controls, the
 * device-size segment, and the account control. Eight is comfortably under the
 * real count and comfortably over zero, which is the number that made the
 * anonymous run "pass".
 */
const FLOOR = 6

type Glyph = {
  w: number
  h: number
  declared: number | null
  ctrlW: number | null
  ctrlH: number | null
  label: string
}

test.describe('builder toolbar · geometry', () => {
  // A geometry spec PINS its viewport. The bar is breakpoint-gated — the centre
  // cluster (device toggle, refresh, page selector, open-in-new) is `display:
  // none` below `$lg` — so inheriting the project's default width measured a
  // bar that legitimately had no centre controls and reported "0 glyphs".
  // 1440 is the width the fix was verified at.
  test.use({ viewport: { width: 1440, height: 900 } })

  test('every toolbar glyph renders at its declared size', async ({ page }) => {
    test.setTimeout(90_000)

    await page.goto('/dev?template=hanzo-apps/prism-react&action=edit', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    // The toolbar is client-rendered; wait for the bar itself rather than a
    // fixed sleep. If sign-in did not carry over, this is where it fails — and
    // it SHOULD fail here rather than sail on to measure a login form.
    await expect(page, 'the editor must not bounce to the IdP').toHaveURL(/\/dev/, {
      timeout: 30_000,
    })
    // Wait for the PRECONDITION this test measures, not for a proxy. Two proxies
    // were tried and both were wrong: a raw `svg` count raced the loading
    // spinner (itself an svg, so it attached while the page was still black),
    // and a named control raced the breakpoint-gated centre cluster. Polling the
    // actual quantity under test cannot drift from it.
    await page.waitForFunction(
      ({ band, floor }) =>
        Array.from(document.querySelectorAll('svg')).filter((s) => {
          const r = s.getBoundingClientRect()
          return r.top < band && r.width > 0 && s.closest('button,[role="button"],a')
        }).length >= floor,
      { band: TOP_BAND, floor: FLOOR },
      { timeout: 45_000 },
    )

    const glyphs: Glyph[] = await page.evaluate((band) => {
      const out: Glyph[] = []
      for (const svg of Array.from(document.querySelectorAll('svg'))) {
        const r = svg.getBoundingClientRect()
        if (r.top >= band || (r.width === 0 && r.height === 0)) continue
        const ctrl = svg.closest('button,[role="button"],a') as HTMLElement | null
        const cr = ctrl?.getBoundingClientRect() ?? null
        const dec = svg.getAttribute('width')
        out.push({
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
          declared: dec ? Number(dec) : null,
          ctrlW: cr ? +cr.width.toFixed(1) : null,
          ctrlH: cr ? +cr.height.toFixed(1) : null,
          label: ctrl?.getAttribute('aria-label') || ctrl?.title || '',
        })
      }
      return out
    }, TOP_BAND)

    // THE FLOOR. Without this the rest is decorative.
    expect(
      glyphs.length,
      `only ${glyphs.length} glyphs in the top ${TOP_BAND}px — the toolbar did not render, so the geometry below would pass vacuously`,
    ).toBeGreaterThanOrEqual(FLOOR)

    // A glyph shrunk to fit is the signature. 12px is well below any icon this
    // app ships and well above a hairline rounding difference.
    const squashed = glyphs.filter((g) => g.w < 12)
    expect(
      squashed.map((g) => `${g.label || 'icon'} ${g.w}px in ${g.ctrlW}x${g.ctrlH}`),
      'glyphs shrank to fit their control — the padding was never zeroed',
    ).toEqual([])

    // And each glyph that declares a size must be painted at it. This is the
    // direct statement of the bug: declared 16, rendered 2.
    for (const g of glyphs) {
      if (!g.declared) continue
      expect(
        Math.abs(g.w - g.declared),
        `glyph declared ${g.declared}px rendered ${g.w}px (control ${g.ctrlW}x${g.ctrlH})`,
      ).toBeLessThanOrEqual(1)
    }
  })

  test('icon controls are square', async ({ page }) => {
    test.setTimeout(90_000)

    await page.goto('/dev?template=hanzo-apps/prism-react&action=edit', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })
    await expect(page, 'the editor must not bounce to the IdP').toHaveURL(/\/dev/, {
      timeout: 30_000,
    })
    // Wait for the PRECONDITION this test measures, not for a proxy. Two proxies
    // were tried and both were wrong: a raw `svg` count raced the loading
    // spinner (itself an svg, so it attached while the page was still black),
    // and a named control raced the breakpoint-gated centre cluster. Polling the
    // actual quantity under test cannot drift from it.
    await page.waitForFunction(
      ({ band, floor }) =>
        Array.from(document.querySelectorAll('svg')).filter((s) => {
          const r = s.getBoundingClientRect()
          return r.top < band && r.width > 0 && s.closest('button,[role="button"],a')
        }).length >= floor,
      { band: TOP_BAND, floor: FLOOR },
      { timeout: 45_000 },
    )

    // A control whose whole content is one glyph is a square. A control that is wider than it is tall is one
    // that kept its label padding — the same defect, seen from the outside.
    const boxes: Array<{ w: number; h: number; label: string }> = await page.evaluate((band) => {
      const seen: Array<{ w: number; h: number; label: string }> = []
      for (const svg of Array.from(document.querySelectorAll('svg'))) {
        const r = svg.getBoundingClientRect()
        if (r.top >= band) continue
        const ctrl = svg.closest('button,[role="button"],a') as HTMLElement | null
        if (!ctrl) continue
        // Only controls whose ENTIRE content is the glyph. One with a text label
        // is legitimately wider than tall.
        if ((ctrl.textContent || '').trim().length) continue
        const cr = ctrl.getBoundingClientRect()
        seen.push({
          w: +cr.width.toFixed(1),
          h: +cr.height.toFixed(1),
          label: ctrl.getAttribute('aria-label') || ctrl.title || 'icon',
        })
      }
      return seen
    }, TOP_BAND)

    expect(
      boxes.length,
      'no glyph-only controls found — nothing was measured',
    ).toBeGreaterThanOrEqual(3)

    const oblong = boxes.filter((b) => Math.abs(b.w - b.h) > 1)
    expect(
      oblong.map((b) => `${b.label} ${b.w}x${b.h}`),
      'glyph-only controls must be square — a wider-than-tall box still carries label padding',
    ).toEqual([])

    // The controls the header sizes `size="icon-sm"` must actually measure
    // CONTROL. If this drifts, the constant and the paint have parted ways.
    const atControl = boxes.filter((b) => Math.abs(b.w - CONTROL) <= 1)
    expect(
      atControl.length,
      `no control measured ${CONTROL}px — header/index.tsx sizes four of them size="icon-sm"`,
    ).toBeGreaterThanOrEqual(1)
  })
  /**
   * A hover must paint the WHOLE segment it belongs to.
   *
   * Both segmented groups in this bar (view: Preview/Code, device:
   * desktop/mobile) put buttons inside a pill. If a button is shorter than its
   * pill, its hover paints a chip with a halo of the group's own colour showing
   * around it — and for a long time the two groups disagreed: the device tabs
   * lit flush at 32, the view tabs lit a 36px chip inset 4px inside a 40px pill.
   *
   * The cause is the same one `iconBox` taught: a size variant sets a
   * `minHeight` FLOOR (`HEIGHT.default` = 36), and a `height` style prop cannot
   * argue a floor down. So `height={28}` on a Button rendered 36 and nothing
   * threw, warned or clipped. The fix is to ask the ladder — `size="sm"` — and
   * to give the group no padding, so the tab IS the segment.
   *
   * Only rendered geometry can see this, which is why it is here and not a unit
   * test: the call site's props were always "correct", they just never arrived.
   */
  test('a segmented tab fills its group, so hover covers the whole segment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dev')
    await page.waitForLoadState('networkidle')

    const pairs = await page.evaluate((band) => {
      const out: Array<{ group: string; tab: string; groupH: number; tabH: number }> = []
      for (const g of Array.from(document.querySelectorAll('[role="tablist"]'))) {
        const gr = g.getBoundingClientRect()
        if (gr.top >= band) continue
        for (const t of Array.from(g.querySelectorAll<HTMLElement>('[role="tab"]'))) {
          const tr = t.getBoundingClientRect()
          out.push({
            group: g.getAttribute('aria-label') || 'tablist',
            tab: t.getAttribute('aria-label') || t.title || (t.textContent || '').trim() || 'tab',
            groupH: +gr.height.toFixed(1),
            tabH: +tr.height.toFixed(1),
          })
        }
      }
      return out
    }, TOP_BAND)

    expect(pairs.length, 'no segmented tabs found — nothing was measured').toBeGreaterThanOrEqual(2)

    const inset = pairs.filter((p) => p.groupH - p.tabH > 1)
    expect(
      inset.map((p) => `${p.group}/${p.tab} tab ${p.tabH} in group ${p.groupH}`),
      'a tab shorter than its group leaves a halo of the group around its hover',
    ).toEqual([])

    // And every segmented group is the bar's ONE control height, so two groups
    // side by side cannot stand at different heights (they were 40 and 32).
    const offSize = pairs.filter((p) => Math.abs(p.groupH - CONTROL) > 1)
    expect(
      offSize.map((p) => `${p.group} ${p.groupH}`),
      `every segmented group must measure ${CONTROL}px`,
    ).toEqual([])
  })
})
