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

    const trigger = page.getByRole('button', { name: /^Build/ }).first();
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

    // An elevation, not `auto` — and Radix must have copied it onto the wrapper it
    // portals into <body>, which is the element that actually stacks.
    expect(seen.portaled).toBe(true);
    expect(Number(seen.z)).toBeGreaterThan(50);
    expect(seen.wrapperZ).toBe(seen.z);

    // Opaque, wholly on screen, and nothing paints over any corner of it.
    expect(seen.background).not.toMatch(/rgba\([^)]*,\s*0(\.\d+)?\)$/);
    expect(seen.ownsEveryCorner).toBe(true);
    expect(seen.within).toBe(true);
  });
}
