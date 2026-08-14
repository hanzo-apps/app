/**
 * The libraries a generated site may load, served from OUR origin.
 *
 * Generated pages used to be told to fetch a utility-class framework, icons,
 * animation and maps from `cdn.tailwindcss.com`, `cdn.jsdelivr.net`,
 * `unpkg.com` and `cdnjs.cloudflare.com` — four origins we do not own, on every
 * page load of every site anyone builds here, with our CSP widened to permit
 * them. That is four parties who can see our customers' visitors and who can
 * change what executes on their pages.
 *
 * Now the bytes come from npm, pinned in `package.json`, copied into `public/`
 * by `scripts/vendor.mjs` at install and build time — the same mechanism that
 * already puts `esbuild.wasm` there — and served by us.
 *
 * THIS FILE IS THE ONE PLACE A URL IS DECIDED. The prompts, the templates, the
 * preview and the publisher all read it, so a version bump is one edit and
 * cannot leave one caller pointing somewhere else.
 */

/** A library we host: where its bytes come from, and what we serve it as. */
interface Lib {
  /** Resolved from node_modules by the copy script — the pinned bytes. */
  readonly from: string;
  /** The name under `public/vendor/`, and so the last part of the URL. */
  readonly file: string;
}

export const LIBS = {
  /**
   * THE STYLE LAYER. `@hanzo/design` is the token table every Hanzo surface
   * renders on — the same one `@hanzo/gui` reads — shipped as one flat
   * stylesheet: the palette, the type scale, the space ramp, and a base layer
   * that dresses bare HTML (ground, ink, headings, links, controls, focus
   * ring). A generated page links it and is already Hanzo before it writes a
   * single rule of its own.
   *
   * It replaced a 276 KB browser build of Tailwind, and the size is the smaller
   * half of why. Tailwind-in-the-page is a COMPILER: the styles do not exist
   * until a script has run, so with JavaScript blocked — an extension, a
   * corporate proxy, a slow phone giving up — the page renders as Times New
   * Roman on white with blue links. Measured, both ways, at 390px and 1440px.
   * A stylesheet has no such state; the page is styled when the CSS lands.
   *
   * It brings its two Geist faces with it, and they are NOT optional: the sheet
   * asks for them RELATIVELY (`url(./assets/fonts/…)`, so the package works
   * wherever it is mounted), so they resolve against wherever we serve the
   * sheet FROM. Hence its own directory, with the faces beside it in exactly
   * the shape the package has them — `design/assets/fonts/…`.
   *
   * Get that wrong and nothing announces it. `font-family` still COMPUTES to
   * "Geist" whether or not the face ever arrived, because a computed style is
   * the declared value, not the loaded one; the page simply renders in the
   * fallback system sans. The only honest check is `document.fonts.check()`,
   * and that is what tests/e2e asks.
   */
  design: { from: '@hanzo/design/styles.css', file: 'design/styles.css' },
  geist: { from: '@hanzo/design/assets/fonts/Geist-Variable.woff2', file: 'design/assets/fonts/Geist-Variable.woff2' },
  geistMono: { from: '@hanzo/design/assets/fonts/GeistMono-Variable.woff2', file: 'design/assets/fonts/GeistMono-Variable.woff2' },
  /** Icons. One set, so a page never loads two icon fonts to draw two glyphs. */
  feather: { from: 'feather-icons/dist/feather.min.js', file: 'feather.js' },
  /**
   * Animation, pinned to 3.x deliberately. 4.x replaced the `anime({targets})`
   * call with named exports, and both the sites already published here and the
   * code a model writes unprompted are 3.x — a silent API swap would break
   * them with no error anyone would attribute to a version.
   */
  anime: { from: 'animejs/lib/anime.min.js', file: 'anime.js' },
  /** Maps, and its stylesheet — a map without it renders as stacked tiles. */
  leaflet: { from: 'leaflet/dist/leaflet.js', file: 'leaflet.js' },
  leafletCss: { from: 'leaflet/dist/leaflet.css', file: 'leaflet.css' },
  /**
   * Leaflet's own images, and they are NOT optional decoration.
   * `leaflet.css` asks for them RELATIVELY — `url(images/marker-icon.png)` —
   * so they resolve against wherever the stylesheet is served from, i.e.
   * `/vendor/images/`. Ship the CSS without them and every map draws with a
   * broken marker and a broken layers control, which no test of ours would
   * catch because the page loads, the script runs and the tiles appear.
   */
  leafletMarker: { from: 'leaflet/dist/images/marker-icon.png', file: 'images/marker-icon.png' },
  leafletMarker2x: { from: 'leaflet/dist/images/marker-icon-2x.png', file: 'images/marker-icon-2x.png' },
  leafletShadow: { from: 'leaflet/dist/images/marker-shadow.png', file: 'images/marker-shadow.png' },
  leafletLayers: { from: 'leaflet/dist/images/layers.png', file: 'images/layers.png' },
  leafletLayers2x: { from: 'leaflet/dist/images/layers-2x.png', file: 'images/layers-2x.png' },
} as const satisfies Record<string, Lib>;

