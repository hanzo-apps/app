import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");
const landing = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
const frame = readFileSync(join(ROOT, "components/landing/hero-preview.tsx"), "utf8");
const css = readFileSync(join(ROOT, "assets/globals.css"), "utf8");

/**
 * The hero is a sentence on the left and the product on the right, and every
 * way of losing that is silent.
 *
 * The arrangement has been wrong in both directions. The product frame once sat
 * BELOW the fold under a <LazySection> and a <Reveal> — both decide WHEN a thing
 * may be seen, while the frame's one job is to already be running — and it has
 * also been a full-bleed film with the copy floating over it, where the words
 * and the picture fought for the same pixels. What is pinned here is the shape
 * that is neither: two columns that stand beside each other above $lg, stack on
 * a phone, and never occupy each other's space.
 */
describe("the hero is a sentence beside the product", () => {
  it("says what the product does, once, on the left", () => {
    expect(landing).toContain("Describe your app.");
    expect(landing).toContain("Hanzo builds and ships it.");
    expect(landing).toContain("One prompt becomes a live app");
    // The headline's break is CSS, not a second heading: `.break-sm` hides it
    // below 640 so a phone reads one sentence. Delete the rule and the mobile
    // heading silently becomes "Describe your app.Hanzo builds and ships it."
    expect(landing).toContain('<br className="break-sm" />');
    expect(css).toContain(".break-sm");
  });

  it("stands the two columns side by side only from $lg", () => {
    // The row lives on the wrapper, in the $lg branch. Base is a column, which
    // is what stacks a phone: sentence first, product frame under it.
    const hero = landing.slice(landing.indexOf("── Hero"), landing.indexOf("── Below the fold"));
    expect(hero).toMatch(/\$lg=\{\{ flexDirection: "row"/);
    expect(hero).not.toMatch(/flexDirection="row"/); // never unconditionally
    expect(hero.indexOf("Describe your app.")).toBeLessThan(hero.indexOf("<HeroPreview />"));
  });

  it("mounts the product frame exactly once, in the fold", () => {
    expect(landing.match(/<HeroPreview \/>/g)).toHaveLength(1);
    expect(landing.indexOf("<HeroPreview />")).toBeLessThan(landing.indexOf("── Below the fold"));
  });

  it("does not put the frame to sleep behind LazySection", () => {
    // LazySection defers a subtree until it is scrolled to; the hero is what
    // the page opens with, so a deferred hero renders nothing at all on arrival.
    const hero = landing.slice(landing.indexOf("── Hero"), landing.indexOf("── Below the fold"));
    expect(hero).not.toMatch(/<LazySection\b/);
  });

  it("puts the composer in the column with the sentence it answers", () => {
    // There is ONE composer on the page and it belongs to the hero's left
    // column, under the subline — not in a sticky bar across the foot of the
    // page. That bar is why the fold read as copy, a picture, and an unrelated
    // strip at the bottom, and on a phone it sat under everything else instead
    // of after the headline.
    const hero = landing.slice(landing.indexOf("── Hero"), landing.indexOf("── Below the fold"));
    expect(hero).toContain("<BuildComposer");
    expect(landing.match(/<BuildComposer/g)).toHaveLength(1);
    expect(hero.indexOf("One prompt becomes a live app")).toBeLessThan(hero.indexOf("<BuildComposer"));
    expect(hero.indexOf("<BuildComposer")).toBeLessThan(hero.indexOf("<HeroPreview />"));

    // The dock is gone from BOTH sides. Left in the stylesheet it is dead
    // weight that reads as live pinning.
    expect(landing).not.toContain("hz-dock");
    expect(css).not.toContain(".hz-dock");

    // `100svh` and not `vh`: a phone's URL bar moves the large unit, so the
    // hero would resize under the fold it is supposed to own.
    expect(hero).toMatch(/minHeight="100svh"/);
  });

  it("shows the product, and never the address of the page you are on", () => {
    // A visitor reading this is already on hanzo.app. An "<app>.hanzo.app" in
    // the frame's address strip is the site telling them where they are, and it
    // puts a domain in front of the product it exists to show.
    //
    // Measured against the code that RENDERS, with comments stripped: the rule
    // is written down a few lines above the constant it governs, and a check
    // that reads prose fails on its own explanation.
    const code = frame.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toContain("hanzo.app");
    expect(code).not.toContain("your-app");
    expect(code).toContain('const APP = "Vibe Check"');
  });

  it("draws the frame in HTML, so it is sharp at every width", () => {
    // Not a film: no <video>, no master to fetch, nothing to crop. The old
    // full-bleed treatment and its four stills are gone with it.
    expect(landing).not.toContain("HeroVideo");
    expect(landing).not.toContain("hero-tall");
    expect(frame).not.toContain("<video");
  });
});
