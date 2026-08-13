import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");
const landing = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
const film = readFileSync(join(ROOT, "components/landing/hero-video.tsx"), "utf8");
const css = readFileSync(join(ROOT, "assets/globals.css"), "utf8");

/**
 * The film is the hero visual, and every way of losing that is silent.
 *
 * It used to sit below the fold, under a <LazySection> and a <Reveal>. Both of
 * those decide WHEN a thing may be seen, and the film's one job is to already
 * be running when the page arrives — so either wrapper puts it back to sleep
 * and nothing about the page looks broken.
 *
 * The size is the other half, and `.hz-fold` is the whole of it: one cap per
 * arrangement, each the height the fold has spare converted through the
 * film's ratio. Delete it and nothing errors — the film simply grows until it
 * is under the composer, which reads as fine on a tall desktop and is wrong on
 * every phone.
 */
describe("the fold holds the film", () => {
  it("opens the hero with the film, before the copy and the band below", () => {
    const mount = landing.indexOf("<HeroVideo />");
    const headline = landing.indexOf("Describe your app.");
    const belowFold = landing.indexOf("── Below the fold");
    expect(mount).toBeGreaterThan(-1);
    expect(mount).toBeLessThan(headline);
    expect(mount).toBeLessThan(belowFold);
  });

  it("does not put the film to sleep behind Reveal or LazySection", () => {
    // Its slot IS its parent, with nothing in between — which is the only
    // assertion that separates a wrapper from a sibling. The copy column above
    // is full of <Reveal>s, so "no Reveal nearby" reads correct and fails on
    // the shipped file.
    expect(landing).toMatch(/<YStack className="hz-fold"[^>]*>\s*<HeroVideo \/>/);
    expect(landing.match(/<HeroVideo \/>/g)).toHaveLength(1);
  });

  it("renders the still first, so the server has an answer and the box never shifts", () => {
    // `useState(false)` then a mount effect: the picture is what SSR sends and
    // the film is the client upgrade. Seeding this from the media query would
    // put a <video> in the server's HTML for someone who asked for no motion.
    expect(film).toMatch(/useState\(false\)/);
    expect(film).toMatch(/setPlay\(!reducedMotion\(\)\)/);
  });

  it("caps the film once per arrangement", () => {
    // Square on a phone, 4/3 stacked, 4/3 beside the copy. Fewer means one of
    // them silently inherits another's budget, which is only visible as a film
    // sunk under the composer on the viewport nobody opened.
    const caps = css
      .slice(css.indexOf(".hz-fold {"))
      .match(/\.hz-fold \{\s*max-width: calc\(/g);
    expect(caps).toHaveLength(3);
    // The film owns its ratio and nothing else; the fold owns the width.
    expect(film).toContain("aspect-ratio: 1 / 1");
    expect(film).not.toContain("maxWidth");
  });
});
