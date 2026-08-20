
import { read, root } from "../source";

/**
 * The recent-projects list is a GRID with a fixed track count, on both surfaces.
 *
 * `.card-grid` is `auto-fit, minmax(min(280px, 100%), 1fr)`, which collapses to
 * ONE column below roughly 580px. A one-up recent list is a stack of full-bleed
 * cards whose framed iframe stays at its own logical width, so the shot sits on
 * the left and half of every row is empty black — which is what a phone showed
 * on the home page while the dashboard, on `.project-grid`, was correct.
 *
 * `.project-grid` fixes the count (two on a phone, three from md) and its
 * `minmax(0, 1fr)` is what lets the iframe scale DOWN to the track rather than
 * forcing the track out to the iframe.
 */
const css = read("assets/globals.css");
const home = read("app/page.tsx");
const dash = read("app/dashboard/page.tsx");

describe("the recent-projects grid", () => {
  it("is used by BOTH the home page and the dashboard", () => {
    expect(home).toMatch(/className="project-grid"/);
    expect(dash).toMatch(/className="project-grid"/);
  });

  it("never renders the recent list through card-grid again", () => {
    // The home page shipped this way: the rule existed, the markup pointed
    // elsewhere, and only a phone showed the difference.
    const section = home.slice(home.indexOf("Continue building"));
    expect(section).not.toMatch(/className="card-grid"/);
  });

  it("puts two on a phone and three from md", () => {
    const rule = css.slice(css.indexOf(".project-grid {"));
    expect(rule).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    const md = rule.slice(rule.indexOf("@media (min-width: 768px)"));
    expect(md).toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  });

  it("uses minmax(0,...) so the framed preview can shrink to its track", () => {
    // A `minmax(280px, ...)` floor would let the iframe's logical width win
    // again, which is the black-half-row bug wearing a different number.
    const rule = css.slice(css.indexOf(".project-grid {"), css.indexOf(".project-grid {") + 400);
    expect(rule).not.toMatch(/minmax\(\s*(?!0)\d+px/);
  });

  it("keeps the preview frame filling its card", () => {
    const frame = css.slice(css.indexOf(".thumb-frame"));
    expect(frame).toMatch(/inset:\s*0/);
    expect(frame).toMatch(/width:\s*100%/);
    expect(frame).toMatch(/height:\s*100%/);
  });
});
