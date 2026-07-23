import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ONE way to get a common component: `@hanzo/ui`.
 *
 * Buttons, inputs, badges, dialogs, toasts, etc. are the shared design system —
 * re-inventing them per-app forks the look and the fixes (the Button asChild
 * crash was fixed ONCE, in @hanzo/ui-shadcn 5.7.5). This scan fails if anyone
 * re-introduces a local shadcn primitive import or a direct `sonner` import
 * (toast/Toaster come from @hanzo/ui). App-specific composites (logo,
 * app-header, save-button, …) stay local — they are ours, not primitives.
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

describe("UI centralization — common components come from @hanzo/ui", () => {
  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("no local shadcn-primitive imports (@/components/ui/<primitive>)", () => {
    const re = new RegExp(
      `from\\s+['"]@/components/ui/(${PRIMITIVES.join("|")})['"]`,
    );
    const offenders = files.filter((f) => re.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no direct sonner imports — toast/Toaster come from @hanzo/ui", () => {
    const offenders = files.filter((f) =>
      /from\s+['"]sonner['"]/.test(readFileSync(f, "utf8")),
    );
    expect(offenders.map(rel)).toEqual([]);
  });
});
