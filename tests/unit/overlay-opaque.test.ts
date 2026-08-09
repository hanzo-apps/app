import { readFileSync } from "fs";
import { join } from "path";

/**
 * A floating surface that carries text is OPAQUE.
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
 *    engine may ignore, so the ground must be opaque and the blur is a bonus.
 *  - `!important` is load-bearing. These backgrounds are written INLINE, which
 *    beats any selector at any specificity (the collision `.t_group_true` needs
 *    it for). Without it the rule is a silent no-op — measured, the computed
 *    value stayed at .72 while the CSS looked correct in the file.
 */
describe("floating surfaces are opaque", () => {
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

  it("paints an opaque ground, and takes the token rather than a hex", () => {
    expect(rule).toMatch(/background-color:\s*var\(--popover\)/);
  });

  it("outranks the inline background, or it does nothing at all", () => {
    expect(rule).toMatch(/background-color:\s*var\(--popover\)\s*!important/);
  });

  it("keeps the blur for engines that do composite it", () => {
    // Both spellings: the prefixed one is what Safari reads, and the design
    // system ships the same pair for its own dropdown.
    expect(rule).toMatch(/-webkit-backdrop-filter:\s*blur\(20px\)/);
    expect(rule).toMatch(/(?<!-)\bbackdrop-filter:\s*blur\(20px\)/);
  });
});
