import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

import { LIBS, TAGS } from '../../lib/vendor';

/**
 * THE PROMISE THIS PRODUCT MAKES TO EVERY PAGE IT BUILDS.
 *
 * `lib/prompts.ts` tells a model: link one stylesheet and your page is Hanzo —
 * dark ground, Geist, styled controls, no build step. That promise is worth
 * exactly as much as the bytes behind it, and every way it can break is silent:
 *
 *  - The sheet 404s → the page renders as unstyled markup on white. No error a
 *    visitor sees, and the app itself stays perfectly healthy.
 *  - The FACES 404 → the page renders in the system sans and NOTHING says so.
 *    This one already happened here: the sheet asks for
 *    `url(./assets/fonts/…)` — one dot, resolved against the sheet's own
 *    directory — and the faces were first shipped one level up.
 *
 *    TWO plausible checks are useless against it, and both were tried.
 *    `getComputedStyle(body).fontFamily` is the DECLARED value, so it reads
 *    "Geist" whether or not a byte arrived. `document.fonts.check('16px
 *    Geist')` is worse, because it looks like the right question: it returns
 *    true whenever a matching `@font-face` rule EXISTS, so it is true for a
 *    face whose download 404'd — measured, with the file moved away. The only
 *    thing that separates them is `FontFace.status`, which reads `error`
 *    instead of `loaded`, so that is what this asks.
 *  - The whole thing needs JavaScript → the state the 276 KB Tailwind browser
 *    build put every generated page in, and the reason it is gone.
 *
 * So this renders the document the prompt describes, from the bytes
 * `scripts/vendor.mjs` actually wrote, and asks the browser directly. It runs
 * against local `public/vendor` rather than a deployed origin because the
 * artifact is what is under test, and a gate that cannot run before a deploy is
 * a gate nobody runs.
 */

const VENDOR = join(__dirname, '..', '..', 'public', 'vendor');
const TYPE: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

/** The head the prompt tells a model to write, and a page that uses it. */
const PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Generated</title>
${TAGS.design}
<style>
  .wrap { max-width: var(--container-prose); margin-inline: auto; padding: var(--hero-y) var(--gutter); }
  h1 { font-size: var(--text-5xl); font-weight: var(--weight-semibold); letter-spacing: var(--tracking-tight); }
  .lead { margin-top: var(--space-5); font-size: var(--text-lg); color: var(--text-secondary); }
  .card { margin-top: var(--space-8); background: var(--surface-card);
          border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); }
</style></head>
<body><main class="wrap">
  <h1>Ship the thing</h1>
  <p class="lead">One stylesheet, no build step.</p>
  <div class="card"><p>A card is a hairline on the ground, not a shadow.</p></div>
  <form><input placeholder="you@work.com"><button type="submit">Join</button></form>
</main></body></html>`;

/** Serve `/vendor/**` from the directory the build writes. */
const serveVendor = async (page: import('@playwright/test').Page) => {
  await page.route('**/vendor/**', async (route) => {
    const file = join(VENDOR, new URL(route.request().url()).pathname.replace(/^\/vendor\//, ''));
    if (!file.startsWith(VENDOR) || !existsSync(file)) return route.fulfill({ status: 404, body: '' });
    await route.fulfill({
      status: 200,
      contentType: TYPE[extname(file)] ?? 'application/octet-stream',
      body: readFileSync(file),
    });
  });
};

test.describe('a generated page is styled by one stylesheet', () => {
  test('the vendored sheet exists on disk, with its faces beside it', () => {
    // `scripts/vendor.mjs` throws on a missing source, so this is really about
    // the LAYOUT: the sheet's own `url()` is relative, so the faces have to sit
    // where it looks, and only a path comparison says whether they do.
    for (const lib of [LIBS.design, LIBS.geist, LIBS.geistMono]) {
      expect(existsSync(join(VENDOR, lib.file)), `${lib.file} is not in public/vendor`).toBe(true);
    }
    const sheet = readFileSync(join(VENDOR, LIBS.design.file), 'utf8');
    const asked = [...sheet.matchAll(/url\(["']?([^)"']+\.woff2)["']?\)/g)].map((m) => m[1]);
    expect(asked.length).toBeGreaterThan(0);
    for (const rel of asked) {
      expect(existsSync(join(VENDOR, join(LIBS.design.file, '..', rel))), `${rel} does not resolve`).toBe(true);
    }
  });

  test('renders on the design ground, in Geist, with real controls', async ({ page }) => {
    await serveVendor(page);
    await page.setContent(PAGE, { waitUntil: 'load' });
    const seen = await page.evaluate(async () => {
      // Ask for the face explicitly; a browser only fetches one when a glyph
      // needs it, so `fonts.ready` alone proves nothing about a face nobody
      // has painted yet. The rejection is swallowed because the STATUS below
      // is the answer either way — `error` is the failure we are looking for.
      await document.fonts.load('16px Geist').catch(() => {});
      return {
      ground: getComputedStyle(document.body).backgroundColor,
      ink: getComputedStyle(document.body).color,
      // The face itself, not the declaration and not `fonts.check`.
      geist: [...document.fonts].find((f) => f.family === 'Geist')?.status ?? 'absent',
      h1: getComputedStyle(document.querySelector('h1')!).fontSize,
      cardRadius: getComputedStyle(document.querySelector('.card')!).borderRadius,
      // A bare <input> in the UA's own chrome is the tell that the base layer
      // never arrived — it is what put two typefaces inside every Hanzo card.
      inputRadius: getComputedStyle(document.querySelector('input')!).borderRadius,
      };
    });

    expect(seen.ground).toBe('rgb(10, 10, 10)'); // --background
    expect(seen.ink).toBe('rgb(250, 250, 250)'); // --foreground
    expect(seen.geist).toBe('loaded');
    expect(parseFloat(seen.h1)).toBeGreaterThan(30);
    expect(seen.cardRadius).not.toBe('0px');
    expect(seen.inputRadius).not.toBe('0px');
  });

  test('is still styled with JavaScript disabled', async ({ browser }) => {
    // The state the utility-class compiler left every generated page in, and
    // the reason the prompt can now honour its own "CONTENT MUST BE VISIBLE
    // WITHOUT JAVASCRIPT" rule. Measured, not assumed.
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await serveVendor(page);
    await page.setContent(PAGE, { waitUntil: 'load' });

    const seen = await page.evaluate(() => ({
      ground: getComputedStyle(document.body).backgroundColor,
      hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    expect(seen.ground).toBe('rgb(10, 10, 10)');
    expect(seen.hscroll).toBe(false);
    await ctx.close();
  });

  test('nothing in the pipeline still names the utility framework', () => {
    // The prompts and the assets have to agree. A prompt that emits
    // `<script src=…/vendor/tailwind.js>` after the file is gone hands every
    // new site a 404, which is the loudest possible failure and the quietest
    // possible symptom.
    expect(Object.keys(LIBS)).not.toContain('tailwind');
    expect(existsSync(join(VENDOR, 'tailwind.js'))).toBe(false);
    for (const f of ['lib/prompts.ts', 'lib/vfs/templates/vibe-check.ts']) {
      const src = readFileSync(join(__dirname, '..', '..', f), 'utf8');
      expect(src, `${f} still emits the removed script`).not.toMatch(/vendor\/tailwind\.js/);
    }
  });
});
