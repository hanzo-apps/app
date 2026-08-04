/**
 * Self-contained documents we ship for a template slug — the highest-fidelity
 * source `template-source` can hand the builder, and the only one that needs no
 * network.
 *
 * A template whose upstream is unreachable would otherwise have to be recreated
 * from its description. Where we can ship a genuinely good document instead, we
 * do, and the builder opens the real thing. `metrics` is the standing example:
 * its upstream screenshot is the repo's UI-kit table-of-contents (a white page of
 * blue links under emoji headers), so anything derived from that opened the
 * template on a link index rather than a dashboard.
 *
 * Each document is:
 *   - one standalone `<!DOCTYPE html> … </html>` (no external CSS/JS/font/img —
 *     CSP-safe; charts are inline SVG/CSS drawn from inline JS),
 *   - theme-aware: light by default, dark via `prefers-color-scheme` AND an
 *     explicit `[data-theme="dark"]` / `.dark` on <html> (either wins over OS).
 *
 * DRY/orthogonal: this is the ONE registry `template-source` consults. Add a slug
 * here only when we can ship a genuinely good document for it — a mediocre one is
 * worse than honestly saying the template has no published source.
 */

import { METRICS_DASHBOARD_HTML } from './template-previews/metrics';

const LOCAL_PREVIEWS: Record<string, string> = {
  metrics: METRICS_DASHBOARD_HTML,
};

/**
 * The self-contained preview document for a slug, or null when we ship none
 * (the loader then falls back to the gallery screenshot). Case-insensitive.
 */
export function getLocalTemplatePreview(slug: string): string | null {
  const key = (slug || '').trim().toLowerCase();
  return LOCAL_PREVIEWS[key] ?? null;
}

/** True when a local preview document exists for the slug. */
export function hasLocalTemplatePreview(slug: string): boolean {
  return getLocalTemplatePreview(slug) !== null;
}
