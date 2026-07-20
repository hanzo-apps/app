'use client';

/**
 * ProjectThumb — the ONE honest project thumbnail.
 *
 * A live project renders its REAL published site as a scaled-down desktop
 * preview inside a sandboxed, inert iframe (no cookies, no navigation, no
 * pointer events — `sandbox="allow-scripts"` only). A project without a live
 * deployment falls back to its monogram tile.
 *
 * CRITICAL layout contract: the iframe is ABSOLUTELY positioned at a fixed
 * logical desktop size and scaled with a CSS transform. Absolute positioning
 * takes it OUT of layout flow, so it can never contribute its (large) intrinsic
 * width to a parent grid track — the earlier `w-[400%]` in-flow iframe collapsed
 * every grid to 0-width columns. A ResizeObserver keeps the scale = cellWidth /
 * logicalWidth so the preview always fills its cell at any breakpoint.
 */

import { useEffect, useRef, useState } from 'react';

// The logical viewport the site is rendered at before scaling — a desktop width
// so the thumbnail shows the desktop layout, then scaled down to fit the cell.
const LOGICAL_W = 1280;
const LOGICAL_H = 720; // 16:9, matches aspect-video

export function ProjectThumb({
  name,
  liveUrl,
  className = '',
}: {
  name: string;
  liveUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / LOGICAL_W);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showLive = !!liveUrl && !failed;

  return (
    <div
      ref={hostRef}
      className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br from-white/[0.07] to-transparent ${className}`}
    >
      {showLive ? (
        <iframe
          src={liveUrl!}
          title={`${name} preview`}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          sandbox="allow-scripts"
          scrolling="no"
          onError={() => setFailed(true)}
          // Absolute + fixed logical size + transform scale → never affects the
          // grid track width; visually fills the cell via the ResizeObserver scale.
          className="pointer-events-none absolute left-0 top-0 border-0 bg-white"
          style={{
            width: LOGICAL_W,
            height: LOGICAL_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-4xl font-medium text-white/60">
            {(name || '?').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {/* Click shield — the card owns every interaction. */}
      <div className="absolute inset-0" />
    </div>
  );
}

export default ProjectThumb;
