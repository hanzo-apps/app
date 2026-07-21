// GENERATED — real self-hosted template preview shots.
//
// Set of gallery template slugs that have a captured, hand-QC'd preview image at
// `public/templates/<slug>.webp`. TemplateThumb renders that image first and
// falls back to its generated tile when a slug is absent here (or the image
// fails to load). Regenerate after adding/removing files in public/templates:
//   ls public/templates/*.webp | xargs -n1 basename | sed 's/\.webp$//'
//
// Shots are self-hosted (never gallery.hanzo.ai/screenshots — those included
// watermarked UI-kit mockups + raw link-index pages, deliberately excluded).
// De-duplicated by image content: every slug here maps to a DISTINCT picture, so
// no two gallery cards ever show the same thumbnail (49 unique shots).
//
export const TEMPLATE_SHOTS: ReadonlySet<string> = new Set([
  "blocks",
  "cipher-html",
  "cipher-react",
  "circle",
  "construct",
  "deploy",
  "drive",
  "folio-about",
  "folio-contact",
  "folio-creative-agency-1",
  "folio-creative-agency-2",
  "folio-creative-designer-2",
  "folio-creative-developer-1",
  "folio-creative-developer-2",
  "folio-details-1",
  "folio-details-2",
  "folio-full",
  "folio-grid-2-columns",
  "folio-grid-3-columns",
  "folio-grid-3-fluid",
  "folio-grid-4-columns",
  "folio-grid-4-fluid",
  "folio-masonry-2-columns",
  "folio-masonry-3-columns",
  "folio-masonry-3-fluid",
  "folio-masonry-4-columns",
  "folio-masonry-4-fluid",
  "folio-photography-1",
  "folio-photography-2",
  "forge",
  "hygge-html",
  "jobfinder",
  "kinetic",
  "launch",
  "loop",
  "matrix",
  "mint",
  "mosaic",
  "oasis",
  "pixel",
  "prism-react",
  "saas-landing",
  "savor",
  "soar",
  "solo",
  "studio",
  "unfixed",
  "unity",
  "vault",
]);

/** True when `public/templates/<slug>.webp` exists (a real preview to show). */
export function hasTemplateShot(slug: string | undefined | null): boolean {
  return !!slug && TEMPLATE_SHOTS.has(slug);
}
