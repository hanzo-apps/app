/**
 * The edit widget draws from the page's tokens, not from its own literals.
 *
 * `public/edit.js` renders into a shadow root under `div[data-hanzo-edit]`, and
 * it used to carry a private palette: a system font stack, `#0e0e0e` panels,
 * `#171717` fields, `#8ab4ff` links — a blue that belongs to no Hanzo palette.
 * Nothing kept that in step with the design system, so it drifted every time the
 * system moved, and matching it by hand only reset the clock.
 *
 * A shadow root does NOT need `adoptedStyleSheets` for this. Custom properties
 * are inherited, and `all` does not reset them, so `:host{all:initial}` isolates
 * the tree from the page's RULES while `--brand-accent`, `--card`,
 * `--font-geist-sans` and the rest still arrive. Measured inside the live shadow
 * root on hanzo.app: `--brand-accent` → `#8b5cf6`, `--font-geist-sans` →
 * `"Geist"`. So the binding is one `:host` block of `var(token, literal)`.
 *
 * What is pinned here is that rule: every literal lives in exactly one place —
 * as a fallback in the `:host` declarations — and the rules below reference
 * tokens. The allowlist is the deliberate exceptions, each of which is a
 * SEMANTIC colour rather than chrome.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "..", "..", "public", "edit.js"), "utf8");

/** The stylesheet, minus the `//` commentary that documents it. */
function stylesheet(): { tokens: string; rules: string } {
  const from = src.indexOf("var TOKENS =");
  const to = src.indexOf("var style = document.createElement('style')");
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  const code = src
    .slice(from, to)
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("//"))
    .join("\n");
  const split = code.indexOf("var css =");
  expect(split).toBeGreaterThan(-1);
  return { tokens: code.slice(0, split), rules: code.slice(split) };
}

// Colour carries MEANING in these three places, so it is stated outright rather
// than themed: a diff's added/removed lines, a warning, and the primary button —
// which the v2 rule keeps white/black, never the accent.
const SEMANTIC = new Set([
  "#7ee787", // diff: added
  "#ff9d9d", // diff: removed, and the error message
  "#e3b341", // warning
  "#fff", // primary button face
  "#000", // primary button label
  "#e8e8e8", // primary button hover
]);

describe("the edit widget's palette is the page's palette", () => {
  let tokens = "";
  let rules = "";
  beforeAll(() => {
    ({ tokens, rules } = stylesheet());
  });

  it("declares every literal once, as a token fallback", () => {
    expect(tokens).toContain(":host{all:initial;");
    for (const name of [
      "--hz-font",
      "--hz-mono",
      "--hz-accent",
      "--hz-panel",
      "--hz-field",
      "--hz-text",
      "--hz-dim",
      "--hz-line",
    ]) {
      // declared once, and reading a page token with a literal fallback
      expect(tokens).toMatch(new RegExp(`${name}:var\\(--[a-z-]+`));
      expect(rules).toContain(`var(${name})`);
    }
  });

  it("states no colour of its own outside the semantic three", () => {
    const literals = (rules.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).filter(
      (h) => !SEMANTIC.has(h.toLowerCase()),
    );
    expect(literals).toEqual([]);
  });

  it("names no font family of its own", () => {
    const families = (rules.match(/font-family:([^;'}]+)/g) ?? []).map((f) =>
      f.slice("font-family:".length).trim(),
    );
    expect(families.length).toBeGreaterThan(0);
    expect(families.filter((f) => !/^var\(--hz-(font|mono)\)$/.test(f))).toEqual([]);
  });

  it("highlights the element being edited with the accent, not a hard box", () => {
    const fn = src.slice(src.indexOf("function highlight(el)"));
    const body = fn.slice(0, fn.indexOf("\n  }"));
    // The page element is outside the shadow root, so it reads the page token
    // directly — the --hz-* aliases live on :host and do not reach it.
    expect(body).toContain("var(--brand-accent,");
    expect(body).toContain("outlineOffset");
    expect(body).toMatch(/outline\s*=\s*'1px solid/);
    expect(body).not.toContain("#8ab4ff");
  });
});
