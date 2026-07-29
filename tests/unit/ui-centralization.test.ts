import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ONE home.
 *
 * Every component this app renders — in-flow (button, input, badge, dialog,
 * toast) and floating alike (menu, select, popover, tooltip) — comes from
 * `@hanzo/ui`, which renders on `@hanzo/gui`. There is no second door.
 *
 * The app used to keep its own Radix surface in `components/overlay` because
 * the old @hanzo/ui painted itself with utility class NAMES that Tailwind never
 * emitted for `node_modules` — a menu then computed `z-index: auto` and painted
 * under the page. That defect belonged to the utility-class substrate, and the
 * substrate is gone: gui ships its own style rules, so surface and elevation
 * arrive with the component. This scan keeps the second door from reopening.
 */

const ROOTS = ["components", "app", "lib", "hooks"];
const EXT = /\.(tsx?|jsx?)$/;

// The shadcn primitives that were centralized — never re-create these locally.
const PRIMITIVES = [
  "button", "badge", "input", "label", "dialog", "select", "switch", "tabs",
  "textarea", "tooltip", "checkbox", "collapsible", "context-menu",
  "dropdown-menu", "resizable", "toggle-group", "popover", "sonner", "toast",
];

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
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.test(name)) out.push(full);
  }
  return out;
}

const repoRoot = join(__dirname, "..", "..");
const files = ROOTS.flatMap((r) => walk(join(repoRoot, r)));
const rel = (f: string) => f.replace(repoRoot + "/", "");
const offendersOf = (re: RegExp) =>
  files.filter((f) => re.test(readFileSync(f, "utf8"))).map(rel);

describe("UI centralization — every component comes from @hanzo/ui", () => {
  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("no local shadcn-primitive imports (@/components/ui/<primitive>)", () => {
    expect(
      offendersOf(new RegExp(`from\\s+['"]@/components/ui/(${PRIMITIVES.join("|")})['"]`)),
    ).toEqual([]);
  });

  it("no direct sonner imports — toast/Toaster come from @hanzo/ui", () => {
    expect(offendersOf(/from\s+['"]sonner['"]/)).toEqual([]);
  });

  it("no Radix anywhere — @hanzo/ui renders on @hanzo/gui", () => {
    expect(offendersOf(/from\s+['"]@radix-ui\//)).toEqual([]);
  });

  it("no app-local overlay or control barrel — that second door is closed", () => {
    expect(offendersOf(/from\s+['"]@\/components\/(overlay|control)['"]/)).toEqual([]);
  });

  it("no Tailwind utility classes — gui carries its own style props", () => {
    expect(offendersOf(/className=/)).toEqual([]);
  });

  it("exactly ONE TooltipProvider, at the app root", () => {
    expect(offendersOf(/<TooltipProvider\b/)).toEqual(["app/providers.tsx"]);
  });
});
