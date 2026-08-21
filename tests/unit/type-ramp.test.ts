import { readFileSync } from "node:fs";
import { join } from "node:path";


import { root, sources } from "../source";

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
 * 14 never appears as a raw number because it is the body default — which is
 * the point: a size you do not have to write down cannot drift.
 *
 * THE RAMP IS READ, NOT REMEMBERED. It used to be a hand-copied list, and a
 * hand-copied list is a second source of truth that drifts in silence: this one
 * said `--text-lg 1rem = 16` and `--text-xl 1.125rem = 18` while the installed
 * theme.css published 15 and 17. So the guard had it backwards on both rungs —
 * a call site writing 15 or 17, which ARE rungs, would have been failed, and 16
 * or 18, which are not, sailed through. Nothing detected it, because a ramp
 * table cannot be wrong in a way its own test notices.
 *
 * It is derived from `@hanzo/ui/theme.css` now — the same file the browser
 * loads — so bumping the package moves this with it. Each rung is
 * `clamp(floor, calc((0.875rem ± Nrem * ratio) * scale), ceiling)`; evaluated
 * at the defaults (ratio 1, scale 1, 16px root) that is the px a call site
 * would have to type to match it.
 */

/** The rungs, in px, exactly as @hanzo/ui publishes them. */
function publishedRamp(): Set<number> {
  const css = readFileSync(require.resolve("@hanzo/ui/theme.css", { paths: [root] }), "utf8");
  const rungs = new Set<number>();
  // EVERY `--text-*` the sheet declares, never a list of names. Spelling the
  // names out is the same hand-copy this function exists to remove, one level
  // down: written as `xs|sm|base|xl…` it silently omitted `lg`, so 15 — a real
  // rung — was absent from the ramp and a call site using it would have failed.
  // `floor` and `ceiling` are the clamp's bounds, not rungs.
  for (const m of css.matchAll(/--text-(?!floor|ceiling)[a-z0-9]+:([^;]+);/g)) {
    // Strip the clamp() bounds — they are a legibility floor and ceiling, not
    // rungs — then read the rung's own arithmetic at the defaults.
    const inner = /calc\((.*)\), var\(--text-ceiling\)/.exec(m[1])?.[1] ?? m[1];
    // A RUNG IS A STEP OFF THE BODY. Every one design publishes is built as
    // `0.875rem ± Nrem * ratio`; the semantic aliases beside them — control,
    // helper, primary, the colours — are not on the scale. `--text-control` is
    // a flat `1rem`, and taken as a rung it admitted 16 to the ramp, which is
    // the value this guard's old hand-copied table wrongly claimed `lg` was.
    if (!inner.includes("0.875rem")) continue;
    // The sign belongs to the term and is CAPTURED — reading it back out of the
    // surrounding text does not work, because the match starts AT the `-`, so
    // an index-based peek lands on the previous term's `rem`. Written that way
    // first: every rung came out additive, xs read 17 instead of 11 and sm 15
    // instead of 13, and the suite stayed green because the corpus below is
    // empty and a set nothing is compared against cannot be observed to be
    // wrong. Hence the invariant after the loop.
    const terms = [...inner.matchAll(/(-?)\s*([\d.]+)rem/g)];
    if (!terms.length) continue;
    const px = terms.reduce((n, t) => n + (t[1] === "-" ? -1 : 1) * Number(t[2]) * 16, 0);
    if (Number.isFinite(px)) rungs.add(Math.round(px));
  }
  // Structural, not a second copy of the table: the ramp is built by stepping
  // both ways off a 0.875rem body, so it MUST straddle 14. All-additive is what
  // a broken ± parse looks like, and it is silent without this.
  const straddles = [...rungs].some((r) => r < 14) && [...rungs].some((r) => r > 14);
  if (rungs.size < 6 || !straddles) {
    throw new Error(
      `parsed ${rungs.size} rungs from @hanzo/ui/theme.css (${[...rungs].sort((a, b) => a - b)})\n` +
        `and they do not straddle the 14px body — the ramp's shape changed and this\n` +
        `parser did not. Fix the parser; do NOT hand-write the list back, which is\n` +
        `the drift this exists to stop.`,
    );
  }
  return rungs;
}

const RAMP = new Set([
  ...publishedRamp(),
  // This app retunes --text-xs to 12 (see assets/globals.css); both the
  // package's 11 and the retune are legitimate to meet in source.
  12,
]);

/**
 * Off-ramp sizes that already exist. Lower this; never raise it.
 *
 * Zero. The type-scale pass took the last 20 off the board, and the ratchet is
 * exact by design — a baseline left above reality is the "temporary allowance"
 * that silently re-admits drift, which is what the second test here exists to
 * catch. It caught this one: the sizes went to 0 and the number stayed at 20.
 */
const BASELINE = 0;

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
  // `markdown-renderer` is in scope because it IS the builder chat's prose —
  // every assistant reply renders through it, so its type is chat type, and it
  // was outside the ratchet only because it sits in its own directory. Two raw
  // sizes were living there when it was added (a table's `11` and `12`, the
  // `11` a rung below this app's own retune).
  const files = sources(["components/editor", "components/markdown-renderer"]);

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
          `publish is a size nothing else in the app can match — and a RAW size, on or\n` +
          `off the ramp, is frozen against Appearance's text-size and contrast knobs.\n` +
          `Use a token. The ramp @hanzo/ui publishes today is\n` +
          `  ${[...RAMP].sort((a, b) => a - b).join("/")}\n` +
          `or lower the baseline if you removed some.\n${detail}`,
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
