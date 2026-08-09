import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

/**
 * Appearance density must keep moving the chrome.
 *
 * @hanzo/ui ships a NUMERIC gui space scale, so `--density` (written by the
 * Appearance panel) reaches nothing — every padding is baked px. A pnpm patch
 * rewrites the space tokens to `calc(Npx * var(--density,1))` so the knob works
 * (a no-op at density=1, proven live: setting --density=1.15 must move a gui
 * button's padding 12→13.8px). This patch is the ONLY thing keeping density a
 * live control rather than a UI lie — a @hanzo/ui bump that drops it, or a
 * "cleanup" that deletes it, silently reverts density to dead with nothing else
 * catching it. This guards the whole chain: pinned in package.json AND the patch
 * still makes the space scale density-aware.
 *
 * The right home is @hanzo/ui/gui-config.ts (upstream when #113 unblocks); until
 * then the patch carries it. On a @hanzo/ui bump: RE-APPLY the patch and update
 * the pin — do not just delete this test.
 */
describe("appearance: density stays wired through the @hanzo/ui space patch", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    pnpm?: { patchedDependencies?: Record<string, string> };
  };
  const patched = pkg.pnpm?.patchedDependencies ?? {};
  const entry = Object.entries(patched).find(([k]) => k.startsWith("@hanzo/ui@"));

  it("package.json pins a @hanzo/ui patch", () => {
    expect(entry).toBeDefined();
  });

  it("the patch makes the gui space scale density-aware (positive, negative, $true)", () => {
    const patch = readFileSync(join(ROOT, entry![1]), "utf8");
    expect(patch).toContain("space[`$${k}`] = `calc(${v}px * var(--density, 1))`");
    expect(patch).toContain("space[`-${k}`] = `calc(${-v}px * var(--density, 1))`");
    expect(patch).toContain("space.$true = `calc(${STEP['4']}px * var(--density, 1))`");
  });
});
