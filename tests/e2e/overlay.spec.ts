import { test, expect } from '@playwright/test';

/**
 * The Build menu, in a real browser, at a real size.
 *
 * jsdom can prove the classes are on the element; only a browser can prove the
 * page actually paints the menu on top. That distinction IS the bug: the panel
 * was fully opaque and correctly portaled, yet unreadable, because its computed
 * `z-index` was `auto` and `<main class="relative z-10">` painted over it. So
 * these assertions read the COMPUTED value and hit-test the four corners — never
 * the class list.
 *
 * WHAT IS ASSERTED IS THE GUARANTEE, NOT THE MECHANISM THAT ONCE PROVIDED IT.
 * This used to require a portal into <body> and a numeric z-index above 50,
 * because that is how Radix stacked. Radix is gone from this stack, and the menu
 * now stacks by DOM order: measured on the live page it is `z-index: auto`,
 * unportaled, opaque, and owns all four of its corners. Demanding the portal back
 * would be demanding a dependency we removed on purpose.
 *
 * THE HIT TEST IS THE REAL PROOF and it always was. `z-index > 50` never showed
 * that anything painted on top — it showed a number. elementFromPoint at the four
 * corners is the property itself: if `<main>` or anything else covered the panel,
 * a corner would belong to that element instead. It catches the original bug
 * without naming the library that used to cause it.
 */

interface Painted {
  background: string;
  z: string;
  wrapperZ: string | null;
  portaled: boolean;
  ownsEveryCorner: boolean;
  within: boolean;
}

const VIEWPORTS = [
  ['desktop', { width: 1440, height: 900 }],
  ['phone', { width: 390, height: 844 }],
] as const;

for (const [name, viewport] of VIEWPORTS) {
  test(`Build menu paints above the page — ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    // The MODE pill, named by what it is. `/^Build/` matched three things on
    // this page — the hero's "Build Shift Board →", this pill, and a starter
    // chip — and `.first()` took the hero, which opens no menu. It also could
    // not be stable by text: the pill alternates Build ↔ Plan while the page
    // idles, so half the time the name it was hunting was not on screen.
    const trigger = page.getByRole('button', { name: /^Mode:/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /Plan/ })).toBeVisible();

    const seen = await menu.evaluate((el): Painted => {
      const style = getComputedStyle(el);
      const wrapper = el.parentElement;
      const box = el.getBoundingClientRect();
      const owns = (x: number, y: number) => {
        const hit = document.elementFromPoint(x, y);
        return !!hit && el.contains(hit);
      };
      return {
        background: style.backgroundColor,
        z: style.zIndex,
        wrapperZ: wrapper ? getComputedStyle(wrapper).zIndex : null,
        portaled: wrapper?.parentElement?.tagName === 'BODY',
        ownsEveryCorner:
          owns(box.x + 4, box.y + 4) &&
          owns(box.right - 4, box.y + 4) &&
          owns(box.x + 4, box.bottom - 4) &&
          owns(box.right - 4, box.bottom - 4),
        within:
          box.x >= 0 && box.y >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
      };
    });

    // Opaque, wholly on screen, and nothing paints over any corner of it — which
    // is the whole of what "paints above the page" means to somebody reading it.
    expect(seen.background).not.toMatch(/rgba\([^)]*,\s*0(\.\d+)?\)$/);
    expect(seen.ownsEveryCorner).toBe(true);
    expect(seen.within).toBe(true);
  });
}
