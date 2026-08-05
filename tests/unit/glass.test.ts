import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ONE glass.
 *
 * The material is not a look a call site opts into — it is a property of what a
 * thing IS. A popover is over the page or it is nothing, so it is glass; a card
 * in the flow has nothing behind it to soften, so it is not. That distinction
 * survives only if the material stays attached to the slot and the depth stays
 * on one ladder, and both had already drifted once: of 135 floating surfaces
 * exactly one had reached for `.frosted`, while a dozen dialogs pinned an
 * opaque fill by hand.
 *
 * These are the invariants that keep the drift from starting again. Each one
 * failed for real before it was written.
 */

const ROOTS = ["components", "app", "lib", "hooks"];
const EXT = /\.(tsx?|jsx?)$/;

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next" || name === ".claude") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(name)) out.push(full);
  }
  return out;
}

const repoRoot = join(__dirname, "..", "..");
const files = ROOTS.flatMap((r) => walk(join(repoRoot, r)));
const rel = (f: string) => f.replace(repoRoot + "/", "");
const offendersOf = (re: RegExp) =>
  files.filter((f) => re.test(readFileSync(f, "utf8"))).map(rel);

const css = readFileSync(join(repoRoot, "assets", "globals.css"), "utf8");
const chrome = readFileSync(join(repoRoot, "lib", "chrome.ts"), "utf8");

describe("The material attaches to the slot, not to who remembered", () => {
  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  // Every one of these is floating chrome BY CONSTRUCTION. If @hanzo/ui adds a
  // surface, or renames a slot, this is where it gets noticed — rather than in
  // a screenshot six weeks later showing one opaque menu among forty glass ones.
  it.each([
    "dialog-content",
    "popover-content",
    "select-content",
    "dropdown-menu-content",
    "dropdown-menu-sub-content",
    "menu-content",
    "tooltip-content",
  ])("%s wears the frosted material", (slot) => {
    const frostedBlock = css.slice(
      css.indexOf("@supports (backdrop-filter"),
      css.indexOf("/* Depth —"),
    );
    expect(frostedBlock).toContain(`[data-slot="${slot}"]`);
  });

  it("the blur is stated ONCE — no second radius anywhere in the sheet", () => {
    // Eight sticky bars once carried four different radii (8px, 12px, 24px and
    // the frosted 20px nobody had told them about). A second backdrop-filter
    // DECLARATION here is how that starts over.
    //
    // The `@supports (backdrop-filter: blur(8px))` condition is not one — it is
    // a capability probe, and its argument is deliberately a cheap radius no
    // browser would refuse. Matching it would make this test fail on the very
    // line that guards the material.
    const declarations = css
      .split("\n")
      .filter((l) => !l.includes("@supports"))
      .join("\n");
    const radii = [...declarations.matchAll(/backdrop-filter:\s*blur\((\d+)px\)/g)].map((m) => m[1]);
    expect([...new Set(radii)]).toEqual(["20"]);
  });

  /**
   * A RATCHET, not an exemption list — the same shape `TAILWIND_DEBT` uses in
   * ui-centralization.
   *
   * These files still blur by hand, at 4px, 8px and 12px, which is the drift
   * the material exists to end: a surface that decides for itself how much to
   * blur is a surface that will disagree with the next one. They are not fixed
   * here because each needs its own look at whether it is floating chrome at
   * all (the markdown renderer's is a code-block scrim, the preview's is over
   * an iframe), and guessing would trade a visible defect for an invisible one.
   *
   * The two assertions below let this set only SHRINK: a NEW hand-rolled blur
   * is not listed, so it fails; and converting a listed file to `glass` makes
   * the ratchet fail until it is deleted from here. Green for good at [].
   */
  const BLUR_DEBT = [
    "components/command-palette/index.tsx",
    "components/dev-environment/index.tsx",
    "components/editor/preview/index.tsx",
    "components/markdown-renderer/index.tsx",
    "components/template-gallery.tsx",
    "components/templates/template-detail.tsx",
    "app/login/page.tsx",
  ];

  it("no NEW component hand-rolls a backdrop blur — the material owns it", () => {
    const offenders = offendersOf(/backdropFilter=/);
    expect(offenders.filter((f) => !BLUR_DEBT.includes(f))).toEqual([]);
  });

  it("the blur debt only shrinks", () => {
    const offenders = offendersOf(/backdropFilter=/);
    expect(BLUR_DEBT.filter((f) => !offenders.includes(f))).toEqual([]);
  });
});

