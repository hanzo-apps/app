import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Content that PAINTS is not content you can REACH.
 *
 * Both rules here were found the same way — by measuring a live page rather
 * than looking at one — because neither failure shows up as anything wrong on
 * screen. Nothing throws, nothing renders blank, no gate goes red. The page
 * simply ends before its content does.
 *
 * They are pinned as source assertions because a browser test cannot see either
 * one without being driven to the exact scroll position and viewport where it
 * bites, and because the CSS reads perfectly correct in the file while doing
 * nothing (both need `!important` or the right anchor to outrank what gui
 * writes).
 */
describe("everything on the page can be reached", () => {
  const css = readFileSync(join(__dirname, "../../assets/globals.css"), "utf8");

  describe("a tab panel claims the height of its content", () => {
    const rule = (() => {
      const at = css.indexOf('html:root [data-slot="tabs-content"]');
      expect(at).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf("}", at) + 1);
    })();

    it("covers the slot AND the classes gui actually emits", () => {
      // `@hanzo/ui` sets the slot, but gui renders `.is_TabsContent` /
      // `.is_Tabs` — and BOTH were collapsed (0 around 716px, 88 around 804px).
      expect(rule).toMatch(/\.is_TabsContent/);
      expect(rule).toMatch(/\.is_Tabs\b/);
    });

    it("fixes the BASIS and leaves the growing alone", () => {
      // The library's `flex: 1` is right for a full-height pane — the panel
      // should still fill one. Only `flex-basis: 0` was wrong, so only the
      // basis is restored. `flex: none` here would break the tall case.
      expect(rule).toMatch(/flex-basis:\s*auto/);
      expect(rule).not.toMatch(/flex:\s*(none|0)/);
    });
  });

  describe("a long picker is a sheet on a phone, not a hanging panel", () => {
    const rule = (() => {
      const at = css.indexOf("html:root .hz-picker-panel");
      expect(at).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf("}", at) + 1);
    })();

    it("only applies at phone widths", () => {
      const media = css.lastIndexOf("@media", css.indexOf("html:root .hz-picker-panel"));
      expect(css.slice(media, media + 30)).toMatch(/max-width/);
    });

    it("pins to the viewport rather than to the trigger", () => {
      // The whole point: the trigger may have no room below it.
      expect(rule).toMatch(/position:\s*fixed\s*!important/);
      expect(rule).toMatch(/transform:\s*none\s*!important/);
    });

    it("is bounded by the viewport, so it always fits", () => {
      // dvh, not vh — the phone's URL bar changes the usable height, and vh
      // does not follow it.
      expect(rule).toMatch(/max-height:\s*\d+dvh\s*!important/);
    });

    it("outranks the inline geometry, or it does nothing", () => {
      // gui writes the popper's position and width INLINE, which beats any
      // selector at any specificity. Without `!important` this whole block is
      // a silent no-op that reads correct in the file.
      const decls = rule.match(/[a-z-]+:[^;]+;/g) ?? [];
      expect(decls.length).toBeGreaterThan(3);
      for (const d of decls) expect(d).toMatch(/!important/);
    });
  });

  it("the picker asks for the sheet by name", () => {
    // A rule scoped to a class nobody sets is the other way this dies quietly.
    const picker = readFileSync(join(__dirname, "../../components/model-selector.tsx"), "utf8");
    expect(picker).toMatch(/className="[^"]*hz-picker-panel/);
  });
});
