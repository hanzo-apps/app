/**
 * Local, self-contained preview documents for gallery slugs whose upstream
 * screenshot is NOT a faithful "existing app" view.
 *
 * The `/v1/templates/:slug/html` loader (app/v1/templates/[[...path]]) normally
 * wraps the template's gallery SCREENSHOT in an <img> as the edit-mode preview —
 * which then also becomes the project's starting `index.html`. For a few kits the
 * screenshot is the repo's UI-kit table-of-contents (a plain white page of blue
 * links under emoji headers: "Login & Sign Up → sign-up-1 …"), so the builder
 * opened the "metrics" template on a link index instead of a dashboard.
 *
 * For those slugs we ship a REAL, hand-built, fully self-contained document here.
 * The loader returns it verbatim, so the preview renders a genuine dashboard AND
 * the user starts editing real HTML (not an image tag). Each document is:
 *   - one standalone `<!DOCTYPE html> … </html>` (no external CSS/JS/font/img —
 *     CSP-safe; charts are inline SVG/CSS drawn from inline JS),
 *   - theme-aware: light by default, dark via `prefers-color-scheme` AND an
 *     explicit `[data-theme="dark"]` / `.dark` on <html> (either wins over OS).
 *
 * DRY/orthogonal: this is the ONE registry the loader consults. Add a slug here
 * only when we can ship a genuinely good local document for it.
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
