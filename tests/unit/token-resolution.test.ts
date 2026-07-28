import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every token this surface names must resolve.
 *
 * An undefined custom property is the quietest failure CSS has. `var(--x)` with
 * no definition and no fallback makes the whole declaration invalid at
 * computed-value time, so the property drops to its initial value — and it takes
 * the rest of that declaration with it. `background: linear-gradient(var(--tint),
 * var(--tint)), var(--card)` does not fall back to `var(--card)`; it paints
 * nothing at all. No console warning, no build error, no failing type-check: the
 * reference is a string assembled at runtime, so the compiler never sees it.
 *
 * Eleven names failed exactly this way here — `--project-card-tint`,
 * `--project-background-tint`, five `--button-*-active`, four `--panel-*-rgb` —
 * from the initial commit until measured in a browser against live hanzo.app.
 * Reviewing the diff could not have caught them and neither could `tsc`. This
 * sweep is the thing that can: it reads every `var(--…)` the surface writes and
 * asserts each name is declared somewhere the browser will actually see.
 *
 * Scope is `app/`, `components/` and `hooks/` — the surface. `lib/vfs/templates`
 * and `lib/template-previews` are deliberately out: those are SOURCE for the apps
 * this app generates, and they carry their own stylesheets.
 */

const ROOT = process.cwd();
const SURFACE = ["app", "components", "hooks"];

/**
 * Names no stylesheet declares because something else supplies them at runtime.
 * Each prefix is a real provider, not an amnesty — anything not on this list has
 * to be declared for real.
 */
const PROVIDED = [
  /^--radix-/, // Radix positions its poppers by writing these on the element
  /^--tw-/, // Tailwind's own internal registers
  /^--font-geist-(sans|mono)$/, // next/font, via `variable:` in app/layout.tsx
  /^--f-/, // Tamagui font registers, injected by its runtime CSS
];

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
};

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/** Every custom property DECLARED in a stylesheet the browser loads. */
const declared = (): Set<string> => {
  const sheets = [
    readFileSync(join(ROOT, "assets/globals.css"), "utf8"),
    readFileSync(
      join(ROOT, "node_modules/@hanzo/brand/styles/variables.css"),
      "utf8",
    ),
  ];
  const set = new Set<string>();
  for (const sheet of sheets) {
    for (const m of stripComments(sheet).matchAll(
      /(--[a-zA-Z0-9_-]+)\s*:/g,
    )) {
      set.add(m[1]);
    }
  }
  return set;
};

/** Every custom property REFERENCED, with the file that references it. */
const referenced = (): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const dir of SURFACE) {
    for (const file of walk(join(ROOT, dir))) {
      const src = stripComments(readFileSync(file, "utf8"));
      for (const m of src.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
        const at = map.get(m[1]) ?? [];
        if (!at.includes(file)) at.push(file);
        map.set(m[1], at);
      }
    }
  }
  return map;
};

describe("token resolution", () => {
  const defs = declared();
  const refs = referenced();

  it("declares every token the surface references", () => {
    const missing = [...refs]
      .filter(([name]) => !defs.has(name))
      .filter(([name]) => !PROVIDED.some((p) => p.test(name)))
      .map(([name, files]) => `${name}  ←  ${files
        .map((f) => f.slice(ROOT.length + 1))
        .join(", ")}`);
    expect(missing).toEqual([]);
  });

  it("keeps the eleven dead names collapsed — they were two values", () => {
    const surface = [...refs.keys()];
    // Four panel triples that were one neutral, two project tints that were the
    // same neutral, and five --button-*-active that were one accent. Naming a
    // value five times is how one question gets three answers; these are gone.
    for (const dead of [
      "--panel-editor-rgb",
      "--panel-files-rgb",
      "--panel-preview-rgb",
      "--panel-checkpoint-rgb",
      "--project-card-tint",
      "--project-background-tint",
      "--button-editor-active",
      "--button-files-active",
      "--button-preview-active",
      "--button-assistant-active",
      "--button-checkpoint-active",
    ]) {
      expect(surface).not.toContain(dead);
      expect(defs.has(dead)).toBe(false);
    }
  });

  it("inverts --tint with the ground so a lift reads in both themes", () => {
    const css = stripComments(
      readFileSync(join(ROOT, "assets/globals.css"), "utf8"),
    );
    const decls = [...css.matchAll(/--tint:\s*([^;]+);/g)].map((m) =>
      m[1].trim(),
    );
    expect(decls).toEqual(["0 0 0", "255 255 255"]);
  });

  it("routes the accent through @hanzo/brand, never a literal", () => {
    const css = stripComments(
      readFileSync(join(ROOT, "assets/globals.css"), "utf8"),
    );
    // --brand-accent reads the host brand's accent and only falls back to a
    // literal, so switching host switches every accent consumer with no
    // component change. Nothing paints an accent any other way.
    expect(css).toMatch(/--brand-accent:\s*var\(--hanzo-accent,/);
    // The crosshair carried an indigo literal — not even the app's purple, so it
    // could not follow the host. Both of its states go through the accent now.
    //
    // The same indigo still sits in the element-selector overlay further down
    // this file. That one is injected as a script INTO THE PREVIEW IFRAME, a
    // foreign document where none of these tokens exist, so it cannot read one:
    // fixing it means the host resolving the accent and passing it across the
    // boundary. Left deliberately, and not asserted here — a test that pretends
    // to cover it would be worse than one that says where the edge is.
    const preview = readFileSync(
      join(ROOT, "components/preview/multipage-preview.tsx"),
      "utf8",
    );
    const crosshair = preview.slice(
      preview.indexOf("const crosshairButtonStyle"),
      preview.indexOf("const iframeRef"),
    );
    expect(crosshair).not.toMatch(/rgba?\(\s*99\s*,\s*102\s*,\s*241/);
    expect(crosshair).toMatch(/var\(--brand-accent\)/);
    expect(crosshair).toMatch(/var\(--brand-accent-soft\)/);
  });
});
