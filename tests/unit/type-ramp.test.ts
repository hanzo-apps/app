import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The builder chrome may only use type sizes the design ramp publishes.
 *
 * @hanzo/design is installed and loaded (app/layout.tsx imports
 * `@hanzo/ui/theme.css`, which carries design's whole sheet), so the scale is
 * not missing — it is BYPASSED. 72 call sites in components/editor write a raw
 * number instead of a token, and 20 of them write a number the ramp does not
 * contain: 10px, 12px and 15px sitting beside 11px and 13px is what "the
 * elements look wonky" is, measured.
 *
 * This is a RATCHET, not a cleanup. The 20 existing violations are listed below
 * by file, so they are visible rather than merely tolerated, and the count may
 * only go DOWN. Fixing them means changing what a rendered label measures, and
 * that is a visual decision to be made with a browser open — not a find-replace.
 * What this stops is a 21st.
 *
 * The ramp, from @hanzo/design (rem at a 16px root):
 *   --text-xs 0.6875 = 11    --text-sm 0.8125 = 13    --text-base 0.875 = 14
 *   --text-lg 1 = 16         --text-xl 1.125 = 18     --text-2xl 1.3125 = 21
 *
 * 14 never appears as a raw number because it is the body default — which is
 * the point: a size you do not have to write down cannot drift.
 */

const RAMP = new Set([11, 13, 14, 16, 18, 21, 26, 32, 40, 52, 64, 84, 112]);

/** Off-ramp sizes that already exist. Lower this; never raise it. */
const BASELINE = 20;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

function offRamp(file: string): number[] {
  const src = readFileSync(file, "utf8");
  const hits: number[] = [];
  for (const m of src.matchAll(/fontSize=\{(\d+)\}|fontSize:\s*(\d+)/g)) {
    const n = Number(m[1] ?? m[2]);
    if (!RAMP.has(n)) hits.push(n);
  }
  return hits;
}

describe("the builder chrome uses the published type ramp", () => {
  const files = walk("components/editor");

  it("adds no NEW off-ramp size", () => {
    const found: Array<{ file: string; sizes: number[] }> = [];
    for (const f of files) {
      const sizes = offRamp(f);
      if (sizes.length) found.push({ file: f.replace(/^components\//, ""), sizes });
    }
    const total = found.reduce((n, x) => n + x.sizes.length, 0);

    if (total > BASELINE) {
      const detail = found.map((x) => `  ${x.file}: ${x.sizes.join(", ")}`).join("\n");
      throw new Error(
        `${total} off-ramp font sizes, baseline is ${BASELINE}. A size the ramp does not\n` +
          `publish is a size nothing else in the app can match. Use a token — the\n` +
          `ramp is 11/13/14/16/18/21 — or lower the baseline if you removed some.\n${detail}`,
      );
    }
    expect(total).toBeLessThanOrEqual(BASELINE);
  });

  it("the ratchet is honest — the baseline is not padded", () => {
    // A baseline set far above reality would silently accept new drift, which is
    // the failure mode of every "temporary" allowance. It must be exact.
    const total = files.reduce((n, f) => n + offRamp(f).length, 0);
    expect(total).toBe(BASELINE);
  });
});
