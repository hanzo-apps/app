// VERIFIED — catalog templates with a real, live demo at `<slug>.hanzo.app`.
//
// The gallery deploys curated templates as static sites through the ONE serve
// (POST /v1/projects/deploy → clients/sites → `<slug>.hanzo.app`). Deploying is not
// the same as WORKING, so a slug earns a place here only after being rendered in
// a real browser and judged on what a visitor actually SEES. A 200 is not enough:
// the deployed set also contains raw file-index scaffolding ("Index Page" / "Page
// List" — a white page of blue links), vendor purchase splashes, sites whose
// `_next` chunks 404 into "Application error: a client-side exception has
// occurred", and slugs whose subdomain serves the Hanzo marketing page instead of
// the template. None of those may be framed — a broken preview is worse than the
// screenshot it would replace.
//
// Consumers never read this set directly: `entry()` in lib/templates-catalog
// derives `demo` from it, so the catalog stays the single source of truth. When a
// slug is absent the detail page falls back to its self-hosted shot
// (lib/template-shots) exactly as before.
//
// Re-verify with a headless render of `https://<slug>.hanzo.app/` — accept only a
// page whose visible body text is substantial AND is the template's own design.

const TEMPLATE_DEMOS: ReadonlySet<string> = new Set([
  "blocks",
  "canvas",
  "cipher-html",
  "drive",
  "forge",
  "kinetic",
  "loop",
  "matrix",
  "mint",
  "mosaic",
  "pixel",
  "prism-react",
  "saas-landing",
  "solo",
  "studio",
  "synapse",
  "unity",
  "vault",
]);

/**
 * Demos whose client build starts only at its own URL.
 *
 * Framing a demo and OPENING one ask different things of the same site. A
 * frame lets it keep its address; lifting its markup into the builder does not
 * — the preview paints at `about:srcdoc` on an opaque origin, and a router that
 * reads `location.href` to boot gets a string that is not a URL. Next's App
 * Router throws there, its error boundary paints "Application error: a
 * client-side exception has occurred" over the page, and a build that renders
 * nothing until it mounts (`kinetic`, a bare `<div id="root">`) simply stays
 * blank. All four are healthy at `<slug>.hanzo.app`, so they keep their demo
 * link; what they cannot do is travel.
 *
 * Measured by rendering each payload in the real preview — `srcdoc` +
 * `sandbox="allow-scripts allow-forms"`, no `allow-same-origin` — and reading
 * what a visitor would SEE. Re-verify the same way; a live-site check cannot
 * see this class of failure, which is why these were once listed as verified.
 */
const OWN_URL_ONLY: ReadonlySet<string> = new Set([
  "kinetic",
  "prism-react",
  "saas-landing",
  "synapse",
]);

/** The live demo URL for a slug, or null when it has no verified demo. */
export function demoUrl(slug: string): string | null {
  return TEMPLATE_DEMOS.has(slug) ? `https://${slug}.hanzo.app` : null;
}

/**
 * Whether a demo's own markup survives being lifted into the builder's preview.
 *
 * Separate from `demoUrl` on purpose: that one answers "is there a live site to
 * SHOW", this one answers "is there source we can OPEN". Braiding them would
 * either strip four working demo links off the marketing pages or frame four
 * error screens in the editor.
 */
export function lifts(slug: string): boolean {
  return TEMPLATE_DEMOS.has(slug) && !OWN_URL_ONLY.has(slug);
}

/** How many catalog templates ship a verified live demo. */
export function demoCount(): number {
  return TEMPLATE_DEMOS.size;
}
