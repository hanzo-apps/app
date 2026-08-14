import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

import robots from "@/app/robots";

const root = join(__dirname, "../..");
const middleware = readFileSync(join(root, "middleware.ts"), "utf8");

/**
 * A tool only the product links to is not a public page.
 *
 * Measured on production 2026-08-08: `GET hanzo.app/test-generation` answered
 * **200 with no session**. It is the Benchmark harness the project manager
 * links to (its `TestTube` button) — 1,574 lines driving the multi-agent
 * orchestrator against scenario tracks. Everyone who could reach it through the
 * product was already signed in; the ROUTE simply never said so, and nothing
 * would ever have told us: an unprotected route does not error, it serves.
 *
 * Two lists have to agree for that to be true, and they are in different files:
 * middleware's PROTECTED_PREFIXES (who may load it) and robots' disallow (who
 * may index it). This checks them against each other rather than against a
 * third copy.
 */
const protectedPrefixes = (): string[] => {
  const block = middleware.slice(middleware.indexOf("const PROTECTED_PREFIXES"));
  return [...block.slice(0, block.indexOf("]")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

const disallowed = (): string[] => {
  const r = robots().rules;
  const one = Array.isArray(r) ? r[0] : r;
  const d = one?.disallow ?? [];
  return (Array.isArray(d) ? d : [d]).filter(Boolean) as string[];
};

describe("internal tools are gated and unindexed", () => {
  it("the Benchmark harness needs a session", () => {
    expect(protectedPrefixes()).toContain("/test-generation");
  });

  it("…and is kept out of search", () => {
    expect(disallowed()).toContain("/test-generation");
  });

  it("every login-gated route is also robots-disallowed", () => {
    // Gating without disallowing means a crawler indexes the login redirect
    // under the tool's URL — which is how /skills ended up in the sitemap.
    const missing = protectedPrefixes().filter((p) => !disallowed().includes(p));
    expect(missing).toEqual([]);
  });
});

describe("no scratch pages ship", () => {
  it("app/ carries no page whose own comment calls it temporary", () => {
    // `app/_hoverprobe/page.tsx` said "SCRATCH — delete after measuring" in its
    // first lines. That one was never committed, so it never reached anyone —
    // but a tracked one would, and silently: a route needs no import to exist.
    const bad: string[] = [];
    for (const d of readdirSync(join(root, "app"), { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const page = join(root, "app", d.name, "page.tsx");
      if (!existsSync(page)) continue;
      const head = readFileSync(page, "utf8").slice(0, 400);
      if (/\b(SCRATCH|DELETE ME|TEMPORARY|throwaway)\b/i.test(head)) bad.push(d.name);
    }
    expect(bad).toEqual([]);
  });
});
