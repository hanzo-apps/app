import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { LIBS, ORIGIN, rewrite, thirdParty, url } from '@/lib/vendor';

const root = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/**
 * Every file that tells a model, or a template, what a generated site should
 * load. If one of these names a host we do not own, sites built here fetch code
 * from that host on every page view — which is the thing this whole module
 * exists to stop, so the list is checked rather than trusted.
 */
const GENERATES = [
  'lib/prompts.ts',
  'lib/llm/prompts/react.ts',
  'lib/llm/prompts/preact.ts',
  'lib/llm/prompts/svelte.ts',
  'lib/llm/prompts/vue.ts',
  'lib/vfs/skills/built-in/one-shot.ts',
  'lib/vfs/skills/built-in/planning.ts',
  'lib/vfs/templates/vibe-check.ts',
];

describe('a generated site loads code from us, and from nobody else', () => {
  it('names no third-party host in anything that generates a site', () => {
    const guilty = GENERATES.map((f) => [f, thirdParty(read(f))] as const).filter(
      ([, hits]) => hits.length,
    );
    // Name the file AND the URL: "some file has a CDN" sends the next person
    // grepping nine files by hand.
    expect(guilty.map(([f, hits]) => `${f}: ${hits.join(', ')}`)).toEqual([]);
  });

  it('does not let the policy allow one either', () => {
    // The prompts and the policy have to agree. They did not for a long time in
    // the other direction — the policy permitted four CDNs because the prompts
    // used them — and a policy that still allows a host nothing asks for is an
    // open door nobody is watching.
    const csp = read('lib/security/middleware.ts');
    const inPolicy = csp.slice(csp.indexOf('const CDN'), csp.indexOf('export'));
    expect(thirdParty(inPolicy)).toEqual([]);
    expect(inPolicy).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  it('serves every library from ONE origin', () => {
    const origins = Object.keys(LIBS).map((k) => new URL(url(k as keyof typeof LIBS)).origin);
    expect([...new Set(origins)]).toEqual([new URL(ORIGIN).origin]);
  });
});

describe('documents saved before we hosted these still render', () => {
  // Removing the CDNs from the prompts fixes what we generate NEXT. Every
  // project already stored names those hosts literally, and its preview
  // inherits an app policy that no longer allows them — so without the rewrite
  // a site that worked yesterday previews as unstyled markup.
  const legacy = [
    ['https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js', url('feather')],
    ['https://cdn.jsdelivr.net/npm/animejs/lib/anime.iife.min.js', url('anime')],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', url('leaflet')],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', url('leafletCss')],
  ] as const;

  it.each(legacy)('points %s at our copy', (from, to) => {
    const out = rewrite(`<script src="${from}"></script>`);
    expect(out).toContain(to);
    expect(thirdParty(out)).toEqual([]);
  });

  it('is idempotent, because it runs on every preview frame', () => {
    const once = rewrite('<script src="https://cdn.tailwindcss.com"></script>');
    expect(rewrite(once)).toBe(once);
  });

  /**
   * The utility-class framework is the one rewrite that swaps a TAG, because
   * the style layer stopped being a script. Both spellings a stored document
   * can carry — the CDN we never owned, and the copy we served ourselves — are
   * gone from disk, so a URL-level rewrite would leave a 404'd script and a
   * page of unstyled markup on white.
   */
  it.each([
    'https://cdn.tailwindcss.com',
    'https://hanzo.app/vendor/tailwind.js',
  ])('turns the %s script into the design stylesheet', (src) => {
    const out = rewrite(`<head><script src="${src}"></script></head>`);
    expect(out).toContain(`<link rel="stylesheet" href="${url('design')}"/>`);
    expect(out).not.toContain('<script');
    expect(rewrite(out)).toBe(out);
  });

  it('drops the config block that script left behind', () => {
    // `tailwind.config = {…}` with no `tailwind` global is a ReferenceError,
    // which aborts the script it sits in. Healing the styling and leaving a
    // thrown error behind is not healing.
    const out = rewrite(
      '<script src="https://hanzo.app/vendor/tailwind.js"></script>\n' +
        '<script>tailwind.config = { theme: { extend: { colors: { primary: "#3B82F6" } } } }</script>',
    );
    expect(out).not.toMatch(/tailwind\.config/);
    expect(rewrite(out)).toBe(out);
  });

  it('leaves a document that names nobody alone', () => {
    const plain = '<html><body><h1>hi</h1></body></html>';
    expect(rewrite(plain)).toBe(plain);
  });

  it('rewrites a whole document, not just the first match', () => {
    // Two libraries in one head is the ordinary case, and `replace` without the
    // global flag would silently fix only the first — leaving the second
    // refused by the policy and the page half-styled.
    const doc = `<script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>`;
    expect(thirdParty(rewrite(doc))).toEqual([]);
  });
});

describe('a stylesheet we host brings its own assets', () => {
  /**
   * The design sheet asks for its two Geist faces RELATIVELY
   * (`url(../assets/fonts/…)`), so they resolve against wherever we serve it
   * from — which is why it is served one directory down, at
   * `/vendor/design/styles.css`. Ship it flat, or ship it without the faces,
   * and every generated page silently falls back to the system sans: no error,
   * no 404 anyone reads, just the wrong typeface everywhere forever.
   */
  it('ships every font the design sheet asks for, at the path it asks for', () => {
    // By path: the package's "." export is ESM-only and asking for the .css
    // directly lands on jest's style mock. `toBeGreaterThan(0)` below catches
    // either mistake rather than passing against nothing.
    const css = readFileSync(join(root, 'node_modules/@hanzo/design/styles.css'), 'utf8');
    const wanted = [...new Set([...css.matchAll(/url\(["']?([^)"']+\.woff2)["']?\)/g)].map((m) => m[1]))];
    expect(wanted.length).toBeGreaterThan(0); // or the assertion below is vacuous
    const shipped = new Set<string>(Object.values(LIBS).map((l) => l.file));
    // Resolve each `url()` against the sheet's own served directory.
    const sheetDir = dirname(LIBS.design.file);
    expect(wanted.filter((w) => !shipped.has(join(sheetDir, w)))).toEqual([]);
  });

  it('ships every image leaflet.css asks for', () => {
    // `leaflet.css` references its marker and layers icons RELATIVELY
    // (`url(images/marker-icon.png)`), so they resolve against wherever we
    // serve the stylesheet from. Ship the CSS alone and every map renders with
    // a broken marker — while the page loads, the script runs and the tiles
    // appear, so nothing else here would notice.
    //
    // Read from node_modules, not from `public/vendor/`: that directory is a
    // build product and this has to hold before it is written.
    // Resolve the package ROOT and join the file. `require.resolve` on the
    // stylesheet itself returns jest's style MOCK — moduleNameMapper sends
    // every `.css` there — so this read silently returned an empty stub and the
    // match count was zero. The `toBeGreaterThan(0)` below is what caught it;
    // without that line this test would have passed against nothing.
    const css = readFileSync(
      join(dirname(require.resolve('leaflet/package.json')), 'dist/leaflet.css'),
      'utf8',
    );
    const wanted = [...new Set([...css.matchAll(/url\((images\/[^)]+)\)/g)].map((m) => m[1]))];
    expect(wanted.length).toBeGreaterThan(0); // or the assertion below is vacuous
    const shipped = new Set<string>(Object.values(LIBS).map((l) => l.file));
    expect(wanted.filter((w) => !shipped.has(w))).toEqual([]);
  });
});

describe('the preview frame applies it', () => {
  it('rewrites on the way into the frame', () => {
    // The frame is where the policy bites, so the rewrite has to happen there
    // and not only at save time — that is what heals already-saved projects.
    expect(read('components/editor/preview/bridge.ts')).toMatch(/rewrite\(html\)/);
  });
});
