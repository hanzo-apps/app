/**
 * Every vendored asset is reachable from another origin.
 *
 * `lib/vendor.ts` spells these absolute (`https://hanzo.app/vendor/…`) and a
 * generated site is published elsewhere, so EVERY fetch of them is
 * cross-origin. A stylesheet does not need CORS, which is how this stayed
 * invisible — but a font and an ES module both do:
 *
 *  - `@font-face` is always fetched in CORS mode. Without the header, Geist and
 *    Geist Mono both resolved `FontFace.status: "error"` on a cross-origin page
 *    and it painted with a SYSTEM face, while `document.fonts.check('16px
 *    Geist')` answered TRUE and `getComputedStyle` reported "Geist". Both of
 *    the checks a reader would reach for report success on the failure.
 *  - the injected widget imports the preference transform as a module.
 *
 * This pins the header rather than the symptom, because the symptom is only
 * visible from a second origin — which a unit test does not have.
 */
import fs from 'node:fs';
import path from 'node:path';

const config = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');

describe('/vendor is cross-origin readable', () => {
  it('sends Access-Control-Allow-Origin for every vendored path', () => {
    const rule = config.match(/source:\s*'\/vendor\/([^']*)'/);
    expect(rule).not.toBeNull();
    // The whole tree, not one subdirectory — the fonts live under
    // /vendor/design/assets/fonts and the transform under /vendor/appearance.
    expect(rule![1]).toBe(':path*');
    expect(config).toContain("key: 'Access-Control-Allow-Origin', value: '*'");
  });

  it('covers the two assets that actually need it', () => {
    const vendor = fs.readFileSync(path.join(process.cwd(), 'lib/vendor.ts'), 'utf8');
    // Both are declared in the vendor map, so both are served from /vendor.
    expect(vendor).toContain('design/assets/fonts/Geist-Variable.woff2');
    expect(vendor).toContain('appearance/preference.js');
  });

  it('still spells vendored URLs absolute, which is WHY the header is needed', () => {
    const vendor = fs.readFileSync(path.join(process.cwd(), 'lib/vendor.ts'), 'utf8');
    // If this ever becomes a relative path, the header stops being load-bearing
    // — but until then a published site fetches these from another origin.
    expect(vendor).toMatch(/ORIGIN\s*=\s*process\.env\.NEXT_PUBLIC_VENDOR_ORIGIN\s*\|\|\s*'https:\/\/hanzo\.app'/);
  });
});
