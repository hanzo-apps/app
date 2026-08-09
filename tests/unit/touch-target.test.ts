import { readFileSync } from "fs";
import { join } from "path";

/**
 * A tap target is a BOX, and both sides carry the 44px floor.
 *
 * `@media (pointer: coarse)` used to set `min-height` alone. That passes a
 * 28x44 icon button — tall enough to measure, too narrow for a thumb, which is
 * about as wide as it is tall. The deploy gate (universe
 * charts/app/templates/e2e-gate.yaml) read height alone for the same reason, so
 * the rule and its check agreed with each other and were both wrong: six routes
 * reported clean over four controls measuring 22, 28, 36 and 39 wide — the
 * composer's mic, its send button, the brand mark on five routes, and a filter
 * chip. Both now assert `min(width, height)`.
 *
 * `!important` is the load-bearing half and the reason this is pinned rather
 * than trusted. `size="icon"` sets its floor INLINE, and an inline declaration
 * beats any stylesheet rule on the same property whatever its specificity — the
 * same collision `.t_group_true` needs it for. Dropped, this rule is a silent
 * no-op on exactly the controls it exists for: nothing errors, nothing types
 * wrong, and every measurement goes back to passing at 36 wide.
 */
describe("the coarse-pointer touch floor", () => {
  const css = readFileSync(join(__dirname, "../../assets/globals.css"), "utf8");

  const coarse = (() => {
    const at = css.indexOf("@media (pointer: coarse)");
    expect(at).toBeGreaterThan(-1);
    // Balance braces from the block's opening one so the test reads the whole
    // media block and nothing after it.
    let depth = 0;
    for (let i = css.indexOf("{", at); i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) return css.slice(at, i + 1);
    }
    throw new Error("unbalanced @media (pointer: coarse) block");
  })();

  it("floors BOTH sides, not just height", () => {
    expect(coarse).toMatch(/min-height:\s*44px/);
    expect(coarse).toMatch(/min-width:\s*44px/);
  });

  it("outranks the inline size token", () => {
    // Both, and on the 44px declarations specifically — an `!important`
    // somewhere else in the block would satisfy a laxer match while the floor
    // itself still lost to `size="icon"`.
    expect(coarse).toMatch(/min-height:\s*44px\s*!important/);
    expect(coarse).toMatch(/min-width:\s*44px\s*!important/);
  });

  it("covers the same controls the deploy gate measures", () => {
    // The gate's predicate is button / [role=button] / a[href], prose excluded.
    // A rule that governs fewer elements than the check does fails in CI rather
    // than on a phone, which is the wrong end to find it.
    for (const sel of ["button", "\\[role='button'\\]", "a\\[href\\]"]) {
      expect(coarse).toMatch(new RegExp(`(^|,|\\s)${sel}\\s*(,|\\{)`, "m"));
    }
  });

  it("leaves a link inside a sentence alone", () => {
    expect(coarse).toMatch(/p a\[href\]/);
  });
});
