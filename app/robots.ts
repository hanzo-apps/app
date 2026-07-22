import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawl directives. Public marketing/product pages are indexable; the app shell
// (authed surfaces, APIs, internal tooling) is kept out of search results. The
// disallow list mirrors middleware's PROTECTED_PREFIXES plus the API + onboarding
// routes — nothing behind a login or meant for machines should surface in results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/v1/",
        "/dashboard",
        "/settings",
        "/profile",
        "/billing",
        "/chat",
        "/dev",
        "/connectors",
        "/gallery",
        "/admin",
        "/auth/",
        "/login",
        "/signup",
        "/new",
        "/onboard",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
