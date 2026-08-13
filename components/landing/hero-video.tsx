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
// The film COVERS its hero: absolute, inset 0, `object-fit: cover`. It was a
// capped box instead, and the cap is why it rendered as a 432px thumbnail on a
// 1440x900 screen and, before that, below the fold entirely — where a browser
// will not autoplay it at all. The hero (app/page.tsx) is the positioned box
// this fills; nothing here decides a width.

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
        .hz-film { position: absolute; inset: 0; }
        .hz-film .frame {
          position: absolute; inset: 0; width: 100%; height: 100%;
          overflow: hidden; background: var(--background);
        }
        .hz-film .frame > * {
          position: absolute; inset: 0; width: 100%; max-width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        /* The film IS the fold, so the copy sits ON it and has to stay readable
           over whatever frame is playing. A scrim, not a dimmed video: dimming
           the film costs the picture everywhere, while this only pays where the
           text is — dense behind the words, clear at the edges. */
        .hz-film::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          /* Phone: the frame is cropped to its centred square and the copy sits
             over it, so the scrim runs top-to-bottom and goes near-black under
             the words. */
          background:
            linear-gradient(to bottom, rgba(0,0,0,.25) 0%, rgba(0,0,0,.08) 24%, rgba(0,0,0,.58) 56%, rgba(0,0,0,.96) 82%, rgba(0,0,0,1) 100%);
        }
        /* Wide: the copy is pinned LEFT and the film's subject sits centre-right,
           so they no longer occupy the same pixels — which is the whole reason
           this reads at full bleed. The scrim turns horizontal to match: opaque
           where the sentence is, clear across the picture, and a short vertical
           wash at the foot so the composer's dock has ground to sit on. */
        @media (min-width: 1024px) {
          .hz-film::after {
            background:
              linear-gradient(to right, rgba(0,0,0,.97) 0%, rgba(0,0,0,.88) 26%, rgba(0,0,0,.45) 44%, rgba(0,0,0,0) 62%),
              linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,.85) 100%);
          }
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
