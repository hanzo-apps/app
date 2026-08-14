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
    expect(hero.indexOf("Describe your app.")).toBeLessThan(hero.indexOf("<HeroPreview"));
  });

  it("mounts the product frame exactly once, in the fold", () => {
    expect(landing.match(/<HeroPreview/g)).toHaveLength(1);
    expect(landing.indexOf("<HeroPreview")).toBeLessThan(landing.indexOf("── Below the fold"));
  });

  it("does not put the frame to sleep behind LazySection", () => {
    // LazySection defers a subtree until it is scrolled to; the hero is what
    // the page opens with, so a deferred hero renders nothing at all on arrival.
    const hero = landing.slice(landing.indexOf("── Hero"), landing.indexOf("── Below the fold"));
    expect(hero).not.toMatch(/<LazySection\b/);
  });

  it("keeps ONE composer, riding the bottom of the viewport", () => {
    // The composer pins to the foot of the screen the whole way down and comes
    // to rest in its own flow slot at the end of the page, so the offer to type
    // is never off screen. `.hz-dock` is the whole pinning rule and it takes
    // both halves — the class here and the rule there.
    expect(landing.match(/<BuildComposer/g)).toHaveLength(1);
    expect(landing).toContain('className="hz-dock"');
    expect(css).toContain(".hz-dock");

    // A sticky box pins only while its own flow position is below the viewport
    // — it comes to REST the moment its own slot scrolls in — so the composer
    // must be the LAST thing on the page. Anything placed after it is page a
    // visitor scrolls with no way to type: it sat above the community band and
    // the footer, and settled two sections early, which is silent to the eye
    // that wrote it and obvious to anyone who scrolls to the bottom.
    for (const before of [
      "<HeroPreview",
      "Built on Hanzo.",
      "<PreFooterCTA />",
      "<SiteFooter />",
    ]) {
      expect(landing.indexOf(before)).toBeLessThan(landing.indexOf("<BuildComposer"));
    }

    // `100svh` and not `vh`: a phone's URL bar moves the large unit, so the
    // hero would resize under the fold it is supposed to own.
    const hero = landing.slice(landing.indexOf("── Hero"), landing.indexOf("── Below the fold"));
    expect(hero).toMatch(/minHeight="100svh"/);
  });

  it("shows the product, and never the address of the page you are on", () => {
    // A visitor reading this is already on hanzo.app. An "<app>.hanzo.app" in
    // the frame's address strip is the site telling them where they are, and it
    // puts a domain in front of the product it exists to show. What the strip
    // carries is the demo app's NAME, which now comes from the storyline
    // playing rather than from a constant.
    //
    // Measured against the code that RENDERS, with comments stripped: the rule
    // is written down a few lines above the data it governs, and a check that
    // reads prose fails on its own explanation.
    const code = frame.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toContain("hanzo.app");
    expect(code).not.toContain("your-app");
    expect(code).toContain("{story.name}");
  });

  it("cycles several examples through ONE renderer", () => {
    const code = frame.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

    // A storyline is DATA. Adding a sixth example must be an entry in STORIES
    // and nothing else — the hand-authored demo app it replaced was a component
    // per example, which is how a demo comes to show one thing forever.
    expect(code).toContain("const STORIES: readonly Story[]");
    expect(code.match(/function App\(/g)).toHaveLength(1);
    expect(code.match(/<App story=\{story\}/g)).toHaveLength(2); // desktop + phone

    const wires = code.match(/wire: "[^"]+"/g) ?? [];
    expect(wires.length).toBeGreaterThanOrEqual(4);
    // Base is the through-line: every hanzo.app project gets the data plane, so
    // every example says so, and each one lands on a further real primitive.
    for (const wire of wires) expect(wire).toContain("Base");

    // Finishing an example starts the next, and a frame nobody is looking at
    // parks instead of playing to an empty room.
    expect(code).toMatch(/run\(i \+ 1\)/);
    expect(code).toContain("pending.current");
  });

  it("carries the honesty INSIDE the picture, and offers to build it", () => {
    // The caption under the frame said what the picture already showed and
    // edited nothing; the "Demo" tag rides the address strip instead, beside
    // the app's name. The link that replaced the caption does the one thing a
    // caption cannot: it hands the example's prompt to the page's composer
    // (behaviour pinned in tests/unit/hero-recreate.test.tsx).
    expect(frame).not.toContain("watch the builder build");
    expect(frame).toContain(">Demo</SizableText>");
    expect(frame).toContain("ask(story.steps[0].prompt)");
  });

  it("draws the frame in HTML, so it is sharp at every width", () => {
    // Not a film: no <video>, no master to fetch, nothing to crop. The old
    // full-bleed treatment and its four stills are gone with it.
    expect(landing).not.toContain("HeroVideo");
    expect(landing).not.toContain("hero-tall");
    expect(frame).not.toContain("<video");
  });
});
