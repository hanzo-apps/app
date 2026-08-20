
import { read, stripCss } from "../source";

/**
 * ONE font token chain, pinned.
 *
 * Three packages declare font tokens at `:root` and the nearest one wins.
 * @hanzo/gui's provider wraps the whole tree in `<span class="_dsp_contents
 * font_body">` INSIDE `<body>` and Tamagui pairs `.font_body, .font_heading,
 * .is_View { font-family: var(--f-family) }` with a `:root .font_*` declaration
 * of `--f-family` holding a system stack — so that one span beats `<body>` for
 * every heading, paragraph and link. @hanzo/brand names `'Geist Sans'`, a family
 * with no `@font-face` anywhere; next/font generates `Geist`, handed over as
 * `--font-geist-sans`.
 *
 * Two declarations in `assets/globals.css` correct the whole subtree, anchored on
 * `html:root` so they outrank the upstream sheets Next loads after this one. They
 * are load-bearing and easy to lose in a whole-file edit — this pins them.
 */

const globals = read("assets/globals.css");
const layout = read("app/layout.tsx");


describe("font tokens", () => {
  const css = stripCss(globals);

  it("points --f-family at next/font's family, anchored above the upstream :root", () => {
    const rule = css.match(
      /html:root\s+\.font_body\s*,\s*html:root\s+\.font_heading\s*\{([^}]*)\}/,
    );
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/--f-family:\s*var\(--font-geist-sans\)/);
  });

  it("points --font-sans and --font-mono at next/font, never at a literal family", () => {
    // `html:root {}` is opened more than once — media queries anchor their own
    // overrides on it too (the mobile --control-h). Pin the block that declares
    // the font tokens, not whichever one happens to come first in the file.
    const rule = css.match(/html:root\s*\{[^}]*--font-sans:[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule![0]).toMatch(/--font-sans:\s*var\(--font-geist-sans\)/);
    expect(rule![0]).toMatch(/--font-mono:\s*var\(--font-geist-mono\)/);
  });

  it("declares next/font's variables on <html>, where :root can read them", () => {
    const root = layout.match(/^\s*<html\b[\s\S]*?>/m);
    expect(root).not.toBeNull();
    expect(root![0]).toContain("geistSans.variable");
    expect(root![0]).toContain("geistMono.variable");
  });
});
