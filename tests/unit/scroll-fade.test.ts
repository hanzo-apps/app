import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../..");
const css = readFileSync(join(root, "assets/globals.css"), "utf8");
const askAi = readFileSync(join(root, "components/editor/ask-ai/index.tsx"), "utf8");

/**
 * A right-edge fade is a CLAIM — "there is more, scroll for it". Drawn
 * unconditionally it lies whenever the row fits, and the lie is not free: the
 * mask lands on whatever occupies the last 12% of the container. On the
 * builder's suggestion row at desktop width that was a live action pill,
 * permanently dimmed with nothing behind it.
 *
 * CSS cannot ask an element whether it can scroll, so the rule carries its own
 * precondition and the owner of the scroller measures it.
 */
describe("the right fade only claims what is true", () => {
  it("masks only under [data-more] — never a bare .scroll-fade-r", () => {
    // Any rule whose selector is the class with no attribute qualifier.
    const bare = css.match(/^\.scroll-fade-r\s*(?:,|\{)/m);
    expect(bare).toBeNull();
    expect(css).toContain(".scroll-fade-r[data-more]");
  });

  it("the suggestion row sets data-more from a live measurement", () => {
    expect(askAi).toMatch(/className="[^"]*scroll-fade-r/);
    // scrollWidth - clientWidth - scrollLeft: the remaining distance, so the
    // fade also clears once the row is scrolled to its end.
    expect(askAi).toMatch(
      /toggleAttribute\(\s*"data-more",\s*el\.scrollWidth - el\.clientWidth - el\.scrollLeft > 1\s*\)/,
    );
  });

  it("re-measures on resize and on scroll", () => {
    expect(askAi).toContain("new ResizeObserver(measure)");
    expect(askAi).toContain('el.addEventListener("scroll", measure');
    expect(askAi).toContain('el.removeEventListener("scroll", measure)');
    expect(askAi).toContain("ro.disconnect()");
  });
});
