import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The public, crawlable surface.
//
// Three rules, and all three were being broken when this was measured against
// production 2026-08-08:
//
//   1. A listed URL is CANONICAL, not an alias. `/integrations` (-> /connectors)
//      and `/support` (-> /help) are `page.tsx` files whose whole body is
//      `redirect()`, and `/help` is a next.config redirect to docs.hanzo.ai.
//      All three "have a real page.tsx", which is why the note that used to sit
//      here said so and was still wrong: a sitemap of aliases spends crawl
//      budget to be told the answer is elsewhere.
//   2. Nothing behind a login. `/skills` answered 307 -> /login?redirect=/skills,
//      so the public sitemap was advertising an authed page.
//   3. Nothing robots disallows. `/integrations` resolved to `/connectors`,
//      which robots.ts disallows outright — the two files contradicted.
//
// A route also appeared TWICE (`/templates`, at two different priorities), which
// is how a 12-entry list served 16 URLs.
//
// tests/unit/sitemap.test.ts checks all three WITHOUT the network, against the
// repo's own declarations: each route's page.tsx must not be a bare redirect,
// middleware's PROTECTED_PREFIXES must not contain it, and robots must not
// disallow it. Every one of these defects was a redirect, which is exactly what
// looks like a working link from inside the repo.
// Priorities reflect marketing importance, not a promise about update cadence.
const ROUTES: Array<[path: string, priority: number]> = [
  ["", 1.0],
  ["/pricing", 0.9],
  ["/features", 0.9],
  ["/install", 0.8],
  ["/templates", 0.7],
  ["/enterprise", 0.7],
  ["/docs", 0.7],
  ["/faq", 0.6],
  ["/learn", 0.6],
  ["/community", 0.5],
  ["/store", 0.5],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(([path, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
