'use client';

/**
 * ProjectThumb — the ONE honest project thumbnail.
 *
 * A live project renders its REAL published site, scaled down inside a
 * sandboxed, inert iframe (no cookies, no navigation, no pointer events —
 * `sandbox="allow-scripts"` only, so the page can style itself but never act
 * as the user). Nothing is fabricated: a project without a live deployment
 * falls back to its monogram tile. Used by the dashboard grid, the landing
 * "Continue building" cards, and anywhere else a project needs a face.
 */

import { useState } from 'react';

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
  const showLive = !!liveUrl && !failed;

  return (
    <div
      className={`relative aspect-video overflow-hidden bg-gradient-to-br from-white/[0.07] to-transparent ${className}`}
    >
      {showLive ? (
        <>
          <iframe
            src={liveUrl!}
            title={`${name} preview`}
            loading="lazy"
            tabIndex={-1}
            aria-hidden
            sandbox="allow-scripts"
            scrolling="no"
            onError={() => setFailed(true)}
            className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 bg-white"
          />
          {/* Click shield — the card owns every interaction. */}
          <div className="absolute inset-0" />
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-4xl font-medium text-white/60">
            {(name || '?').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export default ProjectThumb;
