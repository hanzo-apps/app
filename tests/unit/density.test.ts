import { readFileSync } from "node:fs";

import { join } from "node:path";


const ROOT = join(__dirname, "..", "..");

/**
 * Appearance density must keep moving the chrome.
 *
 * gui renders spacing as atomic classes (`_pl-c-space-3`) that read
 * `var(--c-space-N)`. If those are baked px, `--density` — the value the
 * Appearance panel writes — reaches nothing, and the control is a UI lie: the
 * slider moves, the number changes, the page does not.
 *
 * This guards the GUARANTEE, not the mechanism. It used to assert that a pnpm
 * patch existed and that the patch contained particular lines, because that is
 * how the multiplier got in. @hanzo/ui 8.0.76 does it in `gui-config` upstream,
 * so the patch is gone — and a test written against the mechanism failed the
 * build for a change that IMPROVED it, while the thing worth protecting was
 * never in question. Asserting the artifact instead means the multiplier can
 * arrive from a patch, from the package, or from anywhere later, and this still
 * bites the day it stops arriving.
 *
 * The artifact is `app/gui.css`, which is GENERATED from the config by
 * scripts/gen-gui-css.mjs. Regenerate it after any gui or config change: the
 * config alone is inert, which is exactly how density looked dead the first
 * time. Verified live — density 1.5 moves a gui gap 8→12px.
 */
describe("appearance: density stays wired through the gui space scale", () => {
  const css = readFileSync(join(ROOT, "app/gui.css"), "utf8");

  it("the space ramp multiplies by --density, at every rung", () => {
    expect(css).toContain("--c-space-1:calc(4px * var(--density, 1))");
    const rungs = css.match(/--c-space-\d+:calc\([0-9.]+px \* var\(--density/g) || [];
    expect(rungs.length).toBeGreaterThanOrEqual(10);
  });

  it("negative space tracks it too, or gaps and offsets drift apart", () => {
    const neg = css.match(/--c-space--\d+:calc\(-?[0-9.]+px \* var\(--density/g) || [];
    expect(neg.length).toBeGreaterThan(0);
  });

  it("defaults to 1, so an app that never writes --density is unchanged", () => {
    expect(css).toContain("var(--density, 1)");
  });
});
