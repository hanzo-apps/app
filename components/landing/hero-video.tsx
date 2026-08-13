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
// THE STILL IS WHAT THE SERVER SENDS. It is the hero visual now, so it has to
// be there in the first bytes — and the still is the only answer a server pass
// can give, because whether motion is welcome is a media query it cannot read.
// So every path renders the picture first and the film replaces it on mount,
// which costs nothing (the swap is invisible) and settles two things at once:
// the box never shifts, and reduced motion never fetches the megabyte. A paused
// player would still download it, so respecting the preference means no <video>
// at all.
//
// The width is NOT decided here. The film has one mount, and how big it may be
// is a question about the fold around it — `.hz-fold` in assets/globals.css.

import { useEffect, useState } from "react";
import { YStack } from "@hanzo/ui";

const POSTER = "/hero.jpg";
const FILM = "/hero.mp4";
const ALT =
  "The Hanzo builder: one prompt becomes a running app, published to a live URL.";

function reducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export default function HeroVideo() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    setPlay(!reducedMotion());
  }, []);

  return (
    <YStack width="100%" className="hz-film">
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

      {/* No caption. It read "One prompt, built and published on Hanzo Cloud"
          and it labelled the film from below — which worked when the film was
          the thing past the fold, and stopped working when the film became the
          first thing on the page: the label then landed between the picture
          and the pill, two mono micro-lines deep, saying what the subline four
          lines down already says in full. The picture is introduced by the
          sentence under it now. */}
      <YStack className="frame">
        {!play ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={POSTER} alt={ALT} fetchPriority="high" />
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
    </YStack>
  );
}
