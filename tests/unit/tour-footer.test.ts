import { readFileSync } from "node:fs";

import { join } from "node:path";


/**
 * The tour's footer says two things and only two: leave, on the left, and
 * continue, on the right.
 *
 * It used to say three. Back held the left, and Skip sat beside Next — two
 * controls a thumb's width apart, one of which ends the tour. So the row read
 * "go back, or leave, then continue" when the only two answers that matter at
 * the bottom of a step are leave and continue, and the one that ends things
 * was the easy mis-tap.
 *
 * Going back moved to the step counter, which is where you were already
 * looking to know which step you are on. That also removes a decision the
 * footer should never have carried: a Back button has to be hidden on step 1,
 * so it was conditional, so the left side was sometimes empty and the row
 * changed shape as you walked through it.
 */
const overlay = readFileSync(
  join(__dirname, "..", "..", "components", "guided-tour", "overlay.tsx"),
  "utf8",
);

/** The footer row — the last XStack, which holds the two actions. */
function footer(): string {
  const at = overlay.lastIndexOf("<XStack marginTop=");
  if (at < 0) throw new Error("no footer row in overlay.tsx — this test cannot see what it guards");
  return overlay.slice(at);
}

describe("the guided tour's footer", () => {
  it("puts leaving on the left and continuing on the right", () => {
    const row = footer();
    // Every handler the row wires, in source order — which IS screen order
    // here: one flex row, no ordering props. Asserting the LIST rather than
    // "skip comes before next" is deliberate: with Back restored in front,
    // skip still preceded next and this test still passed. A pair comparison
    // cannot see a third control, and a third control was the defect.
    const wired = [...row.matchAll(/onClick=\{(\w+)\}/g)].map((m) => m[1]);
    expect(wired).toEqual(["skip", "next"]);
  });

  it("keeps a third control out of the row", () => {
    // `previous` belongs to the counter now. Back in the footer is what made
    // the row change shape between steps.
    expect(footer()).not.toContain("onClick={previous}");
  });

  it("makes the step counter the way back, and only where there is a back", () => {
    // Pressed on step 1 it would go nowhere, and an affordance that does
    // nothing is worse than none — so the control exists only past step 1.
    expect(overlay).toContain("onClick={previous}");
    expect(overlay).toMatch(/currentStepNumber > 1/);
    // It is a real control: named for a screen reader, not a bare pressable.
    expect(overlay).toMatch(/aria-label=\{`Back to step/);
  });

  it("leaves no dead showBack flag behind", () => {
    // 11 steps set it and nothing read it once Back left the footer. A flag
    // nobody reads is a lie the next reader has to disprove.
    expect(overlay).not.toContain("showBack");
    for (const f of ["steps.tsx", "types.ts"]) {
      const src = readFileSync(join(__dirname, "..", "..", "components", "guided-tour", f), "utf8");
      expect([f, src.includes("showBack")]).toEqual([f, false]);
    }
  });
});
