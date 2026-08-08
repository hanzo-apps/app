import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../..");
const askAi = readFileSync(join(root, "components/editor/ask-ai/index.tsx"), "utf8");
const header = readFileSync(join(root, "components/editor/header/index.tsx"), "utf8");
const css = readFileSync(join(root, "assets/globals.css"), "utf8");

/**
 * Two composer modes, and nobody stranded in a third.
 *
 * There were three — Build, Agent (stored as `code`), and Plan — and nobody
 * could say what Agent was for standing next to Build, which is the question
 * that removed it.
 *
 * The part that is easy to get wrong is not the segment; it is the STORED
 * value. `composer-mode` lives in localStorage, so everyone who last used the
 * third mode still has "code" on disk. Narrowing the type changes nothing about
 * what is already written there — without a read-time narrowing they return to
 * a mode whose only control no longer exists.
 */
describe("the composer offers Build and Plan", () => {
  it("renders exactly those two segments", () => {
    expect(askAi).toContain('(["build", "plan"] as const)');
    expect(askAi).not.toContain('(["build", "code", "plan"] as const)');
  });

  it("narrows a stored `code` back to build rather than trusting the type", () => {
    expect(askAi).toMatch(/const mode: "build" \| "plan" = storedMode === "plan" \? "plan" : "build"/);
  });

  it("refuses a handoff naming a mode with no control", () => {
    // app/page.tsx and build-composer write localStorage.initialMode. Admitting
    // "code" there would reopen the door the segment just closed.
    expect(askAi).toContain('if (handoff === "build" || handoff === "plan")');
  });

  it("offers no tooltip for a segment that cannot be chosen", () => {
    expect(askAi).not.toContain('Agent: works in a sandbox');
  });
});

/**
 * The header's tool cluster centres — safely.
 *
 * It is a scroll container: measured at 390px it holds 254px of controls in
 * 128px. Plain `center` overflows equally in both directions and the half past
 * the scroll origin cannot be scrolled back to, so the Preview/Code tabs would
 * be permanently unreachable on a phone. `safe center` centres while it fits
 * and falls back to start alignment when it does not.
 */
describe("the builder header centres its tools without stranding them", () => {
  it("uses the safe-centring class, not a justifyContent prop", () => {
    // Scoped to the ELEMENT's own line. A whole-file regex reads the prose too:
    // the comment above this cluster quotes `justifyContent="center"` while
    // explaining why it is not used, and `[^>]*` walks straight through a
    // comment to reach the JSX below it. The first version of this test failed
    // on that, and the code was right.
    const el = header.split("\n").find((l) => l.includes('className="no-scrollbar center-safe"'));
    expect(el).toBeDefined();
    // A gui prop cannot express `safe center`, and setting both would let an
    // atomic class fight the stylesheet over the same property.
    expect(el).not.toContain("justifyContent");
  });

  it("and the class really says safe", () => {
    expect(css).toMatch(/\.center-safe\s*\{\s*justify-content:\s*safe center;/);
  });
});