export type LibName = keyof typeof LIBS;

/** Where `scripts/vendor.mjs` writes, and therefore what the app serves. */
export const DIR = 'vendor';

/**
 * The origin a generated site names.
 *
 * A PUBLISHED site is served from its own host, so a root-relative `/vendor/…`
 * would resolve against the site and 404. It has to be absolute, and it has to
 * be one we own. `NEXT_PUBLIC_VENDOR_ORIGIN` exists so a white-label deployment
 * can serve its own copy rather than reaching back to hanzo.app.
 */
export const ORIGIN = process.env.NEXT_PUBLIC_VENDOR_ORIGIN || 'https://hanzo.app';

/** The absolute URL of one library. The only way to spell one. */
export function url(name: LibName): string {
  return `${ORIGIN}/${DIR}/${LIBS[name].file}`;
}

/** `<script src>`/`<link href>` tags, ready to paste into a document head. */
export const TAGS = {
  design: `<link rel="stylesheet" href="${url('design')}"/>`,
  feather: `<script src="${url('feather')}"></script>`,
  anime: `<script src="${url('anime')}"></script>`,
  leaflet: `<link rel="stylesheet" href="${url('leafletCss')}"/>\n<script src="${url('leaflet')}"></script>`,
} as const;

/**
 * The third-party URLs that already exist in SAVED documents, and what each
 * becomes.
 *
 * Removing the CDNs from the prompts fixes what we generate next; it does
 * nothing for the projects already stored, whose HTML names those hosts
 * literally. Their preview inherits this app's CSP, so tightening it without
 * this map would blank every site built before today — the owner would see a
 * page that worked yesterday render unstyled, with nothing in the product to
 * explain it.
 *
 * Matching is on the host and the library, not on an exact URL, because the
 * same library was endorsed at several paths and versions over time
 * (`/npm/animejs/lib/anime.iife.min.js`, `@latest`, a pinned `1.9.4`).
 */
const LEGACY: ReadonlyArray<readonly [RegExp, string]> = [
  /**
   * THE UTILITY-CLASS COMPILER, and why this one rule swaps a TAG rather than a
   * URL. Every other entry here is a like-for-like: a script that was fetched
   * from someone else is fetched from us instead, same tag, same shape. The
   * utility framework has no like-for-like — the style layer is now a
   * STYLESHEET, so `<script src=…tailwind.js>` has to become `<link rel=…>`,
   * which a URL substitution cannot express.
   *
   * Two spellings reach us: `cdn.tailwindcss.com`, from before we vendored
   * anything, and `hanzo.app/vendor/tailwind.js`, from the window when we
   * served our own copy. Both are gone from disk, so both would 404 — and a
   * 404'd script is the WORST version of this: no error a visitor can see, and
   * the page renders as unstyled markup on white. The link puts those documents
   * on the ground, ink, typeface and controls of the design sheet, which is not
   * the layout their utility classes described, but is a page a person can read
   * instead of a page that looks broken.
   */
  [/<script\b[^>]*\bsrc=["'][^"']*(?:cdn\.tailwindcss\.com|\/vendor\/tailwind\.js)[^"']*["'][^>]*>\s*<\/script>/gi, TAGS.design],
  /**
   * …and the config block that used to follow it. `tailwind.config = {…}` on a
   * page with no `tailwind` global is a ReferenceError, which aborts that
   * script — so leaving these behind trades a styling fault for a console full
   * of thrown errors on documents we are otherwise healing.
   */
  [/<script\b(?![^>]*\bsrc=)[^>]*>\s*(?:if\s*\(\s*window\.tailwind\s*\)\s*)?tailwind\.config\s*=[\s\S]*?<\/script>/gi, ''],
  [/https?:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\/npm\/feather-icons[^"'\s)]*/g, url('feather')],
  [/https?:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\/npm\/animejs[^"'\s)]*/g, url('anime')],
  [/https?:\/\/(unpkg\.com|cdn\.jsdelivr\.net)(\/npm)?\/leaflet@?[^"'\s)]*\.css/g, url('leafletCss')],
  [/https?:\/\/(unpkg\.com|cdn\.jsdelivr\.net)(\/npm)?\/leaflet@?[^"'\s)]*\.js/g, url('leaflet')],
];

/**
 * Point a document's third-party library URLs at our copies.
 *
 * Pure and idempotent: our own URLs match none of the patterns, so running it
 * twice is running it once. Applied wherever a stored document becomes
 * something a browser loads — the preview and the publisher — rather than at
 * save time, so it also heals documents saved before this existed.
 */
export function rewrite(html: string): string {
  let out = html;
  for (const [pattern, to] of LEGACY) out = out.replace(pattern, to);
  return out;
}

/** Whether a document still names a host we do not own. Used by the tests. */
export function thirdParty(html: string): string[] {
  const hosts = /https?:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)[^"'\s)]*/g;
  return [...new Set(html.match(hosts) ?? [])];
}