describe("Depth is a ladder, and it has three rungs", () => {
  it("exactly three elevation levels exist", () => {
    const levels = [...css.matchAll(/\.hz-elevation-(\d)\s*\{/g)].map((m) => m[1]);
    expect(levels).toEqual(["1", "2", "3"]);
  });

  it("every rung pairs a cast shadow with the specular lip", () => {
    // The lip is the half that reads on #080808 — black-on-near-black moves no
    // pixels, so a rung with only a shadow is a rung that does nothing.
    for (const level of ["1", "2", "3"]) {
      const rule = css.slice(css.indexOf(`.hz-elevation-${level} {`));
      const body = rule.slice(0, rule.indexOf("}"));
      expect(body).toContain("inset 0 1px 0 0 var(--hz-sheen)");
      expect(body).toMatch(/rgba\(0, 0, 0, 0\.\d+\)/);
    }
  });

  it("the sheen sits ABOVE the hairline, or it disappears into it", () => {
    // --border rings the whole box; an equal-value lip is invisible against it.
    const sheen = css.match(/--hz-sheen:\s*rgba\(255, 255, 255, ([\d.]+)\)/);
    expect(sheen).not.toBeNull();
    expect(Number(sheen![1])).toBeGreaterThan(0.06);
  });

  it("glass offers no level 1 — a floating thing is never at rest", () => {
    expect(chrome).toMatch(/export const glass = \(level: 2 \| 3/);
  });

  it("a surface never carries both the ladder and Tamagui's own elevation", () => {
    // `elevation={n}` compiles to a competing shadow, and the loser is
    // whichever the cascade happens to order last. Six floating surfaces used
    // to set it at 6 while the ladder said otherwise.
    //
    // Scoped to the SAME opening tag, not the same file: a file may legitimately
    // hold a glass menu and, elsewhere, a raised thumbnail that has not moved to
    // the ladder yet. Only one element wearing both is a contradiction.
    const offenders = files.filter((f) =>
      // `[^>]` already spans newlines, so no dotAll flag is needed (and the
      // `s` flag would demand an es2018 target this tsconfig does not set).
      [...readFileSync(f, "utf8").matchAll(/<[A-Za-z][^>]*?>/g)].some(
        (t) => /\{\.\.\.glass\(/.test(t[0]) && /\belevation=\{\d/.test(t[0]),
      ),
    );
    expect(offenders.map(rel)).toEqual([]);
  });

  it("`rows` derives its level from `panel` instead of restating it", () => {
    // Restated, moving the panel up or down the ladder leaves its groups pinned
    // to a level they no longer share.
    expect(chrome).toContain("`${panel.className} hz-rows`");
  });
});

describe("A scrim dims the page — it does not delete it", () => {
  it("the dim is declared once, in CSS, and read from both languages", () => {
    expect(css).toMatch(/--hz-scrim:\s*rgba\(0, 0, 0, 0\.55\)/);
    expect(css).toContain("background-color: var(--hz-scrim)");
    expect(chrome).toContain("backgroundColor: 'var(--hz-scrim)'");
  });

  it("nothing hardcodes the scrim value — there is one copy and it is not here", () => {
    expect(offendersOf(/backgroundColor="rgba\(0, ?0, ?0, ?0\.55\)"/)).toEqual([]);
  });

  it("no full-bleed overlay is opaque black", () => {
    // Three modals did this. It does not dim what is behind them, it deletes
    // it — and a translucent panel over a solid wall has nothing left to be
    // translucent about, so the glass was cancelled by the very thing whose job
    // is to make it read.
    const offenders = files.filter((f) => {
      const src = readFileSync(f, "utf8");
      return /position="fixed"[^>]*backgroundColor="black"/.test(src);
    });
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe("Glass is for chrome; the flow gets a panel", () => {
  /*
   * There is no "in-flow surfaces are never frosted" test here, and the reason
   * is worth writing down: it cannot be decided from the source. Whether a
   * thing floats is a fact about the RUNTIME — a `DropdownMenuContent` floats
   * because gui portals it, with no `position` prop anywhere in the file. The
   * heuristic that looked for one flagged the user menu, the model selector and
   * the dev toolbar, all three of which are correct, which would have taught
   * the next reader to distrust the file. The law is real; this is the wrong
   * instrument for it, and a test that cries wolf is worse than no test.
   */

  it("the settings row rhythm is stated once, in `row`", () => {
    expect(chrome).toMatch(/export const row = \{[\s\S]*?paddingHorizontal: '\$4'/);
    expect(chrome).toMatch(/export const row = \{[\s\S]*?justifyContent: 'space-between'/);
  });

  it("a grouped card clips its separators", () => {
    // Without the clip the topmost separator runs through the rounded corner.
    expect(chrome).toMatch(/export const rows = \{[\s\S]*?overflow: 'hidden'/);
  });

  it("separators use the card's OWN hairline token, not the sheet's", () => {
    // --border and --borderColor are two different greys (rgb(38,38,38) vs
    // rgb(36,36,36)); the card's edge is drawn with the second, so the first
    // put two hairlines two units apart inside one card.
    expect(css).toMatch(/\.hz-rows > \* \+ \* \{\s*border-top: 1px solid var\(--borderColor/);
  });
});
