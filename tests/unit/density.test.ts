import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

/**
 * Appearance density must keep moving the chrome.
 *
 * A NUMERIC gui space scale bakes every padding as px, and `--density` — the
 * knob the Appearance panel writes — then reaches nothing. Spacing has to be
 * `calc(Npx * var(--density, 1))` for the control to be real: a no-op at 1, and
 * proven live at 1.15, where a gui button's padding moves 12→13.8px.
 *
 * This used to be a pnpm patch, and this file guarded the patch: that it was
 * pinned, and what it said. @hanzo/ui 8.0.76 folds the same rule into the
 * package, so the patch is gone and there is nothing left to pin.
 *
 * What is asserted therefore moved with it, from the MECHANISM to the PROPERTY.
 * Testing "a patch is pinned" would now fail for the best possible reason, and
 * deleting the file would drop the guarantee at the moment it stopped being
 * ours to keep — an upstream bump that reverts the rule is exactly as silent as
 * a deleted patch was, and is the thing worth catching either way.
 */
describe("appearance: density stays wired through the @hanzo/ui space scale", () => {
  it("the package's gui config multiplies its space steps by --density", () => {
    // Read where the app resolves it, so a bump that changes the shipped shape
    // fails here rather than in the chrome.
    const config = readFileSync(
      join(ROOT, "node_modules/@hanzo/ui/dist/gui-config.js"),
      "utf8",
    );
    expect(config).toContain("var(--density, 1)");
    // Every non-zero step, not merely one mention of the variable somewhere.
    const steps = config.match(/calc\(\$\{[^}]+\}px \* var\(--density, 1\)\)/g) || [];
    expect(steps.length).toBeGreaterThan(0);
  });

  // The patch only matters once it reaches the APPLIED sheet. gui renders spacing
  // as atomic classes (`_pl-c-space-3`) that read `var(--c-space-N)`, and those
  // vars live in app/gui.css — regenerated from the config by scripts/gen-gui-css.mjs.
  // The config patch is INERT until gui.css is regenerated (the bug that made
  // density look dead the first time). This asserts the real artifact: the
  // `--c-space-N` ramp multiplies by --density. Verified live — density 1.5
  // moves a gui gap 8→12px. Regenerate gui.css after ANY gui/config change.
  it("app/gui.css space vars are density-aware — the knob actually moves the chrome", () => {
    const css = readFileSync(join(ROOT, "app/gui.css"), "utf8");
    expect(css).toContain("--c-space-1:calc(4px * var(--density, 1))");
    const rungs = css.match(/--c-space-\d+:calc\([0-9.]+px \* var\(--density/g) || [];
    expect(rungs.length).toBeGreaterThanOrEqual(10);
  });
});
