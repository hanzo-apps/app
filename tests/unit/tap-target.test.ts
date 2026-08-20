/**
 * A CONTROL IS AS BIG AS A FINGER, and the composer's mic is the one that was not.
 *
 * WCAG 2.2 §2.5.8 sets 24×24 CSS px as the floor for a pointer target. Measured
 * live on hanzo.app at four widths (390/834/1280/1728), the mic was the only
 * control on the page under it — 20×20, in a row where the mode picker and the
 * send button are both 44, so it read as a dent in the row as well as being the
 * hardest thing on the page to hit.
 *
 * The rule lives in `assets/globals.css` because @hanzo/voice styles itself
 * through one className, so this reads the sheet the browser actually loads
 * rather than a component's props — the same way the token and glass suites
 * pin their laws.
 */
import { readFileSync } from "node:fs";

import { join } from "node:path";


import { stripCss } from "../source";

const ROOT = join(__dirname, "..", "..");
const css = readFileSync(join(ROOT, "assets/globals.css"), "utf8");

/** The declaration block of a class rule, comments stripped.
 *
 *  Anchored to the START of a line, because a plain substring lands inside any
 *  DESCENDANT rule that ends in the same class — `html:root .hz-dense
 *  .voice-control` contains `.voice-control` and is written earlier in the
 *  sheet, so the search read the wrong rule and every assertion below failed on
 *  a rule they are not about. */
const ruleBody = (selector: string): string => {
  const i = css.indexOf(`\n${selector} {`) + 1;
  if (i < 1) throw new Error(`${selector} is not declared in globals.css`);
  const body = css.slice(i, css.indexOf("}", i));
  return stripCss(body);
};

const pxOf = (body: string, prop: string): number => {
  const m = new RegExp(`\\b${prop}:\\s*(\\d+)px`).exec(body);
  if (!m) throw new Error(`${prop} is not a px value in that rule`);
  return Number(m[1]);
};

describe("the voice control is a real tap target", () => {
  const body = ruleBody(".voice-control");

  it("is at least the 24px WCAG 2.2 pointer-target floor", () => {
    expect(pxOf(body, "width")).toBeGreaterThanOrEqual(24);
    expect(pxOf(body, "height")).toBeGreaterThanOrEqual(24);
  });

  it("matches the 28px send circle sharing its row", () => {
    // The mic and the send are a PAIR of round controls in the action row —
    // same 28px circle, different fill (send carries the accent, mic a neutral
    // wash). This pinned 44 when the row's controls were 44; the row changed
    // deliberately (globals.css states the pairing), so the pin follows the
    // row. The WCAG floor above is the invariant that never moves.
    expect(pxOf(body, "height")).toBe(28);
  });

  it("stays square, so the glyph sits centred rather than drifting", () => {
    expect(pxOf(body, "width")).toBe(pxOf(body, "height"));
  });
});
