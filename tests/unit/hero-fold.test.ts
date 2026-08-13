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
 * The size is the other half, and it is now the whole fold: the film covers the
 * hero. It was capped instead — one `max-width` per arrangement, each the
 * height the fold had spare converted through the film's ratio — and that
 * arithmetic is what rendered it 432px wide on a 1440x900 screen and, on the
 * shipped build before it, below the fold entirely and therefore never playing,
 * because a browser will not autoplay a film it cannot see. A cap that can put
 * the hero visual off screen is not a cap worth keeping, so what is pinned here
 * is the opposite invariant: the film fills its hero and the hero is what
 * positions it.
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
    // Nothing that gates visibility may stand between the hero and the film.
    // Checking "no Reveal nearby" would read correct and pass on any file — the
    // copy column below is full of them — so this looks at the span BETWEEN the
    // hero's opening tag and the mount, which is the only region a wrapper
    // could occupy.
    const hero = landing.indexOf('minHeight="100svh"');
    const mount = landing.indexOf("<HeroVideo />");
    expect(hero).toBeGreaterThan(-1);
    expect(mount).toBeGreaterThan(hero);
    const between = landing.slice(hero, mount);
    expect(between).not.toMatch(/<Reveal\b/);
    expect(between).not.toMatch(/<LazySection\b/);
    expect(landing.match(/<HeroVideo \/>/g)).toHaveLength(1);
  });

  it("renders the still first, so the server has an answer and the box never shifts", () => {
    // `useState(false)` then a mount effect: the picture is what SSR sends and
    // the film is the client upgrade. Seeding this from the media query would
    // put a <video> in the server's HTML for someone who asked for no motion.
    expect(film).toMatch(/useState\(false\)/);
    expect(film).toMatch(/setPlay\(!reducedMotion\(\)\)/);
  });

  it("fills the fold instead of being capped inside it", () => {
    // The film covers its hero, and the hero is the box it is absolute against.
    // Miss the second and `inset: 0` resolves against whatever ancestor happens
    // to be positioned — which is not a crash, just a film somewhere else.
    expect(film).toMatch(/\.hz-film \{ position: absolute; inset: 0; \}/);
    expect(film).toMatch(/object-fit: cover/);
    expect(landing).toMatch(/position="relative" overflow="hidden" minHeight="100svh"/);

    // The old cap is gone from BOTH sides. Left in the stylesheet it is dead
    // weight that reads as live sizing; left on the mount it silently shrinks
    // the film back again.
    expect(css).not.toContain(".hz-fold");
    expect(landing).not.toContain("hz-fold");
    expect(film).not.toContain("maxWidth");
  });
});
