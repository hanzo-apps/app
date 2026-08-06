/**
 * Point a document's asset references at the compiled files that hold them.
 *
 * The preview frame renders from `srcdoc`, so it has no location of its own and
 * a relative reference in the markup resolves against nothing. Every asset the
 * project owns is compiled to a blob URL first (`virtual-server`), and this is
 * the one place that rewrites the document to name those blobs instead.
 *
 * It used to be three places: `multipage-preview` and `live-preview` each
 * carried their own copy, and the copies had drifted. Both covered the same
 * three cases — a `.css` href, a `.js` src, an image src — and so both missed
 * the same things, which is why a template with responsive images or a
 * background declared in CSS came up half-empty:
 *
 *   - `srcset`, where responsive and retina images actually live. A `src` may
 *     resolve perfectly and still never be chosen, because a browser that has a
 *     `srcset` picks from it — so the one attribute that WAS rewritten was the
 *     one the browser then ignored.
 *   - `url(…)` inside a `<style>` block: background images and `@font-face`
 *     sources. The compiler resolves these for stylesheet FILES, but a document
 *     that styles itself inline never passed through it.
 *   - `poster` and `<source src>`, so video shows its frame and picks its file.
 *
 * Absolute, protocol-relative, `data:`, `blob:` and fragment references are left
 * exactly as written — they already say where they point, and rewriting them
 * would break a deliberate link off-project.
 */

/** References that already resolve on their own. */
const SETTLED = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * What an `href` has to name before it is rewritten.
 *
 * An `href` is the one attribute with two jobs: it loads a stylesheet, and it
 * links to another page. The frame NAVIGATES a page link — the bridge catches
 * the click and asks the host to load that path — so pointing it at a blob would
 * replace a working navigation with a dead end. `src` needs no such test,
 * because it only ever loads.
 */
const ASSET =
  /\.(?:css|m?js|png|jpe?g|gif|svg|ico|webp|avif|bmp|woff2?|ttf|otf|eot|mp4|webm|ogg|mp3|wav|json|xml|pdf)(?:[?#]|$)/i;

/**
 * The project-absolute path a reference names, so `img/a.png`, `./img/a.png` and
 * `/img/a.png` are understood to be the same file.
 */
function normalize(ref: string): string {
  const bare = ref.replace(/^\.\//, '');
  return bare.startsWith('/') ? bare : `/${bare}`;
}

/** The blob holding a reference, or null when the project has no such file. */
function blobFor(ref: string, blobUrls: ReadonlyMap<string, string>): string | null {
  if (!ref || SETTLED.test(ref)) return null;
  return blobUrls.get(normalize(ref)) ?? null;
}

/**
 * A `srcset` is a comma-separated list of candidates, each a URL followed by an
 * optional width or density descriptor (`img/a.png 2x`). Only the URL is
 * rewritten; the descriptor decides which candidate wins and must survive intact.
 */
function resolveSet(value: string, blobUrls: ReadonlyMap<string, string>): string {
  return value
    .split(',')
    .map((candidate) => {
      const text = candidate.trim();
      if (!text) return null;
      const [ref, ...descriptor] = text.split(/\s+/);
      const blob = blobFor(ref, blobUrls);
      return [blob ?? ref, ...descriptor].join(' ');
    })
    .filter((c): c is string => c !== null)
    .join(', ');
}

/** Rewrite one attribute wherever it appears, quoted either way. */
function resolveAttribute(
  html: string,
  name: string,
  blobUrls: ReadonlyMap<string, string>,
  each: (value: string, blobUrls: ReadonlyMap<string, string>) => string | null,
): string {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']*)\\1`, 'gi');
  return html.replace(pattern, (whole, quote: string, value: string) => {
    const next = each(value, blobUrls);
    return next === null ? whole : `${name}=${quote}${next}${quote}`;
  });
}

/** `url(…)` inside CSS — a background image, a mask, a `@font-face` source. */
export function resolveUrls(css: string, blobUrls: ReadonlyMap<string, string>): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, _quote, ref: string) => {
    const blob = blobFor(ref.trim(), blobUrls);
    return blob ? `url("${blob}")` : whole;
  });
}

/**
 * The document, with every reference it makes to a project file pointed at that
 * file's blob. References the project does not have are left alone rather than
 * blanked, so an intentional external asset and a genuinely missing one stay
 * distinguishable in the frame.
 */
export function resolveAssets(html: string, blobUrls: ReadonlyMap<string, string>): string {
  let out = html;

  out = resolveAttribute(out, 'href', blobUrls, (value, urls) =>
    ASSET.test(value) ? blobFor(value, urls) : null,
  );
  for (const name of ['src', 'poster']) {
    out = resolveAttribute(out, name, blobUrls, (value, urls) => blobFor(value, urls));
  }

  out = resolveAttribute(out, 'srcset', blobUrls, (value, urls) => resolveSet(value, urls));

  // Inline styles carry their own references; the compiler only ever saw the
  // stylesheet FILES, so a document that styles itself is resolved here.
  out = out.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_whole, open: string, css: string, close: string) =>
      `${open}${resolveUrls(css, blobUrls)}${close}`,
  );

  return out;
}
