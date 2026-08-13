"use client";

// The hero film — 12 seconds, generated with HyperFrames from this product's
// own chrome, copy and typefaces (Geist / Geist Mono on true black): a prompt is
// typed into the composer, the agent streams its work, the app renders in the
// preview, then it publishes to a live URL. Honest by construction — the app in
// the preview is drawn as STRUCTURE, so there is no customer to invent and no
// number to make up, and the URL is the placeholder one (`your-app.hanzo.app`).
//
// The master is 1600x1200, and everything that matters sits inside its centred
// 1200px SQUARE. That is the whole responsive trick: a phone crops the frame to
// 1:1 and loses nothing, a tablet and up sees the entire 4:3. `object-fit:
// cover` performs the crop, and because the frame declares its own
// aspect-ratio at both widths the box is the right size before a byte of video
// arrives — the file landing shifts nothing.
//
// Frame 0 of the film IS the poster, so the still and the first played frame
// are the same picture and the swap is invisible.
//
// Reduced motion gets that still and no <video> at all. A paused player would
// still fetch the megabyte; an image is both the honest answer and the cheap
// one.

import { useEffect, useState } from "react";
import { YStack, Paragraph } from "@hanzo/ui";

const POSTER = "/hero.jpg";
const FILM = "/hero.mp4";
const ALT =
  "The Hanzo builder: one prompt becomes a running app, published to a live URL.";

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export default function HeroVideo() {
  const [still, setStill] = useState(reducedMotion);
  // Read again on mount, so a pass that rendered without a window is corrected
  // rather than left playing at someone who asked for no motion.
  useEffect(() => {
    setStill(reducedMotion());
  }, []);

  return (
    <YStack alignSelf="center" width="100%" maxWidth={920} className="hz-film">
      <style>{`
        .hz-film .frame {
          position: relative; width: 100%; aspect-ratio: 1 / 1;
          border-radius: 1.5rem; overflow: hidden; background: var(--background);
        }
        @media (min-width: 768px) { .hz-film .frame { aspect-ratio: 4 / 3; } }
        .hz-film .frame > * {
          position: absolute; inset: 0; width: 100%; max-width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
      `}</style>

      <YStack className="frame">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={POSTER} alt={ALT} />
        ) : (
          <video
            src={FILM}
            poster={POSTER}
            aria-label={ALT}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
      </YStack>

      <Paragraph
        marginTop="$4"
        textAlign="center"
        fontFamily="$mono"
        fontSize="$1"
        lineHeight="1.4"
        color="$color11"
      >
        One prompt, built and published on Hanzo Cloud
      </Paragraph>
    </YStack>
  );
}
