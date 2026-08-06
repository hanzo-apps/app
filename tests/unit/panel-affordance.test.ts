import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The left-panel affordance, pinned — one glyph and one hint style, both of
 * them the fleet's rather than this app's.
 *
 * hanzo.chat keeps the glyph rule in the mark itself
 * (`packages/client/src/svgs/Sidebar.tsx`: "Canonical Hanzo sidebar-toggle
 * glyph: lucide PanelLeft. Unified across hanzo.chat, hanzo.app, and hanzo
 * console so the open/close affordance is the SAME icon everywhere"). This app
 * had three answers to the same question at once — `PanelLeft` alone in the
 * sidebar, a `PanelLeft`↔`PanelLeftClose` swap in the builder console and in
 * `/chat`, and the Hanzo mark standing in for the toggle on the collapsed rail
 * — with two of them visible on the same screen: on `/chat` the shell's toggle
 * and the conversation rail's sat ~330px apart wearing different shapes.
 *
 * The state is `aria-expanded`'s to carry; a second glyph only costs the eye a
 * shape to re-learn. Both facts are cheap to lose in an unrelated edit, so they
 * are pinned here rather than left to review.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "");

// Every surface that shows or hides a column on the reader's left.
const TOGGLES = [
  "components/sidebar/index.tsx",
  "components/editor/console/index.tsx",
  "app/chat/page.tsx",
];

describe("the left panel has ONE glyph", () => {
  it.each(TOGGLES)("%s renders PanelLeft and no second panel glyph", (path) => {
    const src = stripComments(read(path));
    expect(src).toMatch(/<PanelLeft\b/);
    // `PanelLeftClose` / `PanelLeftOpen` / `PanelRight` are the shapes that
    // were, or could next be, reached for to say what aria-expanded says.
    expect(src).not.toMatch(/PanelLeft(Close|Open)|PanelRight/);
  });

  it("the collapsed rail's own control is the toggle, not the brand mark", () => {
    const src = stripComments(read("components/sidebar/index.tsx"));
    const expand = src.match(
      /aria-label="Expand sidebar"[\s\S]{0,400}?<\/Button>/,
    );
    expect(expand).not.toBeNull();
    expect(expand![0]).toMatch(/<PanelLeft\b/);
    expect(expand![0]).not.toMatch(/<HanzoLogo\b/);
  });

  it("every panel toggle states its state where a reader can hear it", () => {
    for (const path of TOGGLES) {
      expect(stripComments(read(path))).toMatch(/aria-expanded=/);
    }
  });
});

describe("a shortcut hint is a hint, not a keycap", () => {
  // `kbd { … }`, the element rule — not `.hs-kbd`, which only gates visibility.
  const rule = stripComments(read("assets/globals.css")).match(
    /(?:^|\n)kbd\s*\{([^}]*)\}/,
  );

  it("exists as ONE element rule", () => {
    expect(rule).not.toBeNull();
  });

  it("takes its colour and size from the shared token layer", () => {
    // @hanzo/ui/theme.css is @hanzo/design's sheet — the same one hanzo.chat
    // imports — so both surfaces mute a hint by the same rung.
    expect(rule![1]).toMatch(/color:\s*var\(--text-tertiary\)/);
    expect(rule![1]).toMatch(/font-size:\s*var\(--text-xs\)/);
  });

  it("puts the label left and the shortcut right", () => {
    expect(rule![1]).toMatch(/margin-left:\s*auto/);
  });

  it("draws no box — that is what made the sidebar's ⌘K read as a control", () => {
    expect(rule![1]).not.toMatch(/border(-|:)/);
    expect(rule![1]).not.toMatch(/background/);
    expect(rule![1]).not.toMatch(/padding/);
  });
});
