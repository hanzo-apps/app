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
// 61 templates have a real shot.

export const TEMPLATE_SHOTS: ReadonlySet<string> = new Set([
  "blocks",
  "cipher-cards-html",
  "cipher-cards-react",
  "cipher-html",
  "cipher-react",
  "circle",
  "construct",
  "deploy",
  "drive",
  "drive-html",
  "folio-about",
  "folio-contact",
  "folio-creative-agency-1",
  "folio-creative-agency-2",
  "folio-creative-designer-1",
  "folio-creative-designer-2",
  "folio-creative-developer-1",
  "folio-creative-developer-2",
  "folio-details-1",
  "folio-details-2",
  "folio-details-3",
  "folio-full",
  "folio-grid-2-columns",
  "folio-grid-3-columns",
  "folio-grid-3-fluid",
  "folio-grid-4-columns",
  "folio-grid-4-fluid",
  "folio-index",
  "folio-main",
  "folio-masonry-2-columns",
  "folio-masonry-3-columns",
  "folio-masonry-3-fluid",
  "folio-masonry-4-columns",
  "folio-masonry-4-fluid",
  "folio-photography-1",
  "folio-photography-2",
  "forge",
  "hygge-bootstrap",
  "hygge-html",
  "jobfinder",
  "kinetic",
  "launch",
  "loop",
  "loop-html",
  "matrix",
  "matrix-react",
  "mint",
  "mosaic",
  "mosaic-react",
  "oasis",
  "pixel",
  "prism-react",
  "saas-landing",
  "savor",
  "soar",
  "soar-html",
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
