/**
 * A template's real, editable pages — the ONE answer to "what is this template's
 * source?".
 *
 * That question used to be conflated with "show me this template", which the
 * catalog answers for nearly every slug with a SCREENSHOT wrapped in an `<img>` —
 * a picture of the template, not the template. Both are HTML and both come back
 * 200, so a caller asking for source could not tell it had been handed a
 * photograph, and loading one gave the user an image tag to edit. That is why
 * opening a template stopped loading it at all and started generating an
 * imitation from its description instead: clicking "Savor" quietly meant "write
 * something Savor-ish from scratch".
 *
 * Keeping the two questions apart is what stops that recurring. This module
 * returns real markup or null — never a picture — so a screenshot cannot reach
 * the editor through it at all, and a caller that gets null knows it has nothing
 * and is expected to SAY so rather than invent a replacement.
 *
 * Two sources, in order of fidelity:
 *   1. a document we ship for the slug (`template-previews`) — self-contained and
 *      known-good, so it costs no network and needs no rebasing;
 *   2. the template's own deployed site (`template-demos`), fetched and anchored
 *      so its relative assets still resolve once the markup is lifted out of the
 *      origin it was served from, then made to carry its own styles and faces
 *      (see `embed` below) so it does not depend on that origin for the things
 *      an opaque origin is not allowed to ask it for.
 *
 * Both therefore hand back the SAME shape — one self-contained document — which
 * is the reason there is nothing further downstream to teach about assets.
 *
 * A slug with neither has no published source, and that is still most of the
 * catalog: `template-demos` is a hand-verified allowlist, and a slug earns a
 * place in it only once its deployment has been seen to render its own design.
 * Nothing here papers over the rest — a caller that gets null is expected to say
 * it is recreating the template rather than opening it.
 */

import type { Page } from '@/types';
import { demoUrl, lifts } from './template-demos';
import { getLocalTemplatePreview } from './template-previews';

/**
 * Anchor a document at the origin it came from, so `css/main.css` and friends
 * still resolve once the markup is rendered as a standalone document with no
 * location of its own. Without this the real page loads and renders unstyled,
 * which reads as broken rather than real — worse than saying nothing.
 *
 * A document that already declares its own base keeps it: it has answered this
 * question itself, and overriding it would break the page it was holding together.
 */
function rebase(html: string, base: string): string {
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
}

/** Real markup, not an error page or a fragment a host returned with a 200. */
function isDocument(html: string): boolean {
  return /<html[\s>]/i.test(html) || /<!doctype\s+html/i.test(html);
}

/**
 * A lifted document still believes it lives where it was served.
 *
 * The preview frame is sandboxed without `allow-same-origin`, so the page paints
 * at `about:srcdoc` on an opaque origin while its markup — and the `<base>` above
 * — still name the site it came from. A client router boots by writing that
 * address into session history, and `history.replaceState` REFUSES a URL from
 * another origin: it throws, the boot stops on that line, and everything the
 * router meant to do next never happens.
 *
 * Nothing is lost by letting the call fail. There is no second document in this
 * frame and no back button pointed at one, so the entry it wanted to write has
 * no reader; what depended on it was the rest of the startup, which now runs.
 * `loop` is the case that shows the cost of not doing this: its design covers
 * itself with a preloader until React mounts, and React never mounted, so a
 * fully-rendered page sat behind a black screen forever.
 *
 * Injected ahead of the page's own scripts, which are deferred or module and so
 * always run after it.
 */
const KEEP_BOOTING =
  '<script>(function(){var h=history;["pushState","replaceState"].forEach(function(m){' +
  'var f=h[m];h[m]=function(){try{return f.apply(h,arguments)}catch(e){}}})})();</script>';

function keepBooting(html: string): string {
  return html.replace(/<head([^>]*)>/i, `<head$1>${KEEP_BOOTING}`);
}

/**
 * Anchoring is enough for an image and not enough for a typeface.
 *
 * The preview frame is sandboxed without `allow-same-origin`, so it paints on an
 * opaque origin and every request it makes leaves as `Origin: null`. A stylesheet
 * or an image does not care — those load cross-origin without permission. A FONT
 * does: it is always fetched in CORS mode, so a `@font-face` whose host answers
 * without `Access-Control-Allow-Origin` cannot load at all, no matter how well
 * the URL resolves. The catalog's hosts do not send that header, so anchoring a
 * template still lost it every custom face it had and painted it in a fallback —
 * which is precisely what "the template opened, but it looks wrong" was.
 *
 * A URL cannot be made to work here, so the document stops linking and starts
 * CARRYING: each same-origin stylesheet is fetched and inlined, and each font it
 * references becomes a `data:` URI, which has no origin left to check. Anything
 * else in the sheet is absolutized so it keeps resolving.
 *
 * The result is the shape `template-previews` already ships by hand — one
 * self-contained document — so both sources now hand back the same kind of
 * thing. It is also the editable shape: the CSS is text in the document the user
 * is editing rather than a URL pointing at someone else's server.
 */
