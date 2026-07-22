// The ONE canonical public origin for this deployment. Every absolute URL the app
// emits for ITSELF — metadataBase, OpenGraph/Twitter cards, robots, sitemap — derives
// from here, so a white-label deployment overrides it in ONE place via
// NEXT_PUBLIC_APP_URL (the same env the rest of the app already reads).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://hanzo.app"
).replace(/\/+$/, "");
