import { readFileSync } from "fs";
import { join } from "path";

import { read } from "../source";

/**
 * A preview's edge has to survive a LIGHT screenshot.
 *
 * The card frames its preview with a light hairline (`rgba(255,255,255,.1)`),
 * which is legible on a dark shot and invisible on a pale one. Nine of the 21
 * shipped shots are light-themed — SaaS Landing measures 89% near-white — so
 * those ran edge to edge with no boundary and read as a white slab rather than
 * a picture of a website.
 */
describe("the template preview carries its own edge", () => {
  const css = read("assets/globals.css");
  const thumb = readFileSync(
    join(__dirname, "../../components/template-thumb.tsx"),
    "utf8",
  );

  it("puts the ring on the shot", () => {
    expect(thumb).toMatch(/className=\{`hz-shot /);
  });

  it("uses an OUTLINE, because an inset shadow paints behind an <img>", () => {
    // A replaced element draws its content over the background, so
    // `box-shadow: inset` is hidden; a border would resize the box. Outline
    // paints over the element and a negative offset pulls it inside the edge.
    const rule = css.slice(css.indexOf("html:root .hz-shot"));
    expect(rule).toMatch(/outline:\s*1px solid/);
    expect(rule).toMatch(/outline-offset:\s*-1px/);
  });

  it("is DARK — a light ring is the bug it fixes", () => {
    const rule = css.slice(css.indexOf("html:root .hz-shot"), css.indexOf("html:root .hz-shot") + 200);
    expect(rule).toMatch(/rgba\(\s*0,\s*0,\s*0/);
  });

  it("anchors on html:root so gui cannot outrank it", () => {
    expect(css).toMatch(/html:root \.hz-shot/);
  });

  it("does not tone or filter the shot", () => {
    // The preview is a picture of what the template actually looks like.
    // Dimming a pale one to match the page sells a thumbnail the product does
    // not have.
    const rule = css.slice(css.indexOf("html:root .hz-shot"), css.indexOf("html:root .hz-shot") + 200);
    expect(rule).not.toMatch(/filter:/);
  });
});
