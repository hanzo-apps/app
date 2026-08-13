/**
 * The hero film plays by itself, and only for people who want motion.
 *
 * Autoplay is not one flag: a browser refuses it unless the element is BOTH
 * muted and inline, so dropping either one leaves a hero that silently never
 * starts — no error, no warning, a poster frame forever on every phone. Those
 * two are pinned here beside `autoplay` and `loop` for exactly that reason.
 *
 * The reduced-motion branch is pinned as an ABSENT <video>, not a paused one.
 * A paused player still fetches the file, so "respecting" the preference with
 * `autoPlay={!reduce}` would cost the megabyte and animate nothing — the still
 * is both the honest answer and the cheap one.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import HeroVideo from "@/components/landing/hero-video";

import { WithGui } from "../gui-wrapper";

function motion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
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
  it("autoplays muted, inline and looping", () => {
    motion(false);
    const { container } = mount();

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    // Properties, because React sets these on the element rather than emitting
    // an attribute — asserting the attribute would pass on a broken player.
    expect(video!.autoplay).toBe(true);
    expect(video!.muted).toBe(true);
    expect(video!.loop).toBe(true);
    // playsInline IS an attribute, and it is the other half of the autoplay
    // permission on iOS.
    expect(video!.hasAttribute("playsinline")).toBe(true);
  });

  it("names one file for the film and one for the still, both same-origin", () => {
    motion(false);
    const { container } = mount();

    const video = container.querySelector("video")!;
    expect(video.getAttribute("src")).toBe("/hero.mp4");
    // The poster is frame 0 of that film, so first paint and playback start are
    // the same picture.
    expect(video.getAttribute("poster")).toBe("/hero.jpg");
  });

  it("shows the still and no video at all under reduced motion", () => {
    motion(true);
    const { container } = mount();

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/hero.jpg");
  });
});
