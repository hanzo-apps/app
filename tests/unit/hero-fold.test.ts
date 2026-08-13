import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");
const landing = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
const film = readFileSync(join(ROOT, "components/landing/hero-video.tsx"), "utf8");
const css = readFileSync(join(ROOT, "assets/globals.css"), "utf8");

/**
 * The hero IS the film, and every way of losing that is silent.
 *
 * It began below the fold under a <LazySection> and a <Reveal> — both of which
 * decide WHEN a thing may be seen, while the film's one job is to already be
 * running when the page arrives. Then it was a capped box beside the headline,
 * sized by arithmetic that fitted it around the copy, which rendered it as a
 * 432px thumbnail on a 1440x900 screen. Now it fills the fold and the copy is
 * gone: the film says the sentence itself, in the product's own chrome, and the
 * HTML that used to say it again is deleted.
 *
 * None of those regressions would throw. What is pinned here is the shape that
 * makes them impossible to reintroduce quietly.
 */
describe("the hero is the film", () => {
  it("mounts the film in the hero, before the band below it", () => {
    const mount = landing.indexOf("<HeroVideo />");
    const belowFold = landing.indexOf("── Below the fold");
    expect(mount).toBeGreaterThan(-1);
    expect(mount).toBeLessThan(belowFold);
    expect(landing.match(/<HeroVideo \/>/g)).toHaveLength(1);
  });

  it("keeps the hero's copy deleted, so the message is said once", () => {
    // The film carries the headline, the pill and the subline itself. Each of
    // these strings was a second copy of something the picture already says.
    expect(landing).not.toContain("Describe your app.");
    expect(landing).not.toContain("Apps, wired to real data");
    expect(landing).not.toContain("One prompt becomes a live app");
    // The line-break helper went with the headline that was its only caller;
    // left behind it is a rule that reads live and governs nothing.
    expect(css).not.toContain(".break-sm");
  });

  it("does not put the film to sleep behind Reveal or LazySection", () => {
    // Both gate visibility, and a browser will not autoplay a film it cannot
    // see. The hero is now a single mount, so the span between the section
    // comment and the mount is the only place a wrapper could hide.
    const hero = landing.indexOf("── Hero");
    const mount = landing.indexOf("<HeroVideo />");
    expect(hero).toBeGreaterThan(-1);
    expect(mount).toBeGreaterThan(hero);
    const between = landing.slice(hero, mount);
    expect(between).not.toMatch(/<Reveal\b/);
    expect(between).not.toMatch(/<LazySection\b/);
  });

  it("fills the fold, and the film is what decides that", () => {
    // `100svh` and not `vh`: a phone's URL bar moves the large unit, and the
    // film would resize under the composer every time it retracted.
    expect(film).toMatch(/minHeight="100svh"/);
    expect(film).toMatch(/object-fit: cover/);
    // The page hands it no box at all any more — no cap, no wrapper geometry.
    expect(landing).not.toContain("hz-fold");
    expect(css).not.toContain(".hz-fold");
    expect(film).not.toContain("maxWidth");
  });

  it("carries the film's message where a picture cannot be watched", () => {
    // With the copy gone this alt text is the only sentence on the hero. It is
    // what a screen reader reads and what a crawler indexes, so an empty or
    // decorative alt here would leave the page's whole message inside a video.
    const alt = film.match(/const ALT =\s*\n?\s*"([^"]+)"/);
    expect(alt).not.toBeNull();
    expect(alt![1].length).toBeGreaterThan(40);
  });
});
