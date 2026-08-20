import { readFileSync } from "node:fs";
import { join } from "node:path";


import { sources, tagEnd } from "../source";

/**
 * A palette row's mark stretches into TWENTY pixels, so it has no margin.
 *
 * The two pickers that mark a chosen row draw the same rail: a 2px bar down its
 * left, kept because the row HIGHLIGHT belongs to the keyboard cursor —
 * without a second mark, "which one am I on" is lost the moment an arrow key
 * moves. The model picker drew it first and the page picker copied it, margin
 * and all.
 *
 * `@hanzogui/list-item` pads a row 14px vertically. The flex line a stretched
 * child expands into is therefore 20px of a 48px row, and `marginVertical="$1.5"`
 * takes 6 from each end of it. Measured in Chromium against the real component:
 * 2x8 with the margins, 2x20 without. A mark that small is not a subtle mark, it
 * is no mark at all — and nothing about the source says so, which is why it sat
 * in both files. `alignSelf` was doing its job the whole time.
 *
 * Scoped to the files that render a palette row, because 20px is the ROW's
 * number. A rule stretching down a tall card may legitimately inset itself; this
 * one has nothing to spare.
 */

const ROOT = join(__dirname, "..", "..");

const rel = (f: string) => f.replace(ROOT + "/", "");
const rows = sources(["components"], /\.tsx$/).filter((f) =>
  readFileSync(f, "utf8").includes("<CommandItem"),
);

describe("the palette row's rail", () => {
  it("is measured over every palette in the app", () => {
    // A floor before the assertion below, which is vacuously true over nothing —
    // and the file browser is here because it lists rows, not because it marks
    // one: it has no current file to mark.
    expect(rows.map(rel).sort()).toEqual([
      "components/editor/multi-tab-editor.tsx",
      "components/editor/page-navigator/index.tsx",
      "components/model-selector.tsx",
    ]);
  });

  it("carries no vertical margin", () => {
    const offenders: string[] = [];
    for (const file of rows) {
      const src = readFileSync(file, "utf8");
      for (const hit of src.matchAll(/alignSelf="stretch"/g)) {
        const open = src.lastIndexOf("<", hit.index);
        const tag = src.slice(open, tagEnd(src, open) + 1);
        if (/margin(Vertical|Top|Bottom|Block)/.test(tag)) offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
