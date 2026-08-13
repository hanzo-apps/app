"use client";

// The hero film — and the hero IS the film. There is no headline beside it, no
// pill above it and no subline under it: the film says the whole thing itself,
// in the product's own chrome, copy and typefaces, and anything repeating that
// in HTML would only be saying it twice.
//
// It fills the fold edge to edge. `object-fit: cover` crops it to whatever
// shape the screen is, so the master must be the RIGHT shape to begin with:
// a phone is 0.46 wide-to-tall and a laptop is 1.6, and one master cannot be
// both — covering a 390x844 phone with a 16:9 master shows the middle QUARTER
// of it. So there are two, each composed for its own frame, and the page picks
// by ORIENTATION rather than by width: a 768x1024 tablet is portrait, and
// handing it the wide master would crop 555px off each side.
//
// It does NOT loop. The film ends on the finished app and stays there, so the
// last thing on screen is the product, running.
//
// THE STILL IS WHAT THE SERVER SENDS, and <picture> picks which still without
// a line of JavaScript: motion gets frame 0 — the same picture the film opens
// on, so when the player takes over the swap is invisible — and reduced motion
// gets the FINAL frame instead, the finished app, because that viewer never
// sees the film and the payoff is the one image worth having. Each viewer
// downloads exactly one of the four, and no <video> is ever created for the
// reduced-motion path: a paused player still fetches the megabytes.
//
// Nothing here declares an aspect ratio, and nothing needs to: the box is the
// fold. It is the right size before a byte of media arrives.

import { useEffect, useState } from "react";
import { YStack } from "@hanzo/ui";

const TALL = { film: "/hero-tall.mp4", first: "/hero-tall-first.jpg", last: "/hero-tall-last.jpg" };
const WIDE = { film: "/hero-wide.mp4", first: "/hero-wide-first.jpg", last: "/hero-wide-last.jpg" };

const PORTRAIT = "(orientation: portrait)";
const REDUCE = "(prefers-reduced-motion: reduce)";

// The film's own message, for anyone who cannot watch it — and for anything
// reading the page rather than watching it.
const ALT =
  "Describe your app in a sentence: Hanzo writes it, wires in a database, auth and AI, and ships it — running.";

export default function HeroVideo() {
  const [film, setFilm] = useState<typeof TALL | null>(null);

  useEffect(() => {
    const motion = window.matchMedia?.(REDUCE);
    const portrait = window.matchMedia?.(PORTRAIT);
    // No player at all when motion is unwelcome — the still already answered.
    if (!portrait || motion?.matches) return;
    const pick = () => setFilm(portrait.matches ? TALL : WIDE);
    pick();
    // A phone that turns sideways is a different frame, and the master it was
    // handed is now the wrong shape for it.
    portrait.addEventListener("change", pick);
    return () => portrait.removeEventListener("change", pick);
  }, []);

  return (
    <YStack position="relative" width="100%" minHeight="100svh" backgroundColor="$background" className="hz-hero">
      <style>{`
        /* The <img> is inside <picture>, so this cannot be a child selector —
           picture itself lays out nothing and is not positioned, which is why
           the image still anchors to the fold box. */
        .hz-hero img, .hz-hero video {
          position: absolute; inset: 0;
          width: 100%; max-width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
      `}</style>

      {film ? (
        <video
          src={film.film}
          poster={film.first}
          aria-label={ALT}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
      ) : (
        <picture>
          <source media={`${REDUCE} and ${PORTRAIT}`} srcSet={TALL.last} />
          <source media={REDUCE} srcSet={WIDE.last} />
          <source media={PORTRAIT} srcSet={TALL.first} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WIDE.first} alt={ALT} fetchPriority="high" />
        </picture>
      )}
    </YStack>
  );
}
