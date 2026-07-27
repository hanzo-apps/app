/**
 * The `react-resizable-panels` shim — a guard, not a feature.
 *
 * Why the shim exists: `@hanzo/ui`'s `resizable` module imports the v2 names
 * `{ Panel, PanelGroup, PanelResizeHandle }`, and the installed package (v4)
 * exports `{ Panel, Group, Separator }`. Nothing in the app imports the package
 * directly, but the `@hanzo/ui` barrel pulls that module in — so the bare
 * specifier must resolve to something that carries BOTH sets of names.
 *
 * Why this guard exists: the shim once re-exported from the bare specifier
 * `react-resizable-panels`, which the webpack alias caught again and pointed
 * back at the shim. It re-exported ITSELF — infinite recursion in `next dev`
 * (RangeError on every route), and silently `undefined` bindings in the
 * production build. A resize primitive that is `undefined` renders nothing.
 *
 * The two invariants that keep that from coming back:
 *   1. the shim must NOT re-export from the bare specifier, and
 *   2. the alias must be exact-match (`…$`), so only the bare specifier is
 *      caught and the shim's own subpath import reaches the real package.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const SHIM = "lib/shims/react-resizable-panels.js";
const PKG = "react-resizable-panels";

describe("the shim cannot re-export itself", () => {
  const shim = read(SHIM);

  it("never re-exports from the bare specifier", () => {
    const specifiers = [...shim.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers).not.toContain(PKG);
  });

  it("reaches the real package through a subpath the alias cannot catch", () => {
    const specifiers = [...shim.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const s of specifiers) {
      if (!s.startsWith(PKG)) continue;
      expect(s.startsWith(`${PKG}/`)).toBe(true);
    }
  });
});

describe("the alias is exact-match only", () => {
  const config = read("next.config.js");

  it("aliases the bare specifier and nothing beneath it", () => {
    const keys = [...config.matchAll(/['"](react-resizable-panels[^'"]*)['"]\s*:/g)].map(
      (m) => m[1],
    );
    expect(keys).toEqual([`${PKG}$`]);
  });
});

describe("the names the shim promises actually exist", () => {
  it("maps the v2 names onto the v4 exports the package really ships", () => {
    const dist = read(`node_modules/${PKG}/dist/${PKG}.d.ts`);
    // v4 ships these …
    for (const name of ["Group", "Panel", "Separator"]) {
      expect(dist).toMatch(new RegExp(`export declare function ${name}\\b`));
    }
    // … and the shim is what turns them into the v2 names @hanzo/ui asks for.
    const shim = read(SHIM);
    for (const name of ["Panel", "PanelGroup", "PanelResizeHandle", "Group", "Separator"]) {
      expect(shim).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it("is still load-bearing: @hanzo/ui imports the v2 names v4 does not export", () => {
    const consumer = read(`node_modules/@hanzo/ui/dist/resizable.mjs`);
    expect(consumer).toContain("PanelGroup");
    expect(consumer).toContain("PanelResizeHandle");
    const dist = read(`node_modules/${PKG}/dist/${PKG}.d.ts`);
    expect(dist).not.toMatch(/export declare function PanelGroup\b/);
  });
});
