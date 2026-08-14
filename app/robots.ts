import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawl directives. Public marketing/product pages are indexable; the app shell
// (authed surfaces, APIs, internal tooling) is kept out of search results.
//
// This list MUST cover every one of middleware's PROTECTED_PREFIXES. It claimed
// to already and did not: /agents, /projects, /skills, /usage and /work were
// login-gated and still crawlable, so a bot indexed the login redirect under the
// tool's own URL. /skills is how one of them reached the SITEMAP — that was
// fixed at the sitemap, which was the symptom; the disagreement lived here.
// tests/unit/internal-routes.test.ts now checks the two lists against each
// other, which is the only thing that keeps a claim like this true.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/v1/",
        "/dashboard",
        "/settings",
        "/profile",
        "/billing",
        "/chat",
        "/dev",
        "/connectors",
        "/admin",
        "/auth/",
        "/login",
        "/signup",
        "/new",
        "/onboard",
        "/test-generation",
        "/agents",
        "/projects",
        "/skills",
        "/usage",
        "/work",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
