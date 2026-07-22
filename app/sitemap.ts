import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The public, crawlable surface. Authed/internal routes are intentionally absent
// (they're disallowed in robots too). Priorities reflect marketing importance, not
// a promise about update cadence — every route here has a real page.tsx.
const ROUTES: Array<[path: string, priority: number]> = [
  ["", 1.0],
  ["/pricing", 0.9],
  ["/features", 0.9],
  ["/install", 0.8],
  ["/integrations", 0.8],
  ["/templates", 0.7],
  ["/enterprise", 0.7],
  ["/docs", 0.7],
  ["/faq", 0.6],
  ["/learn", 0.6],
  ["/resources", 0.6],
  ["/community", 0.5],
  ["/store", 0.5],
  ["/skills", 0.5],
  ["/support", 0.5],
  ["/help", 0.5],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(([path, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
