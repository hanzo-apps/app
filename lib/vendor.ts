/**
 * The libraries a generated site may load, served from OUR origin.
 *
 * Generated pages used to be told to fetch Tailwind, icons, animation and maps
 * from `cdn.tailwindcss.com`, `cdn.jsdelivr.net`, `unpkg.com` and
 * `cdnjs.cloudflare.com` — four origins we do not own, on every page load of
 * every site anyone builds here, with our CSP widened to permit them. That is
 * four parties who can see our customers' visitors and who can change what
 * executes on their pages.
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
   * Tailwind's OFFICIAL browser build. `cdn.tailwindcss.com` is the same idea
   * — compile utility classes in the page — but it is their host, not a
   * package, so it can neither be pinned nor audited. This one is `npm i
   * @tailwindcss/browser`, and it is Tailwind 4.
   */
  tailwind: { from: '@tailwindcss/browser/dist/index.global.js', file: 'tailwind.js' },
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
  tailwind: `<script src="${url('tailwind')}"></script>`,
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
  [/https?:\/\/cdn\.tailwindcss\.com[^"'\s)]*/g, url('tailwind')],
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
