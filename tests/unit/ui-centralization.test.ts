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
      "app/templates/page.tsx",
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

/**
 * ONE chrome.
 *
 * Every signed-in page renders inside `AppShell`, and the shell — not the page —
 * draws the title, the rail under it and the scroll region. Before this, six
 * pages drew their own: five title sizes ($6/$7/$8/$10/$11), five column widths
 * (672/768/896/1152/1280), two "← Back" buttons standing in for a sidebar the
 * page had not mounted, and on /profile a header rail that disagreed with its
 * own body rail. These keep the pages from drifting apart again.
 */
describe("Chrome uniformity — the shell draws the header", () => {
  const shellPages = files
    .filter((f) => /^app\//.test(rel(f)))
    .filter((f) => /from\s+['"]@\/components\/app-shell['"]/.test(readFileSync(f, "utf8")));

  it("finds the signed-in pages", () => {
    expect(shellPages.length).toBeGreaterThan(8);
  });

  it("a titled page never draws its own <H1> — the shell owns it", () => {
    // Balanced `{...}` prop values are stripped first, so a `>` inside
    // `actions={<Button …>}` cannot end the tag early and hide a `title`.
    const withoutBraces = (src: string) => {
      let out = "";
      let depth = 0;
      for (const ch of src) {
        if (ch === "{") depth++;
        else if (ch === "}") depth = Math.max(0, depth - 1);
        else if (depth === 0) out += ch;
      }
      return out;
    };
    const offenders = shellPages.filter((f) => {
      const src = readFileSync(f, "utf8");
      const titled = /<AppShell[^>]*\stitle=/.test(withoutBraces(src));
      return titled && /<H1\b/.test(src);
    });
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no page re-opens the shell's scroll region", () => {
    // `<YStack flex={1} … overflow="scroll">` as a page's outermost child was
    // copied into eight pages and forgotten by two, which is why /connectors and
    // /profile could not scroll at all. The shell opens exactly one.
    const offenders = shellPages.filter((f) =>
      /flex=\{1\}\s+backgroundColor="\$background"\s+overflow="scroll"/.test(
        readFileSync(f, "utf8"),
      ),
    );
    expect(offenders.map(rel)).toEqual([]);
  });

  it("every Button on a signed-in page names its variant", () => {
    // THE screenshot defect. `<Button onClick={…}>Edit Profile</Button>` takes
    // @hanzo/ui's `default`, which is `bg: $color12, color: $color1` — and
    // $color12 is hsl(0 0% 100%), a pure white pill, the loudest object on a
    // #080808 page. Nothing in the source says "white"; the loudness comes from
    // the prop that was left off. Naming a variant (or spreading `accent`, the
    // one primary) is the whole fix, so the omission is what this bans.
    const openings = (src: string, name: string) => {
      const out: string[] = [];
      let i = 0;
      while ((i = src.indexOf("<" + name, i)) !== -1) {
        if (/[A-Za-z0-9]/.test(src[i + 1 + name.length] ?? "")) {
          i++;
          continue;
        }
        let depth = 0;
        let j = i;
        for (; j < src.length; j++) {
          const c = src[j];
          if (c === "{") depth++;
          else if (c === "}") depth--;
          else if (c === ">" && depth === 0) break;
        }
        out.push(src.slice(i, j + 1));
        i = j + 1;
      }
      return out;
    };
    const offenders = shellPages.flatMap((f) =>
      openings(readFileSync(f, "utf8"), "Button")
        .filter((t) => !/\bvariant\s*=/.test(t) && !/\.\.\.accent/.test(t))
        .map(() => rel(f)),
    );
    expect([...new Set(offenders)]).toEqual([]);
  });

  it("$color12 is never a control's fill", () => {
    // The same white blob reached by hand rather than by variant — /connectors'
    // selected category chip. Selected state is $color3 + $color, as in the sidebar.
    expect(offendersOf(/<Button[^>]*backgroundColor="\$color12"/)).toEqual([]);
  });
});

/**
 * ONE screen.
 *
 * A state that stands alone — the loading gate, the 404, the crash screen, the
 * OAuth callback, admin's sign-in, the store's receipt — has no `AppShell` above
 * it, so it must measure the screen itself. Ten of them wrote `minHeight="100%"`
 * beside `justifyContent="center"`, which is the shape that centers PERFECTLY
 * inside nothing: the percentage resolves against the parent's computed height,
 * every ancestor up to <body> is `height: auto` (globals.css gives body a
 * min-height only) and gui's provider span is `display: contents`, so it fell
 * back to auto, the stack shrink-wrapped its content, and the centering then
 * happened inside the content box. Nothing in the source looked wrong and the
 * flex properties were all correct — the box they centered in was 90px tall.
 *
 * Measured on /auth/callback: the brand mark at y=0 of a 903px viewport, 860px
 * of black beneath it. `screen` (lib/chrome) is the one spelling.
 */
describe("Full-screen states measure the screen", () => {
  it("`minHeight=\"100%\"` never carries the centering — that is `screen`", () => {
    const CENTERED_PERCENT = new RegExp(
      // one JSX opening tag holding both, in either order
      '<[A-Z]\\w*[^>]*\\bminHeight="100%"[^>]*\\bjustifyContent="center"' +
        '|<[A-Z]\\w*[^>]*\\bjustifyContent="center"[^>]*\\bminHeight="100%"',
    );
    expect(offendersOf(CENTERED_PERCENT)).toEqual([]);
  });

  it("the states that own the screen all reach for the same value", () => {
    // A floor, not a ceiling: it fails if `screen` stops being what full-screen
    // states use, which is how the ten hand-written copies accumulated.
    expect(offendersOf(/\{\.\.\.screen\}/).length).toBeGreaterThanOrEqual(8);
  });
});

/**
 * ONE spinner.
 *
 * A spinner is an arc IN MOTION; lucide ships only the arc. The rotation lived
 * in `.spin` (globals.css) as an OPT-IN, and an opt-in that 82 of 83 call sites
 * decline is not a mechanism — it is a hazard with a comment on it. Every busy
 * state in the app rendered a still three-quarter ring, which is what the owner
 * saw on /auth/callback and correctly read as breakage.
 *
 * `components/ui/spinner` binds the rotation to the glyph, so reaching for the
 * raw lucide loader is the thing to ban: there is no way to get the arc without
 * the motion, and therefore no way to forget it.
 */
describe("Spinners spin", () => {
  // NOT an exemption — a ratchet, in the shape TAILWIND_DEBT uses above. This
  // file was held by another agent during the sweep. The two assertions let the
  // set only SHRINK: a new raw loader fails because it is not listed, and
  // converting this one fails until it is removed from here.
  const RAW_LOADER_DEBT = ["components/settings/model-settings.tsx"];

  it("no raw lucide loader glyph — the motion comes with it", () => {
    // The one home renders the arc; everywhere else asks the home for it.
    const offenders = offendersOf(/<Loader(?:2|Circle)\b/).filter(
      (f) => f !== "components/ui/spinner.tsx",
    );
    expect(offenders.filter((f) => !RAW_LOADER_DEBT.includes(f))).toEqual([]);
    expect(RAW_LOADER_DEBT.filter((f) => !offenders.includes(f))).toEqual([]);
  });

  it("the one spinner is the one that carries `.spin`", () => {
    // `.spin` is not a class components decorate themselves with any more. The
    // sole other holder is the sync badge, which spins an icon that is NOT a
    // loader (it swaps glyph by status), so it states the motion itself.
    expect(offendersOf(/className=(?:"spin"|'spin'|\{'spin'\})/)).toEqual([
      "components/ui/spinner.tsx",
    ]);
  });
});

/**
 * A cover-fit image sizes itself FROM its frame — it has no height of its own.
 * @hanzo/ui's Button pins its size variant's height over anything the caller
 * passes, so a Button can never be that frame: the image collapses to the
 * control band and `cover` crops it to a sliver. Measured twice — /templates'
 * ResourceCard (30px holding 425px of content) and dev-onboarding's template
 * cards (full-width ~40px strips). The card idiom is a clickable YStack with an
 * `aspectRatio` wrapper; this scan keeps the Button version from returning.
 */
describe("Images own a frame", () => {
  it("a cover-fit image never renders inside a Button", () => {
    const offenders = files.filter((f) => {
      const src = readFileSync(f, "utf8");
      return /<Button\b(?:(?!<\/Button>)[\s\S])*?<Image\b(?:(?!\/>)[\s\S])*?objectFit/.test(src);
    });
    expect(offenders.map(rel)).toEqual([]);
  });
});
