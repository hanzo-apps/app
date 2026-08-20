/**
 * The hero mockup's view tabs ARE the builder's panes — one source, no copy.
 *
 * The landing hero (`hero-preview.tsx`) is a miniature of the real `/dev` editor.
 * Its view-tab row drifted once already: a hand-copied `Chat/Preview/Code` went
 * stale against the editor's actual `Preview/Files/Code/More` (the switcher reads
 * `lib/panes` PANES; the mockup didn't). It was refixed by having the mockup READ
 * the same PANES — so the two cannot diverge.
 *
 * This pins that. The failure it guards is invisible: re-hardcoding the tab list
 * type-checks and renders fine, and only diverges from the editor whenever the
 * editor's panes next change — exactly the drift the sibling css/geometry tests
 * exist to stop. If a future edit reverts to a literal tab array, this goes red.
 */
import { readFileSync } from "node:fs";

import { join } from "node:path";


const SRC = readFileSync(
  join(__dirname, "..", "..", "components", "landing", "hero-preview.tsx"),
  "utf8",
);

describe("hero mockup view tabs", () => {
  it("reads the builder's PANES rather than a hand-copied list", () => {
    // The one source.
    expect(SRC).toMatch(/import\s*\{\s*PANES\s*\}\s*from\s*["']@\/lib\/panes["']/);
    // Derived as the desktop subset (chat is mobileOnly), then mapped.
    expect(SRC).toMatch(/VIEW_TABS\s*=\s*PANES\.filter/);
    expect(SRC).toMatch(/VIEW_TABS\.map/);
  });

  it("does NOT re-hardcode a tab literal (the drift pattern)", () => {
    // The stale copy was `{ id: "chat", label: "Chat", icon: … }`. A literal tab
    // object keyed by id/value + label is the shape that goes stale — refuse it.
    expect(SRC).not.toMatch(
      /\{\s*(id|value):\s*["'](chat|preview|files|code|more)["']\s*,\s*label:/,
    );
  });
});
