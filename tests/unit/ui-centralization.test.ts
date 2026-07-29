import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * TWO homes, and only two.
 *
 * In-flow components — buttons, inputs, badges, dialogs, toasts — come from
 * `@hanzo/ui`: they are the shared design system, and re-inventing them per app
 * forks the look and the fixes (the Button asChild crash was fixed ONCE, in
 * @hanzo/ui 5.7.5).
 *
 * Anything that FLOATS — menu, select, popover, context menu, tooltip — comes
 * from `@/components/overlay`. Not taste: a floating panel needs a surface and an
 * elevation, and @hanzo/ui expresses both as utility class NAMES (`bg-bg-dark`,
 * `z-[2000000000]`) that Tailwind never emits because it does not scan
 * `node_modules`. The panel then computes `z-index: auto`, Radix copies that onto
 * the portaled wrapper, and the menu paints UNDER `<main class="relative z-10">`.
 * Surface and elevation therefore live in app source, where the compiler sees
 * them. This scan is what keeps them from drifting back.
 */

const ROOTS = ["components", "app", "lib", "hooks"];
const EXT = /\.(tsx?|jsx?)$/;

// The shadcn primitives that were centralized — never re-create these locally.
const PRIMITIVES = [
  "button", "badge", "input", "label", "dialog", "select", "switch", "tabs",
  "textarea", "tooltip", "checkbox", "collapsible", "context-menu",
  "dropdown-menu", "resizable", "toggle-group", "popover", "sonner", "toast",
];

// Everything that leaves the document flow — one home: @/components/overlay.
const FLOATING = [
  "DropdownMenu", "DropdownMenu\\w+",
  "Select", "Select\\w+",
  "Popover", "Popover\\w+",
  "ContextMenu", "ContextMenu\\w+",
  "Tooltip", "Tooltip\\w+",
];
const RADIX_FLOATING = ["dropdown-menu", "select", "popover", "context-menu", "tooltip"];

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

  it("no floating surface comes from @hanzo/ui", () => {
    const re = new RegExp(
      `import\\s*\\{[^}]*\\b(${FLOATING.join("|")})\\b[^}]*\\}\\s*from\\s*['"]@hanzo/ui['"]`,
      "s",
    );
    const offenders = files.filter((f) => re.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no floating surface is hand-rolled on Radix outside the primitive", () => {
    const re = new RegExp(`from\\s+['"]@radix-ui/react-(${RADIX_FLOATING.join("|")})['"]`);
    const offenders = files
      .filter((f) => !f.endsWith("components/overlay/index.tsx"))
      .filter((f) => re.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("exactly ONE TooltipProvider, at the app root", () => {
    const mounts = files.filter((f) =>
      /<TooltipProvider\b/.test(readFileSync(f, "utf8")),
    );
    expect(mounts.map(rel)).toEqual(["app/providers.tsx"]);
  });

  it("call sites do not re-declare the surface the primitive owns", () => {
    const content = /<(Dropdown|Context)MenuS?u?b?Content\b|<(Select|Popover|Tooltip)Content\b/;
    const patch =
      /\b!?(bg-card|bg-popover|bg-bg-dark|border-divider|backdrop-blur\S*|shadow-2xl|z-\d+)\b/;
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const tag of src.split("<").slice(1)) {
        const open = "<" + tag.slice(0, tag.indexOf(">") + 1);
        if (!content.test(open)) continue;
        if (patch.test(open)) offenders.push(`${rel(f)} ${open.split("\n")[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
