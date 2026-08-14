/**
 * The hosted tag, injected at publish — the ONE telemetry wire.
 *
 * Cloud serves the whole browser tag at /v1/event.js: pageviews, the site's
 * connected pixels (GA/Meta/TikTok/X via /v1/tags), and attribution — all
 * resolved server-side from the project's publishable ingest key, which is
 * minted WITH the project and rides `?key=` (the sendBeacon carrier). So a
 * published site needs exactly ONE line, and this is the one place that
 * writes it.
 *
 * This replaces nothing on the page and competes with nothing in the estate:
 * the old per-deployment tracker (lib/analytics/tracking-script) belongs to
 * the retired deployment lane and was never injected by THIS lane — published
 * sites simply emitted nothing, which is why every analytics reader had
 * nothing to read.
 *
 * Pure function of (html, key): no key → the page passes through untouched
 * (a site is never broken by its telemetry), and a page already carrying the
 * tag is left alone so republishing is idempotent.
 */

const TAG_SRC = "https://api.hanzo.ai/v1/event.js";

export function withTag(html: string, key: string): string {
  if (!key || typeof html !== "string" || html.length === 0) return html;
  if (html.includes(TAG_SRC)) return html;
  const tag = `<script src="${TAG_SRC}?key=${encodeURIComponent(key)}" defer></script>`;
  // Before </head> so the tag is parsed early; defer keeps it off the parse
  // path. A page without a head gets it before </body>; a fragment with
  // neither gets it appended — every page leaves with the tag.
  const head = html.search(/<\/head>/i);
  if (head >= 0) return `${html.slice(0, head)}${tag}\n${html.slice(head)}`;
  const body = html.search(/<\/body>/i);
  if (body >= 0) return `${html.slice(0, body)}${tag}\n${html.slice(body)}`;
  return `${html}\n${tag}`;
}
