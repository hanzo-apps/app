/**
 * One element, one edge.
 *
 * A Tailwind `ring` is a box-shadow drawn OUTSIDE the border box. An element
 * that declares a border and a ring therefore paints two adjacent 1–2px lines
 * that read as a single chunky rule, not as a border with a focus ring. This has
 * now been fixed twice in the /dev chrome in one sitting — the preview frame
 * (`border border-border` + `ring-1 ring-border`) and the composer (`border
 * border-border` + `ring-2 … ring-transparent`, which is invisible at rest and
 * doubles up the moment it takes focus) — so it is pinned rather than fixed a
 * third time.
 *
 * State-prefixed rings are fine and are how focus SHOULD be drawn on an element
 * that has no border (`focus-visible:ring-2`). What this refuses is the two
 * living in the same state on the same element.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";

import { join } from "node:path";


const CHROME = join(__dirname, "..", "..", "components", "editor");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return name.endsWith(".tsx") ? [p] : [];
  });
}

/** Utilities in a class list that carry no `state:` prefix. */
function unprefixed(classes: string): string[] {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => !c.includes(":"));
}

const BORDER = /^border(-\d+)?$/;
const RING = /^ring(-\d+)?$/;

describe("the /dev chrome never draws a border and a ring on the same element", () => {
  const offenders: string[] = [];

  beforeAll(() => {
    for (const file of sources(CHROME)) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/className=\{?"([^"]+)"/g)) {
        const own = unprefixed(m[1]);
        if (own.some((c) => BORDER.test(c)) && own.some((c) => RING.test(c))) {
          offenders.push(`${file.slice(CHROME.length + 1)}: ${m[1]}`);
        }
      }
    }
  });

  it("has no element declaring both", () => {
    expect(offenders).toEqual([]);
  });
});
