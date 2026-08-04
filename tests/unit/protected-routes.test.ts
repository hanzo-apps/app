import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every route that draws the signed-in app requires a session.
 *
 * `AppShell` is the sidebar — Dashboard, Projects, Connectors, Settings — and it
 * is meaningless to someone who cannot open any of it. A signed-out visitor to
 * /sessions was shown that entire navigation wrapped around an empty page,
 * because middleware's PROTECTED_PREFIXES had seven entries while seventeen
 * routes mounted the shell. The gate existed; the LIST had drifted.
 *
 * So the list is no longer kept by hand. This derives it from the pages that
 * actually import AppShell and fails when the two disagree — which leaves the
 * author two honest answers: protect the route, or stop wearing the shell on a
 * page meant to be public.
 */
const ROOT = join(__dirname, "..", "..");

/** Whether a page MOUNTS the signed-in shell — imports it, or renders it.
 *
 * Not "mentions it": a page that has moved to the public chrome may well explain
 * in prose why it no longer wears AppShell, and a substring match reads that
 * explanation as the thing it is denying. */
function mountsShell(src: string): boolean {
  return /from\s+["']@\/components\/app-shell["']/.test(src) || /<AppShell[\s>]/.test(src);
}

/** Top-level route prefix for every page that mounts AppShell. */
function shelledPrefixes(): Set<string> {
  const out = new Set<string>();
  const walk = (dir: string, route: string[]) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        // A route GROUP `(public)` is organisational and contributes no segment.
        walk(p, name.startsWith("(") ? route : [...route, name]);
      } else if (name === "page.tsx" && mountsShell(readFileSync(p, "utf8"))) {
        // The first STATIC segment is the prefix middleware matches on; a
        // dynamic one (`[id]`) is already covered by its parent.
        const first = route.find((s) => !s.startsWith("["));
        if (first) out.add(`/${first}`);
      }
    }
  };
  walk(join(ROOT, "app"), []);
  return out;
}

/** The list middleware actually enforces. */
function declaredPrefixes(): Set<string> {
  const src = readFileSync(join(ROOT, "middleware.ts"), "utf8");
  const block = src.match(/const PROTECTED_PREFIXES = \[([\s\S]*?)\];/);
  if (!block) throw new Error("middleware.ts no longer declares PROTECTED_PREFIXES");
  return new Set([...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

describe("every route that draws the signed-in app is gated", () => {
  it("no page mounts AppShell on an unprotected prefix", () => {
    const declared = declaredPrefixes();
    const missing = [...shelledPrefixes()].filter((p) => !declared.has(p)).sort();
    expect(missing).toEqual([]);
  });

  it("the gate is not a formality — it protects a real, non-trivial surface", () => {
    // Guards the derivation itself: a walk that silently found nothing would make
    // the test above pass while protecting nothing.
    //
    // The floor is one below the true count, so it catches a walk that broke
    // without pinning an exact number. It sat at 11 while /sessions drew the
    // shell; that route is now a redirect to tabs.hanzo.ai and mounts nothing,
    // and middleware dropped it from PROTECTED_PREFIXES for the same reason.
    expect(shelledPrefixes().size).toBeGreaterThan(9);
  });
});
