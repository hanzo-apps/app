/**
 * The builder's Enso launcher is ANCHORED, never floating over the preview.
 *
 * `public/edit.js` pins itself to the viewport's bottom-right corner. Measured
 * live on /dev at 1430x832, its 56px box sits at x 1358-1414, y 760-816 — over
 * the preview card (x 404-1418, y 62-792, 8px corner), across the gap below it,
 * and onto the console dock bar (y 804-832) where the dock keeps its own chat
 * toggle and mic. That is the "clipped at the rounded corner" report: the mark is
 * cut by the card's corner because it is drawn ON the card. Its computed
 * `margin-top` is 0px — there is no offset to correct, and no inset helps,
 * because the card fills the whole right side.
 *
 * It was previously turned off here entirely, by declaring no repo. That solved
 * the collision by removing the tool: editing hanzo.app itself became
 * unreachable from the builder. `hanzo:anchor` fixes the PLACEMENT instead — the
 * launcher mounts inside the console's control cluster, out of the canvas and
 * beside the other workspace controls.
 *
 * The invariant here is unchanged and is about PIXELS, not the repo: the
 * launcher may never be free to draw over the customer's app. Easy to undo by
 * accident, so it is pinned from both ends.
 */
import { MARK_PATHS, MARK_VIEWBOX } from "@hanzo/logo/logos";
import { widget } from "../widget";
import { existsSync } from "node:fs";

import { join } from "node:path";

import { read, root } from "../source";



describe("the builder Enso launcher never floats over the preview", () => {
  it("edit.js still treats a missing repo as 'do nothing'", () => {
    const src = widget();
    // Two facts, checked apart. They used to be one regex requiring the bail to
    // sit on the line AFTER the declaration, which said nothing about the rule
    // and broke the moment edit.js grew a host fallback and moved its bail 250
    // lines down — reporting that a still-honoured contract was gone.
    expect(src).toMatch(/var REPO = meta\('hanzo:repo'\)/);
    expect(src).toMatch(/if \(!REPO\) return;/);
  });

  it("the root layout is what declares the repo", () => {
    expect(read("app/layout.tsx")).toContain('"hanzo:repo": "hanzoai/app"');
  });

  it("a phone gets no corner launcher at all", () => {
    // The dock only exists where the console is laid out. A phone collapses it,
    // so `place()` finds no slot and edit.js keeps its fallback — 44px pinned at
    // right/bottom 12px — which on the builder is the composer's send button and
    // on the marketing pages is whatever CTA the corner happens to land on. The
    // anchor fixes PLACEMENT where there is a dock; this is the other half, for
    // where there cannot be one.
    //
    // Measured on a production build: at 375x667 the host computes
    // `display: none`, the fab is 0x0, and a tap at the corner reaches the page
    // beneath; at 1280x800 the same build draws it 44x44 at 1220,740 and the
    // corner tap reaches the widget. Both, or this is either a tool nobody can
    // use or a tool eating someone's tap.
    const rule = read("assets/globals.css").match(
      /@media \(max-width: *(\d+)px\) \{\s*\[data-hanzo-edit\]:not\(\[data-hanzo-anchored\]\) \{([^}]*)\}/,
    );
    expect(rule).not.toBeNull();
    expect(Number(rule![1])).toBeGreaterThanOrEqual(640);
    expect(rule![2]).toMatch(/display: *none/);
  });

  it("edit.js honours an anchor and unpins itself when anchored", () => {
    const src = widget();
    expect(src).toMatch(/meta\('hanzo:anchor'\)/);
    // Anchoring must actually unpin it — a launcher inside the status bar that
    // is still `position: fixed` lands straight back on the preview. Which of
    // the two IN-FLOW positions it takes is the launcher's business: it is
    // `relative` so the prism ring has something to be absolute against, and was
    // `static` before that existed. Pinning the keyword rather than the property
    // failed that rename while the mark was still, correctly, in the dock.
    const anchored = src.match(/:host\(\[data-hanzo-anchored\]\) \.fab\{([^}]*)\}/);
    expect(anchored).not.toBeNull();
    expect(anchored![1]).toMatch(/position:(static|relative)/);
    // A selector matching nothing falls back to the corner rather than vanishing.
    expect(src).toMatch(/document\.body\.appendChild\(host\)/);
  });

  it("the launcher draws the app's OWN mark, not a second one", () => {
    // Assert AGREEMENT rather than either literal: a test that pins only the
    // widget is satisfied by changing the widget alone, which is exactly the
    // drift being prevented.
    //
    // Read the mark from @hanzo/logo, which is where it lives now — asserting a
    // literal, or comparing against components/model-icon.tsx, both stop meaning
    // anything the moment the canonical source moves.
    //
    // The widget cannot import it: it is a standalone widget served to
    // third-party pages, so it MUST carry the path data inline. That is exactly
    // why this check exists — an inline copy is the one thing that can silently
    // drift.
    //
    // GEOMETRY, not bytes. The launcher wears the block-H now (the glyph
    // @hanzogui/shell draws, so one shape means one thing in one corner), and it
    // wears the MONOCHROME cut: `fill="currentColor"` on the svg and the five
    // structural paths, where @hanzo/logo's canonical export carries two `shade`
    // paths more for the two-tone version. Comparing the whole string would fail
    // on that difference, which is a colour decision and not drift. Every path
    // the widget draws must be one the canonical mark draws.
    const src = widget();
    const paths = (s: string) => [...s.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
    const canonical = new Set(paths(MARK_PATHS));
    const drawn = paths(src.slice(src.indexOf("var MARK ="), src.indexOf("var fab =")));
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.filter((d) => !canonical.has(d))).toEqual([]);
    expect(src).toContain(MARK_VIEWBOX);
    // The hairline is gone on purpose; `vector-effect` would re-split the weight.
    // Match the ATTRIBUTE, not the word: edit.js names it in a comment saying it
    // deliberately has none, and a bare /vector-effect/ fails on that sentence.
    expect(src).not.toMatch(/vector-effect\s*=/);
  });

  it("/dev anchors the launcher by NAMING the key", () => {
    const path = "app/dev/layout.tsx";
    expect(existsSync(join(root, path))).toBe(true);
    const src = read(path);
    // Measured live: an empty `other: {}` changed nothing, because Next merges
    // `other` BY KEY into the parent's. The key has to be named to override it.
    expect(src).toMatch(/other:\s*\{\s*"hanzo:anchor":\s*"#enso-dock"\s*\}/);
    // It must stay a pass-through: this layout exists for the metadata alone and
    // may never become a place that renders chrome.
    expect(src).toMatch(/return children;/);
  });

  it("the console renders the slot the anchor points at", () => {
    // A dangling selector would silently put the launcher back in the corner.
    expect(read("components/editor/console/index.tsx")).toContain('id="enso-dock"');
  });
});
