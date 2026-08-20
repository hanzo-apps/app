import { readFileSync } from "fs";
import { join } from "path";

import { read } from "../source";

/**
 * The idle typewriter placeholder ("Ask Hanzo to build <phrase>") is longer than
 * a typed idea, and the field auto-grows on the VALUE, not the placeholder — so
 * at the narrowest phone widths the longest phrase wraps to a third line the
 * two-line box cannot show, and the button row slices it. Measured across all
 * twelve phrases: a third line is needed only at ≤322px, so a min-height FLOOR
 * under 340px holds the field open there and leaves 360px+ byte-identical.
 *
 * Pinned because the regression is INVISIBLE, like the touch-target and
 * reachable laws next to it: delete the rule and nothing errors, nothing warns —
 * the placeholder is simply clipped on a 320px screen no gate renders. Two halves
 * are load-bearing and each would fail silently on its own:
 *   - `!important`: the coarse-pointer tap floor also writes `min-height`, and an
 *     important declaration is only outranked by another one.
 *   - the `.hz-ask` SCOPE: `.hz-composer` is on the builder's composer at /dev as
 *     well, so a `.hz-composer textarea` floor would inflate that field on a phone
 *     too. The floor rides a class carried ONLY by the field with the typewriter.
 */
describe("the narrow-width placeholder floor", () => {
  const css = read("assets/globals.css");
  const composer = readFileSync(
    join(__dirname, "../../components/build-composer/index.tsx"),
    "utf8",
  );

  it("floors the typewriter field open under 340px, with !important", () => {
    const at = css.indexOf("max-width: 340px");
    expect(at).toBeGreaterThan(-1);
    const block = css.slice(at, at + 200);
    expect(block).toMatch(/html:root\s+\.hz-ask/);
    expect(block).toMatch(/min-height:\s*84px\s*!important/);
  });

  it("scopes the floor to .hz-ask so the builder composer is untouched", () => {
    const at = css.indexOf("max-width: 340px");
    const block = css.slice(at, at + 200);
    // A .hz-composer floor here would also grow the /dev builder's field.
    expect(block).not.toMatch(/\.hz-composer\s+textarea/);
    // …and the class the rule targets must actually be on the typewriter field.
    expect(composer).toMatch(/hz-ask/);
  });
});
