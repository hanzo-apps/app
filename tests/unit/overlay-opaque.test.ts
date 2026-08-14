import { readFileSync } from "fs";
import { join } from "path";

/**
 * A floating surface that carries text is LEGIBLE WITHOUT THE BLUR.
 *
 * `@hanzo/ui` frosts its own `[data-slot="dropdown-menu-content"]` and even
 * carries the `-webkit-` prefix for it — but gui renders poppers and dialogs as
 * `.is_PopperContent` / `.is_DialogContent`, and `@hanzogui/shell`'s mega-menu
 * is `#hanzo-meet-menu`. None of those match that selector, so each was left
 * with the translucent ground (alpha .72) and no blur of its own.
 *
 * Translucent without an APPLIED blur is not frosted, it is see-through.
 * Measured in WebKit — which nobody had ever run this app in — with a menu open
 * the page's own text read straight through it: "Internal admin dashboard"
 * crossing "Generate and edit the app directly" on one line, and the ⌘K rows
 * over the hero. Chromium hid all three by happening to composite them over
 * darker pixels, which is why every screenshot looked correct.
 *
 * Two things this pins that a browser test would not, and that cost an attempt
 * each:
 *
 *  - Declaring the filter is NOT the fix. WebKit ACCEPTS both spellings —
 *    computed `backdropFilter` and `webkitBackdropFilter` both read the blur —
 *    and still declines to composite it. Legibility cannot rest on a filter an
 *    engine may ignore, so the ground must carry the legibility itself and the
 *    blur is a bonus.
 *
 *    That is a floor on DENSITY, not a demand for opacity, and reading it as
 *    "opaque" cost the surface its whole character: `var(--popover)` is
 *    #0f0f0f, so the menu became a black slab. The rule is now a ground dense
 *    enough that the page behind cannot be READ unblurred — 88%, where a white
 *    heading resolves to 12% over black, a wash rather than words — which
 *    satisfies WebKit and still lets the light through everywhere else.
 *  - `!important` is load-bearing. These backgrounds are written INLINE, which
 *    beats any selector at any specificity (the collision `.t_group_true` needs
 *    it for). Without it the rule is a silent no-op — measured, the computed
 *    value stayed at .72 while the CSS looked correct in the file.
 */
describe("floating surfaces stay legible", () => {
  const css = readFileSync(join(__dirname, "../../assets/globals.css"), "utf8");

  const rule = (() => {
    const at = css.indexOf("html:root .is_PopperContent");
    expect(at).toBeGreaterThan(-1);
    const open = css.indexOf("{", at);
    return css.slice(at, css.indexOf("}", open) + 1);
  })();

  it("covers every surface gui and the shell float, not just the popper", () => {
    // Each was found by sweeping, not by guessing — dropping one silently
    // restores the bug on that surface alone.
    for (const sel of ["\\.is_PopperContent", "\\.is_DialogContent", "#hanzo-meet-menu"]) {
      expect(rule).toMatch(new RegExp(sel));
    }
  });

  it("paints a DENSE ground, and takes the token rather than a hex", () => {
    // The token, never a literal — and mixed rather than raw, because raw is
    // opaque. The percentage is asserted so a future edit cannot quietly thin
    // it back toward the .72 that was unreadable in WebKit.
    expect(rule).toMatch(/background-color:\s*color-mix\(in srgb,\s*var\(--popover\)\s*(\d+)%/);
    const pct = Number(rule.match(/var\(--popover\)\s*(\d+)%/)![1]);
    expect(pct).toBeGreaterThanOrEqual(85);
    expect(pct).toBeLessThan(100);
  });

  it("outranks the inline background, or it does nothing at all", () => {
    expect(rule).toMatch(/background-color:[^;]*!important/);
  });

  it("keeps the blur for engines that do composite it", () => {
    // Both spellings: the prefixed one is what Safari reads, and the design
    // system ships the same pair for its own dropdown.
    expect(rule).toMatch(/-webkit-backdrop-filter:\s*blur\(20px\)/);
    expect(rule).toMatch(/(?<!-)\bbackdrop-filter:\s*blur\(20px\)/);
  });
});
