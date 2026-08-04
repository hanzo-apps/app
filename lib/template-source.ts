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
 *      origin it was served from.
 *
 * A slug with neither has no published source. Today that is nearly the whole
 * catalog: the `<slug>.hanzo.app` deployments the second source reads were wiped,
 * so every one of them 404s. Nothing here papers over that — when they are
 * redeployed, templates start opening for real again with no change to this code.
 */

import type { Page } from '@/types';
import { demoUrl } from './template-demos';
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

  const demo = demoUrl(clean);
  if (!demo) return null;

  const base = `${demo.replace(/\/+$/, '')}/`;
  // A controller rather than `AbortSignal.timeout`, which is optional: where it is
  // missing, calling it throws and the catch below reports a perfectly healthy
  // template as having no source. A capability check that fails closed is worse
  // than no check, because it is indistinguishable from the real answer.
  const control = new AbortController();
  const expiry = setTimeout(() => control.abort(), 5000);
  try {
    const res = await fetch(base, {
      headers: { Accept: 'text/html' },
      signal: control.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!isDocument(html)) return null;
    return [{ path: 'index.html', html: rebase(html, base) }];
  } catch {
    return null;
  } finally {
    clearTimeout(expiry);
  }
}
