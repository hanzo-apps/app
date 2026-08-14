// Which gallery slugs the app can show a preview for, and which of those have a
// real photograph behind them.
//
// Two different questions, kept apart:
//
//   TEMPLATE_SHOTS  — the slug is previewable at all. The landing strip and the
//                     gallery gate on this, so a slug leaving it leaves those
//                     surfaces.
//   hasTemplateShot — there is a captured picture at public/templates/<slug>.webp.
//                     TemplateThumb asks this one; a false answer means the card
//                     is DRAWN instead (lib/template-schematic).
//
// SHOTS is the file listing, and regenerates from it:
//   ls public/templates/*.webp | xargs -n1 basename | sed 's/\.webp$//'
//
// Shots are self-hosted (never gallery.hanzo.ai/screenshots — those included
// watermarked UI-kit mockups + raw link-index pages, deliberately excluded).
//
// DRAWN is what that exclusion missed. Five slugs shipped ONE recycled bento
// UI-kit mockup between them: the same near-black canvas, the same
// "Default / Square / Horizontal / Background" widget in the top-left corner,
// the same grid of "Discover" cards. They passed the de-duplication because it
// compared sha256 of the FILES, which is not a question about what a picture
// looks like — a 16×16 hash of that corner puts matrix, mosaic, blocks and
// cipher-html 0–1 bits apart. `template-hues.json` measures all five at
// saturation ~0, and bySpectrum sorts neutrals last, so they rendered adjacent
// at the tail of the strip: five cards in a row that read as one placeholder.
//
// They also described the wrong template — the jobfinder shot is "Smart Wallet /
// Secure Payment / Shopping Cart", the mosaic one "Manage Components". Their
// files are deleted; each is drawn from its slug instead, so Job Finder is a
// jobs list, Mosaic an image grid and Matrix a dashboard, each in its own hue.
const SHOTS: ReadonlySet<string> = new Set([
  "agenda-grid",
  "artist-epk",
  "band-setlist",
  "bistro-site",
  "booking-timeslot",
  "changelog-ship",
  "cipher-react",
  "circle",
  "construct",
  "daily-standup",
  "deploy",
  "digital-dropstore",
  "dispatch-newsletter",
  "drive",
  "engineering-devlog",
  "event-rally",
  "expense-spend",
  "feature-upvote",
  "feedback-signal",
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
  "gear-locker",
  "habit-streak",
  "helpdesk-deskline",
  "hygge-html",
  "inventory-stockroom",
  "issue-press",
  "kanban-lane",
  "kinetic",
  "launch",
  "link-onepage",
  "longform-essays",
  "loop",
  "meetup-gather",
  "mint",
  "oasis",
  "photo-essay",
  "pixel",
  "prism-react",
  "product-trailmap",
  "proposal-quotewright",
  "reading-shelf",
  "release-smartlink",
  "resume-curriculum",
  "saas-landing",
  "savor",
  "shop-storefront",
  "soar",
  "solo",
  "sprint-retro",
  "studio",
  "team-roster",
  "unfixed",
  "unity",
  "vault",
  "waitlist-launchpad",
]);

/** Previewable, but by drawing — the recycled-mockup slugs described above. */
const DRAWN: ReadonlySet<string> = new Set([
  "blocks",
  "cipher-html",
  "jobfinder",
  "matrix",
  "mosaic",
]);

/** Every slug the gallery and the landing strip can show a preview for. */
export const TEMPLATE_SHOTS: ReadonlySet<string> = new Set([...SHOTS, ...DRAWN]);

/** True when `public/templates/<slug>.webp` exists (a real picture to show). */
export function hasTemplateShot(slug: string | undefined | null): boolean {
  return !!slug && SHOTS.has(slug);
}
