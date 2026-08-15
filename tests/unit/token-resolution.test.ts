import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

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
 * Scope is `app/`, `components/` and `hooks/` — the surface. `lib/template-previews`
 * is deliberately out: it is SOURCE for the apps this app generates, and it
 * carries its own stylesheet.
 *
 * The GENERATED side gets its own sweep at the bottom of this file, against its
 * own sheet. It used to be excluded for the same reason — "they carry their own
 * stylesheets" — which was true while that stylesheet was Tailwind. It is now
 * @hanzo/design, the same token layer, and the exclusion was exactly the gap a
 * `var(--space-7)` walked through: the ramp has no 7, so a starter template's
 * only vertical gap silently computed to zero. Nothing but a screenshot caught it.
 */

const ROOT = process.cwd();
const SURFACE = ["app", "components", "hooks"];

/**
 * Names no stylesheet declares because something else supplies them at runtime.
 * Each prefix is a real provider, not an amnesty — anything not on this list has
 * to be declared for real.
 */
const PROVIDED = [
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

/** Where `@hanzo/ui/theme.css` actually lives, via the package's exports map. */
const themeSheet = (): string => {
  const require_ = createRequire(join(ROOT, "package.json"));
  const pkg = require_.resolve("@hanzo/ui/package.json");
  const exp = (JSON.parse(readFileSync(pkg, "utf8")).exports ?? {})["./theme.css"];
  const rel = typeof exp === "string" ? exp : (exp?.default ?? exp?.style);
  if (!rel) throw new Error("@hanzo/ui no longer exports ./theme.css");
  return join(dirname(pkg), rel);
};

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/** Every custom property DECLARED in a stylesheet the browser loads. */
const declared = (): Set<string> => {
  const sheets = [
    readFileSync(join(ROOT, "assets/globals.css"), "utf8"),
    // `@hanzo/brand/styles/variables.css` used to be read here because
    // app/layout.tsx loaded it as a "baseline layer". It does not any more —
    // 136 names with no knob under them and a --shadow-* ramp tuned for a white
    // canvas, ahead of the sheet that owns those names. This list is "the
    // sheets the browser loads", so a sheet the browser stopped loading cannot
    // be allowed to keep answering for a token: that is how a name goes on
    // resolving in the suite and resolves to nothing in the product.
    // app/gui.css is loaded too (`import "./gui.css"` in app/layout.tsx) and is
    // BOTH a declarer and a referencer: the generated @hanzo/gui sheet declares
    // its own `--t###` / `--colorN` scale and then reads it back. Omitting it
    // here while `referenced()` walks it made the suite report ~740 of gui.css's
    // own tokens as undeclared — a self-inflicted red that hid real ones.
    readFileSync(join(ROOT, "app/gui.css"), "utf8"),
    // THE TOKEN LAYER. `app/layout.tsx` imports `@hanzo/ui/theme.css`, which
    // carries @hanzo/design's whole sheet — the colour ramp, the radius ramp,
    // the `--text-*`/`--space-*` scales and, since design 0.4.12, the
    // `--type-scale`/`--density` knobs those scales multiply by.
    //
    // It was missing here, and that stayed invisible until gui.css began
    // REFERENCING the ramp: @hanzo/ui 8.0.69 resolves its `$n` type ladder
    // through `var(--text-*)` so a person's text-size preference reaches the
    // ~1600 `fontSize="$n"` call sites, and this sweep promptly reported
    // thirteen design tokens as undeclared. They ARE declared — in the one
    // sheet the sweep did not read.
    //
    // Resolved through the package's exports, not a literal path: pnpm nests
    // the real file under .pnpm/<pkg>@<version+hash>/.
    readFileSync(themeSheet(), "utf8"),
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

  /**
   * THE GENERATED SIDE. A page this product builds links one stylesheet —
   * `@hanzo/design`, served from `/vendor/design/styles.css` — and everything
   * these files write is resolved against it and nothing else. Its failure mode
   * is worse than the surface's, because the person who sees it is a customer's
   * visitor looking at a customer's site, and there is no console anyone reads.
   */
  it("declares every token the pipeline puts in a generated page", () => {
    // By path, like @hanzo/brand above. `require.resolve` cannot reach it from
    // here twice over: the package's "." export is ESM-only, and asking for the
    // .css directly lands on jest's style MOCK (moduleNameMapper sends every
    // stylesheet there), so the sweep would run against an empty string and
    // pass against nothing. The `toBeGreaterThan` below is what would say so.
    const sheet = readFileSync(
      join(ROOT, "node_modules/@hanzo/design/styles.css"),
      "utf8",
    );
    const tokens = new Set(
      [...stripComments(sheet).matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map((m) => m[1]),
    );
    expect(tokens.size).toBeGreaterThan(100); // or everything below is vacuous

    const PIPELINE = [
      "lib/prompts.ts",
      "lib/vfs/skills/built-in/one-shot.ts",
      "lib/vfs/skills/built-in/planning.ts",
      "lib/vfs/templates/vibe-check.ts",
    ];
    const missing: string[] = [];
    for (const file of PIPELINE) {
      const src = stripComments(readFileSync(join(ROOT, file), "utf8"));
      for (const m of src.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
        if (!tokens.has(m[1])) missing.push(`${m[1]}  ←  ${file}`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
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