const FONT = /\.(woff2|woff|ttf|otf|eot)(?:[?#]|$)/i;

/** The host serves these as `application/octet-stream`; a data URI has to say
 *  what it really is or the browser refuses to parse the face. */
const FONT_TYPE: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
};

/** How many bytes of font one document may carry, so a heavy template cannot
 *  turn a page into a multi-megabyte string. Past it, fonts stay linked — the
 *  page renders exactly as well as it did before, never worse. */
const CARRY_LIMIT = 2_000_000;

const URL_REF = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

/** A fetch whose failure is an answer, not an exception. */
async function read(url: string, signal: AbortSignal): Promise<Response | null> {
  try {
    const res = await fetch(url, { signal });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/** Resolve a sheet's own references: fonts carried inline, everything else
 *  anchored at the sheet's location so relative depth (`../img`) still counts. */
async function carry(
  css: string,
  sheet: string,
  budget: { left: number },
  signal: AbortSignal,
): Promise<string> {
  const resolved = new Map<string, string>();

  for (const [, , ref] of css.matchAll(URL_REF)) {
    if (resolved.has(ref) || /^(?:data:|https?:|\/\/)/i.test(ref)) continue;
    let absolute: string;
    try {
      absolute = new URL(ref, sheet).href;
    } catch {
      continue;
    }
    resolved.set(ref, absolute);

    const kind = FONT.exec(ref)?.[1]?.toLowerCase();
    if (!kind || budget.left <= 0) continue;

    const res = await read(absolute, signal);
    if (!res) continue;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > budget.left) continue;
    budget.left -= bytes.length;
    resolved.set(ref, `data:${FONT_TYPE[kind]};base64,${bytes.toString('base64')}`);
  }

  // A function replacement, so a `$&` in a font's base64 or a URL stays literal.
  return css.replace(URL_REF, (whole, _quote, ref: string) => {
    const to = resolved.get(ref);
    return to ? `url("${to}")` : whole;
  });
}

/** Swap every same-origin `<link rel=stylesheet>` for the stylesheet itself.
 *  Cross-origin sheets are left alone: a CDN sends the CORS header its fonts
 *  need, so linking already works and inlining would only add a hop. */
async function embed(html: string, base: string, signal: AbortSignal): Promise<string> {
  const budget = { left: CARRY_LIMIT };
  let out = html;

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) continue;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || /^(?:https?:|\/\/|data:)/i.test(href)) continue;

    let sheet: string;
    try {
      sheet = new URL(href, base).href;
    } catch {
      continue;
    }
    const res = await read(sheet, signal);
    if (!res) continue;

    const css = await carry(await res.text(), sheet, budget, signal);
    // `</style` anywhere in the CSS would end the block early; the backslash is
    // a valid CSS escape, so the rule still means what it said.
    out = out.replace(tag, () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
  }

  return out;
}

/**
 * The template's real pages, or null when it publishes none.
 *
 * Never throws and never partially answers: an unreachable or unconvincing
 * source is the same as no source, because a half-loaded template is indistinguishable
 * from a broken one to the person looking at it.
 */
export async function templatePages(slug: string): Promise<Page[] | null> {
  const clean = (slug || '').trim();
  if (!clean) return null;

  const shipped = getLocalTemplatePreview(clean);
  if (shipped) return [{ path: 'index.html', html: shipped }];

  // A demo we can frame is not automatically a demo we can OPEN — see `lifts`.
  const demo = lifts(clean) ? demoUrl(clean) : null;
  if (!demo) return null;

  const base = `${demo.replace(/\/+$/, '')}/`;
  // A controller rather than `AbortSignal.timeout`, which is optional: where it is
  // missing, calling it throws and the catch below reports a perfectly healthy
  // template as having no source. A capability check that fails closed is worse
  // than no check, because it is indistinguishable from the real answer.
  const control = new AbortController();
  // The document is no longer the only request: its stylesheets and their fonts
  // come too, so the budget covers the whole set rather than one page fetch.
  const expiry = setTimeout(() => control.abort(), 15000);
  try {
    const res = await fetch(base, {
      headers: { Accept: 'text/html' },
      signal: control.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!isDocument(html)) return null;
    const anchored = keepBooting(rebase(html, base));
    // Carrying the styles is an improvement on an already-working document, so
    // it degrades rather than fails: if the sheets cannot be fetched the page
    // still resolves them through <base>, exactly as it did before.
    let carried = anchored;
    try {
      carried = await embed(anchored, base, control.signal);
    } catch {
      carried = anchored;
    }
    return [{ path: 'index.html', html: carried }];
  } catch {
    return null;
  } finally {
    clearTimeout(expiry);
  }
}
