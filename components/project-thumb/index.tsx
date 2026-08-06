'use client';

/**
 * ProjectThumb — the ONE honest live-site thumbnail.
 *
 * Anything with a live URL renders its REAL deployed site as a scaled-down
 * desktop preview inside a sandboxed, inert iframe (no navigation, no pointer
 * events). Used for published projects AND for the template gallery's live
 * demos; without a live URL it renders `fallback` (default: a monogram tile).
 *
 * CRITICAL layout contract: the iframe is ABSOLUTELY positioned at a fixed
 * logical desktop size and scaled with a CSS transform. Absolute positioning
 * takes it OUT of layout flow, so it can never contribute its (large) intrinsic
 * width to a parent grid track — the earlier `w-[400%]` in-flow iframe collapsed
 * every grid to 0-width columns. A ResizeObserver keeps scale = boxWidth /
 * logicalWidth, and the logical HEIGHT is derived from the measured box, so the
 * preview fills any aspect the caller sizes it to (16/9 cards, 16/10 heroes).
 */

import { YStack, XStack, SizableText } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// The logical viewport the site is rendered at before scaling — a desktop width
// so the thumbnail shows the desktop layout, then scaled down to fit the box.
const LOGICAL_W = 1280;

export function ProjectThumb({
  name,
  liveUrl,
  fallback,
  aspect = 16 / 9,
  className = '',
}: {
  name: string;
  liveUrl?: string | null;
  /** Rendered when there is no live URL (or the frame fails). */
  fallback?: ReactNode;
  /**
   * Box shape when the parent doesn't set a height (cards: 16/9, heroes: 16/10).
   *
   * A RATIO, not a class name. This was `'aspect-video'` — a Tailwind utility,
   * in an app that no longer loads Tailwind — so it named a shape and delivered
   * none. Anywhere the parent supplied a height that went unnoticed; where the
   * parent did not, `height="100%"` resolved against an auto-height box and the
   * thumbnail collapsed to 0. In the ⌘K palette that read as a stray horizontal
   * rule across the detail pane: the container's own top and bottom hairlines,
   * with nothing left between them.
   */
  aspect?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<GuiElement>(null);
  const [box, setBox] = useState({ scale: 0.25, h: 720 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !('scrollTo' in el) || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setBox({ scale: w / LOGICAL_W, h: (el.clientHeight * LOGICAL_W) / w });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showLive = !!liveUrl && !failed;

  return (
    <YStack
      ref={hostRef}
      position="relative" height="100%" width="100%" aspectRatio={aspect} overflow="hidden" className={className}
    >
      {showLive ? (
        <iframe
          src={liveUrl!}
          title={`${name} preview`}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          // `allow-same-origin` is REQUIRED, not a relaxation: without it the
          // frame gets an opaque origin and any site that touches localStorage
          // on boot throws before first paint (measured — the `kinetic` demo
          // rendered a blank 3-node document). The framed host is always a
          // DIFFERENT origin than this app, so restoring its own origin gives it
          // nothing it doesn't already have when visited directly: it still
          // cannot script this page, and hanzo.app's session cookie is host-only
          // (no Domain=), so a subdomain can never read it. Top-level navigation,
          // forms, popups and modals all stay denied.
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          onError={() => setFailed(true)}
          // Absolute + fixed logical size + transform scale → never affects the
          // grid track width; visually fills the box via the ResizeObserver scale.
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: 0,
            top: 0,
            border: 0,
            background: "#fff",
            width: LOGICAL_W,
            height: box.h,
            transform: `scale(${box.scale})`,
            transformOrigin: 'top left',
          }}
  />
      ) : (
        fallback ?? (
          <XStack height="100%" alignItems="center" justifyContent="center">
            <SizableText fontSize="$11" fontWeight="500" color="$color11">
              {(name || '?').charAt(0).toUpperCase()}
            </SizableText>
          </XStack>
        )
      )}
      {/* Click shield — the card owns every interaction. */}
      <YStack position="absolute" top={0} right={0} bottom={0} left={0} />
    </YStack>
  );
}

export default ProjectThumb;
