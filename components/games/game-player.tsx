'use client';

/**
 * GamePlayer — in-browser play for a WebGL/HTML5 game build.
 *
 * Same sandboxing pattern as the builder's live preview (components/preview/
 * live-preview.tsx): the content runs inside a sandboxed <iframe> and owns its
 * own canvas + engine runtime. We only point the iframe at the build's loader
 * `index.html`; the engine (Unity WebGL, Godot HTML5) does the rest.
 *
 * `allow-scripts allow-same-origin` is required so the WebGL runtime can stream
 * its `.wasm` and read its data files; we deliberately do NOT grant allow-forms
 * or allow-popups — a game build needs neither.
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { webglBuildPath } from '@/data/games-catalog';

interface GamePlayerProps {
  /** Catalog id — resolves the hosted build at webglBuildPath(id). */
  gameId: string;
  title: string;
}

export function GamePlayer({ gameId, title }: GamePlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const src = webglBuildPath(gameId);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-neutral-800 bg-black">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black text-neutral-400">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-sm">Loading {title}…</p>
        </div>
      )}
      <iframe
        data-testid="game-player-frame"
        src={src}
        title={`${title} — play`}
        onLoad={() => setLoaded(true)}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin"
        allow="autoplay; fullscreen; gamepad"
      />
    </div>
  );
}

export default GamePlayer;
