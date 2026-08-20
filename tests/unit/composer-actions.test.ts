import { readFileSync } from "fs";
import { join } from "path";

import { read } from "../source";

/**
 * The composer's action pair: a BARE mic and a FILLED send.
 *
 * They differ in shape because they differ in rank — only the primary action
 * carries a container. The mic used to paint a neutral 6% circle so the two
 * matched; that is the container this removes.
 *
 * The send's roundness cannot be set at the call site. It declares
 * `borderRadius={999}` and rendered 10px, because @hanzo/ui sets an icon
 * Button's radius from an atomic class the prop cannot outrank — the same
 * collision the `size="icon"` padding note records. Measured beside the mic it
 * was 36x44 at 10px against 36x36, mismatched in shape and height.
 */
const css = read("assets/globals.css");

/** Anchored to the START of a line: a bare substring lands inside any DESCENDANT
 *  rule ending in the same selector — `html:root .hz-dense .voice-control` holds
 *  `.voice-control` and is written earlier in the sheet — so the search read a
 *  rule these assertions are not about. */
const block = (sel: string) => {
  const at = css.indexOf(`\n${sel}`) + 1;
  expect(at).toBeGreaterThan(0);
  return css.slice(at, css.indexOf("}", at) + 1);
};

describe("the composer's mic and send", () => {
  it("gives the mic no container", () => {
    expect(block(".voice-control {")).toMatch(/background-color:\s*transparent/);
  });

  it("does not grow the container back on hover", () => {
    // Colour only. A background here hands back the container one
    // pointer-enter later, which is the bug wearing a pseudo-class.
    expect(block(".voice-control:hover")).not.toMatch(/background-color/);
  });

  it("keeps the mic's hit area even though nothing is drawn", () => {
    // The box is the target, not decoration: sized to the 16px glyph it would
    // leave a pointer a 16px target, and the coarse floor only lifts touch.
    const rule = block(".voice-control {");
    expect(rule).toMatch(/width:\s*28px/);
    expect(rule).toMatch(/height:\s*28px/);
  });

  it("forces the send round, because its prop cannot", () => {
    expect(css).toMatch(/html:root \[aria-label="Start building"\]/);
    const rule = block('html:root [aria-label="Start building"]');
    expect(rule).toMatch(/border-radius:\s*999px\s*!important/);
  });
});
