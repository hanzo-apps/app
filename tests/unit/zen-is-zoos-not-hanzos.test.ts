/**
 * Zen is Zoo Labs Foundation's, and the landing page has to say so.
 *
 * Zoo Labs Foundation is a 501(c)(3) frontier lab at zoo.industries. It makes
 * the Zen family; Hanzo routes it. Those are two different organisations, and
 * the "Routed providers" row is the one place on the marketing page where a
 * maker is named next to its mark.
 *
 * It shipped wrong. `public/logos/providers/zen.svg` was a byte-for-byte copy
 * of Hanzo's own `public/logo.svg` — same viewBox "0 0 67 67", same first path
 * "M22.21 67V44.6369H0V67H22.21Z" — recoloured white. So the row credited
 * Zoo's work to Hanzo, in Hanzo's logo, on Hanzo's front page, and the comment
 * above the list asserted it in words too ("the only one that is ours").
 *
 * That failure mode is a COPY, not a filename, so the filename is not what is
 * pinned here. What is pinned is the Hanzo mark's own path data: whatever asset
 * the Zen row points at, it may not be Hanzo's mark under any name. Re-copying
 * logo.svg to zoo.svg would pass a filename check and fail this one.
 *
 * `mono` is checked because it is not cosmetic: `.hz-mark-mono` is
 * `filter: brightness(0) invert(1)`, which flattens every fill to solid white.
 * Zoo's mark is an additive RGB venn — seven fills and a white core. Marking it
 * mono would erase the brand into a blank disc while leaving the file correct,
 * which is the kind of wrong that survives a screenshot.
 */

import { join } from "node:path";

import { read, root } from "../source";



/** The first path of Hanzo's mark. Present in public/logo.svg, and nowhere Zen. */
const HANZO_MARK = "M22.21 67V44.6369H0V67H22.21Z";

describe("Zen is credited to Zoo Labs Foundation", () => {
  const strip = read("components/landing/models-strip.tsx");

  /** The Zen entry, as written in the providers list. */
  const zen = strip.split("\n").find((l) => l.includes('name: "Zen"')) ?? "";

  it("the row still exists to be checked", () => {
    expect(zen).not.toBe("");
  });

  it("points at a Zoo asset", () => {
    expect(zen).toMatch(/src: "\/logos\/providers\/zoo\.svg"/);
  });

  it("does not carry Hanzo's mark under any filename", () => {
    const src = zen.match(/src: "([^"]+)"/)?.[1] ?? "";
    expect(src).not.toBe("");
    expect(read(join("public", src))).not.toContain(HANZO_MARK);
  });

  it("keeps Zoo's colour — mono would flatten the venn to a white disc", () => {
    expect(zen).not.toMatch(/mono:\s*true/);
    // And the asset really is the multi-colour venn, not a single-fill glyph.
    const venn = read("public/logos/providers/zoo.svg");
    for (const fill of ["#00A652", "#ED1C24", "#2E3192", "#FCF006", "#01ACF1", "#EA018E"]) {
      expect(venn).toContain(fill);
    }
  });

  it("links to zoo.industries", () => {
    expect(zen).toContain('href: "https://zoo.industries"');
    expect(zen).toContain('by: "Zoo Labs Foundation"');
  });

  it("names Zoo in the copy, and never calls Zen Hanzo's own", () => {
    expect(strip).toContain("Zoo Labs Foundation");
    expect(strip).toMatch(/href="https:\/\/zoo\.industries"/);
    expect(strip).not.toMatch(/Hanzo&apos;s own Zen/);
    expect(strip).not.toMatch(/the only one that is ours/);
  });

  it("the retired Hanzo-mark copy is gone, not merely unreferenced", () => {
    expect(() => read("public/logos/providers/zen.svg")).toThrow();
    expect(strip).not.toContain("providers/zen.svg");
  });

  it("proves the guard works — Hanzo's own logo does contain the mark", () => {
    expect(read("public/logo.svg")).toContain(HANZO_MARK);
  });
});

describe("the models section names the right maker", () => {
  const section = read("components/landing/hanzo-models.tsx");

  it("does not claim Hanzo builds Zen", () => {
    expect(section).not.toMatch(/Two models we build in-house/);
    expect(section).not.toMatch(/Hanzo's own models/);
  });

  it("credits Zoo Labs Foundation and links to it", () => {
    expect(section).toContain("Zoo Labs Foundation");
    expect(section).toMatch(/href="https:\/\/zoo\.industries"/);
  });

  it("still says Enso is ours — the fix corrects Zen, it does not disown Enso", () => {
    expect(section).toMatch(/Enso, the flagship we build/);
  });
});

describe("the model picker draws Zen with Zoo's mark", () => {
  const icon = read("components/model-icon.tsx");

  it("routes the zen family to the zoo mark, the way gpt routes to openai", () => {
    expect(icon).toMatch(/zen:\s*'zoo'/);
    expect(icon).toMatch(/^\s*zoo:$/m);
  });

  it("no longer draws Hanzo's house glyph on Zen", () => {
    // ZEN_MARK is @hanzo/logo's open brush ring — a HOUSE mark, next to Enso.
    // Checked as import and as assignment, not as a word: the comment above the
    // table names it deliberately, to say what this replaced.
    expect(icon).not.toMatch(/import[^;]*\bZEN_MARK\b/);
    expect(icon).not.toMatch(/\bzen:\s*ZEN_MARK/);
    // Enso is genuinely ours and stays.
    expect(icon).toMatch(/import[^;]*\bENSO_MARK\b/);
    expect(icon).toMatch(/\benso:\s*ENSO_MARK/);
  });

  it("the zoo mark is a venn that fits the table's 24-unit box", () => {
    const body = icon.match(/\n\s*zoo:\n\s*'([^']+)'/)?.[1] ?? "";
    expect(body).not.toBe("");
    // Three primaries, the ring that holds them, and the disc that cuts them.
    expect((body.match(/<circle /g) ?? []).length).toBe(5);
    // Inherits the picker's text colour like every other mark in the table.
    expect(body).toContain('stroke="currentColor"');
    // The cut must be an SVG clipPath in USER units. A CSS `circle(11.5px …)`
    // resolves against the rendered box instead, so at an 18px icon it cuts
    // nothing and the venn squares off into a scribble — this pins the fix.
    expect(body).toContain('<clipPath id="zoo-cut">');
    expect(body).toContain('clip-path="url(#zoo-cut)"');
    expect(body).not.toMatch(/clip-path:\s*circle\([\d.]+px/);
    // Every coordinate lands inside the 24-unit box the parent svg declares.
    for (const n of body.match(/c[xy]="([\d.]+)"/g) ?? []) {
      expect(Number(n.replace(/\D*([\d.]+)"/, "$1"))).toBeLessThanOrEqual(24);
    }
  });
});
