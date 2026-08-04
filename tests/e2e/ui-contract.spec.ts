import { test, expect, type Page } from '@playwright/test';

/**
 * The defects a green build cannot see.
 *
 * Everything here is a COMPUTED style read out of a real browser, because every
 * defect it guards shipped past a passing build and a passing type-check. The
 * source-level half of the contract lives in
 * tests/unit/gui-conversion-contract.test.ts; these are the ones that only exist
 * once the page has laid out.
 *
 * Two of them are deliberately narrower than they look, and both narrowings are
 * the difference between a real signal and noise:
 *
 *  - Overflow only counts when nothing between the element and <body> scrolls or
 *    clips horizontally. The landing page's template lane is a deliberate
 *    100vw snap-scroll strip; counting raw viewport overshoot reported 54
 *    "failures" on a page whose scrollWidth exactly equals its clientWidth.
 *  - Clipping ignores collapsed disclosures. A closed <details> clips its own
 *    content by definition; that is what closed means.
 */

const SURFACES = ['/', '/templates', '/pricing'];
const WIDTHS = [390, 768, 1024, 1280, 1920];

/** Reads the layout facts. Kept in one place so every spec asks the same question. */
const audit = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const cls = (el: Element) =>
      ((el as HTMLElement).className?.toString?.() ?? '').slice(0, 80);

    const containedX = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
        if (/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX)) return true;
      return false;
    };

    const overflowX: string[] = [];
    const clipped: string[] = [];
    const zeroBoxWithText: string[] = [];

    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;

      if (r.right > vw + 1 && r.left < vw && r.width > 4
          && cs.position !== 'fixed' && !containedX(el))
        overflowX.push(`${el.tagName.toLowerCase()} +${Math.round(r.right - vw)}px ${cls(el)}`);

      const collapsed =
        (el.tagName === 'DETAILS' && !el.hasAttribute('open')) ||
        el.closest('details:not([open])') ||
        el.getAttribute('data-state') === 'closed' ||
        el.closest('[data-state="closed"]') ||
        el.getAttribute('aria-expanded') === 'false';

      if (!collapsed && (cs.overflowY === 'hidden' || cs.overflow === 'hidden') && r.height > 0) {
        let need = 0;
        for (const c of el.children) {
          const cr = c.getBoundingClientRect();
          if (cr.height) need = Math.max(need, cr.bottom - r.top);
        }
        // 24px of slack: a rounded corner or a 1px border is not a defect.
        if (need - r.height > 24)
          clipped.push(
            `${el.tagName.toLowerCase()} box=${Math.round(r.height)} needs=${Math.round(need)} ` +
            `"${(el.textContent || '').trim().slice(0, 30)}"`);
      }

      if (r.height < 2 && (el.textContent || '').trim().length > 2 && !el.children.length)
        zeroBoxWithText.push(`${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 30)}"`);
    }

    return {
      overflowX, clipped, zeroBoxWithText,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });

for (const path of SURFACES) {
  test.describe(`${path} holds its shape`, () => {
    for (const width of WIDTHS) {
      test(`@${width}: no overflow, nothing clipped, nothing collapsed`, async ({ page }) => {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);

        const a = await audit(page);

        // The page itself must never scroll sideways.
        expect(a.scrollWidth, `${path}@${width} page scrolls horizontally`)
          .toBeLessThanOrEqual(a.clientWidth + 1);
        expect(a.overflowX, `${path}@${width} elements escape the viewport`).toEqual([]);

        // A box shorter than the content it holds. This is the <Button>-as-card
        // defect: a size variant pinned the height, overflow:hidden cropped a
        // 425px card to a 30px band, and the build was green.
        expect(a.clipped, `${path}@${width} content is cropped by its own box`).toEqual([]);

        // Text with no line box to sit in.
        expect(a.zeroBoxWithText, `${path}@${width} text in a zero-height box`).toEqual([]);
      });
    }
  });
}

test.describe('touch ergonomics', () => {
  test('@390: every control has a 44px hit area and fields are >= 16px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const bad = await page.evaluate(() => {
      const small: string[] = [];
      const fields: string[] = [];
      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;

        const role = el.getAttribute('role');
        // A link inside a sentence is a text run, not a tap target — WCAG 2.5.8
        // exempts targets in a block of text, and padding one to 44px would
        // wreck the paragraph it sits in.
        const isButton = el.tagName === 'BUTTON' || role === 'button';
        if (isButton) {
          // The hit area is the union of the box, @hanzo/ui's touch() ::after
          // (data-touch-*), and globals.css's 44px overlay. All three count.
          const padY = +(el.getAttribute('data-touch-y') || 0);
          const after = getComputedStyle(el, '::after');
          const h = Math.max(
            r.height + padY * 2,
            after.position === 'absolute' ? parseFloat(after.minHeight) || 0 : 0);
          if (h < 44) small.push(`${el.tagName.toLowerCase()} ${Math.round(h)}px "${(el.textContent || '').trim().slice(0, 24)}"`);
        }

        // iOS zooms the viewport on focus below 16px and never zooms back.
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
          const t = (el.getAttribute('type') || 'text').toLowerCase();
          const fs = parseFloat(cs.fontSize);
          if (fs < 16 && !['checkbox', 'radio', 'hidden', 'range', 'submit', 'button', 'file'].includes(t))
            fields.push(`${t} ${fs}px`);
        }
      }
      return { small, fields };
    });

    expect(bad.small, 'controls under a 44px hit area').toEqual([]);
    expect(bad.fields, 'fields under 16px — iOS will zoom and stay zoomed').toEqual([]);
  });
});
