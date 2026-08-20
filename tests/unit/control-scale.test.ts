import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { tagEnd } from "../source";

/**
 * ONE control scale.
 *
 * Every input, select and button in this app is one height, one radius and one
 * type size, from `--control-h` / `--control-radius` / `--control-fs`. The Input
 * and the SelectTrigger wear them directly (`field`, in components/control). The
 * Button comes from `@hanzo/ui` and cannot, so assets/globals.css applies the same
 * tokens to it. That rule is the ONLY place button geometry is decided.
 *
 * Measured at 1280 before this suite existed, against a 30px row: `size="icon"`
 * rendered 36px, `icon-sm` 32, `icon-lg` 40, and `size="iconXs"` — a name
 * @hanzo/ui has never defined — rendered 18.8px, its height computed from
 * line-height with no padding at all. At 390, where the token becomes 44px for
 * WCAG 2.5.8, the text buttons grew and every one of the 72 icon buttons stayed
 * 36px, with no touch compensation.
 *
 * Two mechanisms let that happen, and this file pins both shut.
 */

const ROOT = join(__dirname, "..", "..");
const SURFACE = ["app", "components"];

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
};

const files = SURFACE.flatMap((r) => walk(join(ROOT, r)));
const rel = (f: string) => f.replace(ROOT + "/", "");

/**
 * The size vocabulary, READ FROM the library rather than re-typed here.
 *
 * This is the whole point of the first mechanism. globals.css used to name the
 * sizes it covered — `default|sm|lg|xs` — which is a second copy of @hanzo/ui's
 * variant table, and only one copy was ever maintained: `xs` is not in the table
 * at all and every `icon*` size was missing from the rule. A list that has to
 * track a third-party table by hand is how the geometry drifted, so this suite
 * refuses to keep one.
 */
const SIZES: string[] = (() => {
  // FIND the declaration; do not assume where it lives. `primitives/button.d.ts`
  // held the union once, is a one-line re-export of the gui backend in one
  // install, and is absent entirely in another — a clean CI install has only
  // `backends/gui/button.d.ts`. Hardcoding any of those spellings makes this
  // suite report "the library dropped its sizes" when the library did nothing of
  // the kind, which is exactly the failure it exists to prevent.
  const root = join(ROOT, "node_modules/@hanzo/ui/dist");
  const candidates: string[] = [];
  const scan = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (e.name === "button.d.ts") candidates.push(p);
    }
  };
  scan(root);

  for (const c of candidates) {
    const dts = readFileSync(c, "utf8");
    const line = dts.match(/size\?:\s*([^;]+);/);
    if (!line) continue; // a re-export barrel declares nothing
    // Drop `import("@hanzogui/web").SizeTokens` first: its module specifier is
    // quoted too, and would otherwise be collected as a size named
    // "@hanzogui/web".
    const union = line[1].replace(/import\("[^"]+"\)/g, "");
    const sizes = [...union.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (sizes.length) return sizes;
  }
  throw new Error(
    `@hanzo/ui declares no button size union — searched ${candidates.length} button.d.ts under ${root}`,
  );
})();

/** Every `<Button …>` opening tag in the surface, with its size and className. */
type Call = { file: string; line: number; size: string; className: string };
const calls: Call[] = (() => {
  const out: Call[] = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const open = /<Button\b/g;
    let m: RegExpExecArray | null;
    while ((m = open.exec(src))) {
      const end = tagEnd(src, m.index + 7);
      if (end < 0) continue;
      const tag = src.slice(m.index, end);
      out.push({
        file: rel(f),
        line: src.slice(0, m.index).split("\n").length,
        size: (tag.match(/\bsize="([^"]+)"/) || [, "default"])[1]!,
        className: (tag.match(/className="([^"]*)"/) || [, ""])[1]!,
      });
    }
  }
  return out;
})();

describe("one control scale", () => {
  it("scans a non-trivial number of Button call sites", () => {
    expect(calls.length).toBeGreaterThan(200);
    expect(SIZES).toContain("icon");
  });

  /**
   * MECHANISM 1 — a size name that resolves to nothing.
   *
   * `@hanzo/ui` ships no `dist/index.d.ts`, so the package types as `any` and a
   * bad `size` is not a compile error. It is not a runtime error either: CVA looks
   * the name up, finds nothing, and emits no size class, so the control silently
   * collapses to its line-height. Fourteen call sites had drifted onto `iconXs`,
   * `iconXsss` and `xs` before this test existed — none of which @hanzo/ui has
   * ever defined — and nothing anywhere reported it.
   */
  it("no Button asks for a size @hanzo/ui does not define", () => {
    const bad = calls.filter((c) => !SIZES.includes(c.size));
    expect(bad.map((c) => `${c.file}:${c.line} size="${c.size}"`)).toEqual([]);
  });

  /**
   * MECHANISM 2 — a per-call-site height.
   *
   * The scale is set in ONE rule; a call site that also sets `h-8` is a second
   * opinion, and it loses, because that rule is unlayered and Tailwind's utilities
   * are not. So the class does nothing but tell the next reader a height the
   * screen does not have — which is exactly how the editor header came to be
   * described as 28px while rendering 30. 145 such classes were deleted across 32
   * files; leaving the scale is still possible, but it has to shout with
   * `!important`, which makes every exception greppable. There are five.
   */
  it("no Button sets its own height or width without shouting", () => {
    const quiet = /(?:^|\s)(?:[a-z-]+:)?(?:h|w|size)-(?:\d|px)/;
    const bad = calls.filter((c) => quiet.test(c.className));
    expect(bad.map((c) => `${c.file}:${c.line} className="${c.className}"`)).toEqual([]);
  });

  /**
   * And the rule itself must stay stated positively. If a future edit reaches for
   * `[data-size="…"]` again it has re-created the list that drifted, so say so
   * here rather than waiting for a browser to show it.
   */
  it("the button rule does not enumerate size names", () => {
    const css = readFileSync(join(ROOT, "assets/globals.css"), "utf8");
    expect(css.match(/\[data-size="[^"]+"\]/g)).toBeNull();
  });
});
