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

/** The live demo URL for a slug, or null when it has no verified demo. */
export function demoUrl(slug: string): string | null {
  return TEMPLATE_DEMOS.has(slug) ? `https://${slug}.hanzo.app` : null;
}

/** How many catalog templates ship a verified live demo. */
export function demoCount(): number {
  return TEMPLATE_DEMOS.size;
}
