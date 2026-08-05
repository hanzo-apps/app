/**
 * One answer to "the page is not ready yet", and it is `LoadingScreen`.
 *
 * Eight pages already returned it — the brand mark on its idle breathe over a
 * line of copy that says WHAT is loading. Two did not, and they disagreed with
 * the eight and with each other: /billing centred a bare `<Spinner size={32}>`,
 * /dev/[org]/[project]/settings a bare `<HanzoLogo className="skeleton">` at a
 * different size with a different animation. Three pictures of one state, two
 * of them with nothing to read while you wait.
 *
 * The scan pins the SHAPE rather than the two files, because the shape is what
 * recurs: `screen` is the recipe for a state that owns the whole viewport, so
 * the moment someone reaches for it they are one line away from re-inventing
 * this. A full-viewport box whose only child is a spinner or a logo IS a
 * loading gate, whatever it is spelled — and it already has a name.
 *
 * `screen` itself stays fair game: /not-found, the crash screen, the OAuth
 * callback and the store receipts all fill the viewport with real content.
 * Those are states with something to say. This only catches the ones that
 * fill the viewport with a widget and say nothing.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next" || name === ".claude") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

const files = ["app", "components"].flatMap((r) => walk(join(root, r)));
const rel = (f: string) => f.replace(root + "/", "");

/**
 * A viewport-filling container whose only child is a loading widget. The close
 * tag in the pattern is what makes it "only" — a `screen` with real content
 * under the mark does not match, which is how /auth/callback's error state and
 * the 404 stay legal.
 */
const HANDROLLED = /\{\.\.\.screen\}[^>]*>\s*<(Spinner|HanzoLogo)\b[^>]*\/>\s*<\//;

describe("the full-viewport loading gate", () => {
  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("is never hand-rolled — no `screen` wrapped around a lone spinner or mark", () => {
    const offenders = files.filter((f) => HANDROLLED.test(readFileSync(f, "utf8"))).map(rel);
    expect(offenders).toEqual([]);
  });

  it("is the only PAGE that reaches for the idle breathe", () => {
    // The class has exactly two homes and they are different jobs: HanzoLogo
    // APPLIES it (it owns the mark's own animation) and LoadingScreen ASKS for
    // it (the one gate that wants a breathing mark). A third name on this list
    // is a page animating the logo itself, which is how /dev settings ended up
    // at a different size with a different animation from everyone else.
    const idle = files
      .filter((f) => /hanzo-logo-idle/.test(readFileSync(f, "utf8")))
      .map(rel)
      .sort();
    expect(idle).toEqual(["components/HanzoLogo.tsx", "components/ui/loading-screen.tsx"]);
  });

  it("is what the pages that converged actually render", () => {
    for (const f of ["app/billing/page.tsx", "app/dev/[org]/[project]/settings/page.tsx"]) {
      const src = readFileSync(join(root, f), "utf8");
      expect({ f, uses: /<LoadingScreen>/.test(src) }).toEqual({ f, uses: true });
    }
  });
});
