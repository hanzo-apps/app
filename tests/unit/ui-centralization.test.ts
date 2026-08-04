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
    // Tailwind is detected by its vocabulary, not by className's existence:
    // app-owned CSS classes (globals.css) and forwarded className plumbing are
    // legitimate gui usage. This matches the utility grammar inside string or
    // template className values.
    const UTIL =
      /className=(?:"[^"]*?|\{`[^`]*?)(?<![-\w])(?:flex|grid|hidden|inline-flex|items-(?:center|start|end)|justify-(?:center|between|start|end)|gap-[\d.]|space-[xy]-|p[xylrtb]?-[\d.]|m[xylrtb]?-[\d.]|w-(?:full|\d)|h-(?:full|\d)|size-\d|min-h-|max-w-|text-(?:xs|sm|base|lg|xl|\dxl|left|center|right|white|black|foreground|muted-foreground|primary|destructive|red-|green-|blue-|yellow-|orange-|amber-|emerald-|purple-|neutral-|gray-)|bg-(?:white|black|background|muted|card|accent|primary|transparent|red-|green-|blue-|yellow-|orange-|amber-|emerald-|purple-|neutral-|gray-|\[)|border-(?:border|primary|transparent|input|red-|green-|blue-|amber-|emerald-)|rounded(?:-\w+)?\b|shadow(?:-\w+)?\b|font-(?:mono|sans|medium|semibold|bold)|uppercase|lowercase|capitalize|tracking-|leading-|divide-[xy]|overflow-(?:hidden|auto|scroll)|absolute|relative|fixed|sticky|inset-|top-\d|left-\d|right-\d|bottom-\d|z-\d|opacity-\d|transition|duration-\d|cursor-pointer|pointer-events-|shrink-0|grow\b|truncate|(?:hover|focus|active|disabled|group-hover|max-lg|max-md|sm|md|lg|xl|2xl|dark):)/;
    // lib/project-templates.ts is a permanent exemption: it is the SOURCE of the
    // starter apps this product generates for users — tailwind there is product
    // content shipped to user projects, not this app's UI.
    //
    // TAILWIND_DEBT is the OPPOSITE of an exemption — it is a RATCHET. These UI
    // files still carry Tailwind from before the 8.x @hanzo/gui convergence, whose
    // de-Tailwind is explicitly multi-pass (components/editor/CLAUDE.md, "Phase 4").
    // Listing a file here is tracked debt, not permission: the two assertions below
    // let the set only SHRINK. A NEW file with Tailwind is not in the set, so it
    // fails; and de-Tailwinding a listed file makes the ratchet fail until it is
    // removed here. The test turns green for good only when this reaches [].
    const TAILWIND_DEBT = [
      "app/enterprise/page.tsx",
      "app/features/page.tsx",
      "app/learn/page.tsx",
      "app/playground/page.tsx",
      "app/resources/page.tsx",
      "app/signup/page.tsx",
      "app/templates/analytics-dashboard/page.tsx",
      "app/templates/blog-platform/page.tsx",
      "app/templates/kanban-board/page.tsx",
      "components/checkpoint-panel/index.tsx",
      "components/database-manager/secrets-manager.tsx",
      "components/import-git-panel.tsx",
      "components/project-manager/project-card.tsx",
      "components/publish-settings/general-tab.tsx",
      "components/publish-settings/seo-tab.tsx",
      "components/store/storefront.tsx",
      "components/template-manager/template-card.tsx",
    ];
    const offenders = offendersOf(UTIL).filter((f) => f !== "lib/project-templates.ts");
    // No NEW Tailwind: every offender must be a tracked-debt file.
    expect(offenders.filter((f) => !TAILWIND_DEBT.includes(f))).toEqual([]);
    // Ratchet: the debt list may not name a file that is already clean — so it can
    // only shrink. Removing Tailwind from a file requires deleting it from the list.
    expect(TAILWIND_DEBT.filter((f) => !offenders.includes(f))).toEqual([]);
  });

  it("exactly ONE TooltipProvider, at the app root", () => {
    expect(offendersOf(/<TooltipProvider\b/)).toEqual(["app/providers.tsx"]);
  });

  // ── The design law, enforced. Each of these shipped as a REAL regression
  //    (2026-08-04, the gui-codemod damage) and is structurally banned. ──

  it("numeric lineHeight renders as PIXELS — multipliers are strings", () => {
    // lineHeight={1.5} → line-height:1.5px: the line box collapses and text
    // stacks on itself. The one sanctioned numeric is a true-px case.
    const offenders = offendersOf(/lineHeight(=\{|:\s*)[12](\.[0-9]+)?[},\s]/).filter(
      (f) => f !== "components/sidebar/index.tsx",
    );
    expect(offenders).toEqual([]);
  });

  it("$color is the foreground — never a bordered container's fill", () => {
    // White panels ("the blobs"): a hairline border + $color background is a
    // surface wearing the text color. Surfaces sit on the ladder ($color2+).
    expect(offendersOf(/borderColor="\$borderColor" backgroundColor="\$color"/)).toEqual([]);
  });

  it("a size never lands in the color prop", () => {
    expect(offendersOf(/color(=|:\s*)"[0-9.]+(rem|px|em)"/)).toEqual([]);
  });

  it("no all-caps chrome — the owner reads sentence case", () => {
    expect(offendersOf(/textTransform="uppercase"/)).toEqual([]);
  });

  it("no $group-<size> queries while globals.css neutralizes container-type", () => {
    // .t_group_true { container-type: normal } restores intrinsic width for
    // every group'd chip (the 26px-collapse class). A size query would silently
    // never match under it — adding one requires scoping that rule first.
    expect(offendersOf(/\$group-(xs|sm|md|lg|xl)\b/)).toEqual([]);
  });
});
