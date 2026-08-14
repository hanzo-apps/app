import { readFileSync } from "fs";
import { join } from "path";

/**
 * hanzo.app is dark-only, and the generated gui sheet may not ask the OS.
 *
 * Tamagui emits theme root variables behind `prefers-color-scheme` media
 * gates. On a light-OS browser the dark gate never applied and the LIGHT gate
 * did — so the gui token table ($background, $color3…) resolved light and the
 * whole editor painted white beside dark class-token surfaces. Measured on
 * production via Playwright, whose colorScheme defaults to light: every
 * builder pane shot came back white while /dev's shell came back dark.
 *
 * scripts/gen-gui-css.mjs now unwraps the dark gates (their values become the
 * unconditional ones) and DROPS the light theme entirely — a dark-only
 * product has exactly one theme in its sheet. This pins the output, because
 * the failure returns silently on any regeneration with a newer gui.
 */
describe("app/gui.css", () => {
  const css = readFileSync(join(__dirname, "../../app/gui.css"), "utf8");

  it("never asks the OS for a color scheme", () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
  });

  it("still carries the dark token table, unconditionally", () => {
    // The unwrap must leave the values, not delete them with the gate.
    expect(css).toMatch(/--background0:/);
    expect(css).toMatch(/\.t_dark/);
  });
});
