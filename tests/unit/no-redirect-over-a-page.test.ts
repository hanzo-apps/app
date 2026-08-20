import { existsSync } from "fs";
import { join } from "path";

import { read, root } from "../source";

/**
 * A redirect runs BEFORE routing, so a redirect whose source is also a route
 * makes that route unreachable — and nothing anywhere errors. The page builds,
 * deploys, and answers every request with someone else's site.
 *
 * /help sat in exactly that state from 2026-07-18, when the support hub at
 * app/help/page.tsx landed, until 2026-08-13. Five link sites point at /help,
 * and every one of them left the app for docs.hanzo.ai — a different
 * application, where a phone finds 20 controls under 44px and a sidebar whose
 * opener never paints, so it cannot be opened at all (measured at 375x667).
 * The redirect predated the page and outlived the 404 that justified it.
 *
 * The sitemap suite next door does not catch this: it compares redirect sources
 * against the SITEMAP, and /help is not in the sitemap — re-adding the redirect
 * leaves that suite green (measured before writing this).
 *
 * So the invariant is stated here, and it is the general one rather than the
 * instance: any redirect source that names a route is shadowing it.
 */

/** The `redirects()` sources, read from the config — `headers()` also has a `source:`. */
const redirectSources = (): string[] => {
  const src = read("next.config.ts");
  const block = src.slice(src.indexOf("async redirects()"));
  return [...block.slice(0, block.indexOf("];")).matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]);
};

describe("a redirect never shadows a route", () => {
  it("reads the config at all", () => {
    // The floor. The assertion below is satisfied vacuously by an empty list,
    // which is what a renamed config key or a rewritten block would produce.
    expect(redirectSources().length).toBeGreaterThan(0);
  });

  it("redirects nothing this app has a page for", () => {
    const shadowed = redirectSources().filter((source) =>
      ["page.tsx", "page.ts", "route.ts"].some((file) =>
        existsSync(join(root, "app", source, file)),
      ),
    );
    expect(shadowed).toEqual([]);
  });
});
