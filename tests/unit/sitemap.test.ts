import { existsSync, readFileSync } from "fs";
import { join } from "path";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

import { read, root } from "../source";

/**
 * The sitemap says what is public and canonical. Nothing checked either claim.
 *
 * Measured against production 2026-08-08: the sitemap served 16 URLs and five
 * were wrong, in four different ways.
 *
 *   /integrations  307 -> /connectors, a path robots.ts DISALLOWS
 *   /support       307 -> /help
 *   /help          307 -> https://docs.hanzo.ai   (a next.config redirect)
 *   /skills        307 -> /login?redirect=/skills (middleware-protected)
 *   /templates     listed TWICE, at two priorities
 *
 * The note that used to sit in sitemap.ts said "every route here has a real
 * page.tsx", and that was LITERALLY TRUE of the redirects — `/integrations` and
 * `/support` are page.tsx files whose entire body is `redirect()`. A true
 * sentence about the wrong property is how all five survived.
 *
 * So these read the repo's own declarations rather than a copied list, and they
 * check the property that matters: not "does a file exist" but "is this URL the
 * canonical, public, reachable-without-login one".
 */

const paths = () =>
  sitemap()
    .map((e) => new URL(e.url).pathname.replace(/\/$/, ""))
    .filter((p) => p !== "");

const rules = () => {
  const r = robots().rules;
  return Array.isArray(r) ? r[0] : r;
};

const disallowed = () => {
  const d = rules()?.disallow ?? [];
  return (Array.isArray(d) ? d : [d]).filter(Boolean) as string[];
};

/** middleware's PROTECTED_PREFIXES, read from source so there is one list. */
const protectedPrefixes = (): string[] => {
  const src = read("middleware.ts");
  const block = src.slice(src.indexOf("const PROTECTED_PREFIXES"));
  return [...block.slice(0, block.indexOf("]")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

describe("every sitemap URL is canonical", () => {
  it("is not a page whose whole job is redirecting somewhere else", () => {
    const aliases = paths().filter((p) => {
      const file = join(root, "app", p, "page.tsx");
      if (!existsSync(file)) return false; // covered by the next test
      const src = readFileSync(file, "utf8");
      return /\bredirect\((["'`])/.test(src) && /from ["']next\/navigation["']/.test(src);
    });
    expect(aliases).toEqual([]);
  });

  it("has a page of its own — a next.config redirect is not a page", () => {
    // /help had no page under app/ at all; it was a next.config redirect to
    // docs.hanzo.ai, so nothing under app/ would ever have revealed it.
    const config = read("next.config.ts");
    const redirected = [...config.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(paths().filter((p) => redirected.includes(p))).toEqual([]);
  });
});

describe("every sitemap URL is public", () => {
  it("is not behind middleware's login gate", () => {
    const gated = paths().filter((p) =>
      protectedPrefixes().some((pre) => p === pre || p.startsWith(`${pre}/`)),
    );
    expect(gated).toEqual([]);
  });

  it("is not disallowed by robots", () => {
    const bad = paths().filter((p) =>
      disallowed().some((rule) =>
        p === rule || p.startsWith(rule.endsWith("/") ? rule : `${rule}/`),
      ),
    );
    expect(bad).toEqual([]);
  });

  it("appears exactly once", () => {
    const seen = paths();
    expect(seen).toEqual([...new Set(seen)]);
  });
});

describe("robots still says what it must", () => {
  it("names each area once", () => {
    // `/v1/` was listed twice. Harmless to a crawler; a duplicated rule is a
    // list nobody is reading.
    expect(disallowed()).toEqual([...new Set(disallowed())]);
  });

  it("keeps the login, API and builder surfaces out of search", () => {
    // The checks above only prove the sitemap does not CONTRADICT robots. If
    // robots itself stopped disallowing these, they would all still pass.
    for (const rule of ["/v1/", "/login", "/dev", "/connectors"]) {
      expect(disallowed()).toContain(rule);
    }
  });
});
