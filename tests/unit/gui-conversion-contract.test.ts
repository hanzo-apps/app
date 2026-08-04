/**
 * The four ways the Tailwind->gui rewrite silently lost information.
 *
 * Commit da5a9e1a mechanically turned every Tailwind class into a gui style
 * prop. It compiled, it shipped, and it was wrong in ways nothing could catch:
 * a green build is what LET these through, because every one of them is
 * VALID — valid syntax, valid prop, valid type. Only the value is a lie.
 *
 *   1. `hidden md:flex` -> `display="none"`. The second half was dropped, so 45
 *      elements were invisible at EVERY width — a nav, a footer, the whole
 *      desktop workspace column.
 *   2. Alignment on a text primitive. gui's `.is_Text` is `display:inline`, so
 *      `alignItems`/`gap`/`justifyContent` are inert there no matter which HTML
 *      tag renders. 76 elements were holding alignment that did nothing.
 *   3. `leading-[1.05]` -> `lineHeight={1.05}`. A bare number in gui is PIXELS,
 *      so a 1.05x multiplier became a 1.05px line box.
 *   4. `-translate-x-1/2` -> `x="-50%"`. gui's transform props take numbers;
 *      the `%` is stripped and 50% of the element becomes 50 pixels.
 *
 * These are checked in SOURCE rather than in a browser on purpose: every one is
 * a property of the text, they are cheap to assert, and a rendered check can
 * only see the handful of surfaces a test happens to visit. The rendered
 * counterparts live in tests/e2e/ui-contract.spec.ts.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

/** Every checked-in .tsx under the app's own source (never node_modules). */
const files = execFileSync("git", ["ls-files", "app", "components", "templates"], {
  cwd: ROOT, encoding: "utf8",
})
  .split("\n")
  .filter((f) => f.endsWith(".tsx"));

type Tag = { file: string; line: number; name: string; text: string };

/**
 * Opening JSX tags, with their full text even when it spans lines. A regex over
 * single lines cannot see these props: most of the offending tags in this app
 * wrap, and the alignment sits three lines below the component name.
 */
const openingTags = (src: string, file: string): Tag[] => {
  const out: Tag[] = [];
  const re = /<([A-Z][A-Za-z0-9]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let brace = 0;
    let str = "";
    for (; i < src.length; i++) {
      const c = src[i];
      if (str) { if (c === str && src[i - 1] !== "\\") str = ""; continue; }
      if (c === '"' || c === "'" || c === "`") { str = c; continue; }
      if (c === "{") brace++;
      else if (c === "}") brace--;
      else if (c === ">" && brace === 0) break;
    }
    out.push({
      file,
      line: src.slice(0, m.index).split("\n").length,
      name: m[1],
      text: src.slice(m.index, i + 1),
    });
  }
  return out;
};

const allTags: Tag[] = files.flatMap((f) =>
  openingTags(readFileSync(join(ROOT, f), "utf8"), f),
);

const at = (t: Tag) => `${t.file}:${t.line} <${t.name}>`;

describe("1. nothing is hidden at every width", () => {
  // A file input, an a11y-only dialog title, and one nav that was already dead
  // before the conversion are hidden ON PURPOSE and always were.
  const ALWAYS_HIDDEN = /^(Input|DialogTitle)$/;

  it("every display=none is undone by a breakpoint", () => {
    const stuck = allTags
      .filter((t) => /\bdisplay="none"/.test(t.text))
      .filter((t) => !ALWAYS_HIDDEN.test(t.name))
      // gui breakpoints are MIN-WIDTH, so a larger one restores a smaller one.
      .filter((t) => !/\$(sm|md|lg|xl)=\{\{[^}]*display:/.test(t.text))
      // A conditional display is a runtime decision, not a permanent hide.
      .filter((t) => !/\bdisplay=\{/.test(t.text))
      .map(at);

    // components/public/navigation is the one true always-hidden container:
    // its `hidden` had no breakpoint before the conversion either.
    expect(stuck.filter((s) => !s.includes("components/public/navigation"))).toEqual([]);
  });
});

describe("2. alignment only where it can apply", () => {
  // Everything descending from gui's Text carries `.is_Text { display:inline }`.
  // The rendered tag is irrelevant — a Paragraph renders <p> and is still inline.
  const TEXT = /^(SizableText|Paragraph|Anchor|Label|Heading|H[1-6]|CardTitle|CardDescription|DialogTitle|DialogDescription)$/;

  it("no text primitive carries flex alignment without a display", () => {
    const inert = allTags
      .filter((t) => TEXT.test(t.name))
      .filter((t) => /\s(alignItems|justifyContent|flexDirection)=/.test(t.text))
      .filter((t) => !/\bdisplay=/.test(t.text))
      .map(at);
    expect(inert).toEqual([]);
  });
});

describe("3. lineHeight is a length, not a ratio", () => {
  it("no bare sub-4 lineHeight (gui reads bare numbers as px)", () => {
    // `leading-[1.05]` means 1.05x. `lineHeight={1.05}` means 1.05 PIXELS —
    // a collapsed line box, and the build is perfectly happy.
    const bad = allTags
      .flatMap((t) => {
        const m = t.text.match(/\blineHeight=\{([0-9.]+)\}/);
        return m && parseFloat(m[1]) < 4 ? [`${at(t)} lineHeight={${m[1]}}`] : [];
      });
    expect(bad).toEqual([]);
  });
});

describe("4. transforms cannot take percentages", () => {
  it("no percentage in x/y/translate props (gui strips the % and keeps the number)", () => {
    // `x="-50%"` compiles to translateX(-50px). On a 900px element that is a
    // 400px error, and nothing warns.
    const bad = allTags
      .flatMap((t) => {
        const m = t.text.match(/\s(x|y|translateX|translateY)="(-?[0-9.]+%)"/);
        return m ? [`${at(t)} ${m[1]}="${m[2]}"`] : [];
      });
    expect(bad).toEqual([]);
  });
});
