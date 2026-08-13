/**
 * The hero film plays by itself, once, for people who want motion.
 *
 * Autoplay is not one flag: a browser refuses it unless the element is BOTH
 * muted and inline, so dropping either one leaves a hero that silently never
 * starts — no error, no warning, a still frame forever on every phone. Those
 * two are pinned here beside `autoplay` for exactly that reason.
 *
 * `loop` is pinned ABSENT, and that is a product decision rather than a
 * preference: the film ends on the finished app and holds there, so the last
 * thing on screen is the product. Looping would take the visitor back to an
 * empty composer every twelve seconds.
 *
 * The reduced-motion branch is pinned as an ABSENT <video>, not a paused one.
 * A paused player still fetches the file, so "respecting" the preference with
 * `autoPlay={!reduce}` would cost the megabytes and animate nothing.
 */
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import "@testing-library/jest-dom";

import HeroVideo from "@/components/landing/hero-video";

import { WithGui } from "../gui-wrapper";

/**
 * jsdom has no matchMedia, and this component asks it two different questions.
 * Answering only the one the test is about would make the other read false and
 * quietly exercise the landscape branch on every case.
 */
function media({ reduce = false, portrait = false } = {}) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduce : portrait,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const mount = () =>
  render(
    <WithGui>
      <HeroVideo />
    </WithGui>,
  );

describe("the hero film", () => {
  it("autoplays muted and inline, and does not loop", () => {
    media();
    const { container } = mount();

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    // Properties, because React sets these on the element rather than emitting
    // an attribute — asserting the attribute would pass on a broken player.
    expect(video!.autoplay).toBe(true);
    expect(video!.muted).toBe(true);
    expect(video!.loop).toBe(false);
    // playsInline IS an attribute, and it is the other half of the autoplay
    // permission on iOS.
    expect(video!.hasAttribute("playsinline")).toBe(true);
  });

  it("plays the master that matches the screen's ORIENTATION", () => {
    // Width would be the wrong question: a 768x1024 tablet is portrait, and the
    // wide master covering it loses 555px off each side.
    media({ portrait: true });
    const tall = mount().container.querySelector("video")!;
    expect(tall.getAttribute("src")).toBe("/hero-tall.mp4");
    expect(tall.getAttribute("poster")).toBe("/hero-tall-first.jpg");

    media({ portrait: false });
    const wide = mount().container.querySelector("video")!;
    expect(wide.getAttribute("src")).toBe("/hero-wide.mp4");
    expect(wide.getAttribute("poster")).toBe("/hero-wide-first.jpg");
  });

  it("posters each master on its OWN first frame, so the swap is invisible", () => {
    // The still the server sent and the frame the film opens on have to be one
    // picture; posters crossed between masters would flash a different shape.
    media({ portrait: true });
    const video = mount().container.querySelector("video")!;
    expect(video.getAttribute("poster")).toBe(
      video.getAttribute("src")!.replace(".mp4", "-first.jpg"),
    );
  });

  it("shows a still and no video at all under reduced motion", () => {
    media({ reduce: true });
    const { container } = mount();

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("sends a still and never a player from the server", () => {
    // The claim this component is built on: the first bytes carry a picture, so
    // the fold is painted before hydration and the box never shifts. Rendering
    // it as a string is the only way to see what SSR actually emits — the DOM
    // render below has already run the effect that swaps the player in.
    media();
    const html = renderToStaticMarkup(
      <WithGui>
        <HeroVideo />
      </WithGui>,
    );
    expect(html).toContain("<picture>");
    expect(html).not.toContain("<video");
  });

  it("offers the FINAL frame to reduced motion and frame 0 to everyone else", () => {
    // <picture> decides this with media queries, so it is right in the server's
    // own HTML — before any JavaScript runs, and per viewer. A reduced-motion
    // visitor never sees the film, so the one image they get is the payoff: the
    // finished app. Everyone else gets the frame the film starts on.
    //
    // Mounted under reduced motion because that is the branch where the picture
    // SURVIVES; the markup asserted is the same static block either way.
    media({ reduce: true });
    const sources = [...mount().container.querySelectorAll("source")].map((s) => [
      s.getAttribute("media"),
      s.getAttribute("srcset"),
    ]);
    expect(sources).toEqual([
      ["(prefers-reduced-motion: reduce) and (orientation: portrait)", "/hero-tall-last.jpg"],
      ["(prefers-reduced-motion: reduce)", "/hero-wide-last.jpg"],
      ["(orientation: portrait)", "/hero-tall-first.jpg"],
    ]);
    // The fallback is the wide first frame: every <source> above is a narrowing
    // of it, so the plain <img> has to be the case none of them claimed.
    expect(screen.getByRole("img")).toHaveAttribute("src", "/hero-wide-first.jpg");
  });
});
