/**
 * A thumbnail's width is a VIEWPORT, and a reset will take it away.
 *
 * `ProjectThumb` frames the real deployed site at a fixed logical desktop width
 * and scales it down, so the card shows the desktop layout. `width` alone does
 * not secure that: `max-width` constrains the used width no matter what `width`
 * says — different properties, so an inline `width: 1280px` loses to a
 * stylesheet's `max-width: 100%`, and @hanzo/ui's theme.css ships exactly that
 * as the ordinary responsive-media reset:
 *
 *     :where(img,svg,video,canvas,iframe,picture,object){max-width:100%}
 *
 * Capped, the frame laid out at the CARD's width. The site inside saw ~390px,
 * rendered its phone layout, and the transform shrank that to a ~114px strip —
 * so every project card showed a real, correctly-scaled screenshot of the wrong
 * layout, which looks like a cropping bug and is not one. Measured in a browser:
 * 390px capped, 1280px with `max-width: none`.
 *
 * Nothing else catches it. The build is green, no type is wrong, the iframe
 * loads, and the picture is sharp — it is simply of the mobile site.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Comment-stripped: the prose above the fix must not be able to satisfy the
// check that guards it.
const src = readFileSync(
  join(process.cwd(), "components/project-thumb/index.tsx"),
  "utf8",
)
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("the framed site lays out at a desktop viewport", () => {
  it("declares a logical width the box does not decide", () => {
    expect(src).toMatch(/const LOGICAL_W = \d{4}/);
    expect(src).toMatch(/width: LOGICAL_W/);
  });

  it("opts OUT of the responsive-media cap that would collapse it", () => {
    expect(src).toMatch(/maxWidth: ['"]none['"]/);
  });

  it("keeps signed-in Hanzo pages out of public thumbnails", () => {
    expect(src).toContain('"console.hanzo.ai", "hanzo.id"');
    expect(src).toMatch(/const showLive = canPreview\(liveUrl\) && !failed/);
  });

  it("scales to the box rather than resizing the viewport", () => {
    // The shrinking is a TRANSFORM. Resizing the iframe instead would change
    // what the framed site lays out against, which is the same defect wearing
    // different clothes.
    expect(src).toMatch(/transform: `scale\(\$\{box\.scale\}\)`/);
    expect(src).toMatch(/scale: w \/ LOGICAL_W/);
  });
});

describe("the sheet that makes the opt-out necessary is the one we load", () => {
  // What this app controls is the IMPORT; the rule inside it is @hanzo/ui's own
  // contract and is tested there (pkg/ui/src/glass.test.ts), so asserting it
  // again here would be a second copy of somebody else's invariant — the exact
  // drift this repo keeps writing down. Assert the seam instead: while the app
  // imports that sheet, the cap applies and `maxWidth: 'none'` is load-bearing.
  //
  // Jest maps `*.css` to a style mock and patches `createRequire` too, so the
  // sheet cannot be read from a unit test at all. The import is the readable,
  // honest half of the fact.
  it("app/layout.tsx imports @hanzo/ui's sheet", () => {
    const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/@hanzo\/ui\/(theme|glass)\.css/);
  });
});
