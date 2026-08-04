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

import { YStack, Paragraph } from '@hanzo/gui';
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
    <YStack position="relative" height="100%" width="100%" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
      {!loaded && (
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={10} alignItems="center" justifyContent="center" gap="$3" backgroundColor="$background">
          <Loader2 size={32} />
          <Paragraph fontSize="$3" color="$color11">Loading {title}…</Paragraph>
        </YStack>
      )}
      <iframe
        data-testid="game-player-frame"
        src={src}
        title={`${title} — play`}
        onLoad={() => setLoaded(true)}
        style={{ width: "100%", height: "100%" }}
        sandbox="allow-scripts allow-same-origin"
        allow="autoplay; fullscreen; gamepad"
  />
    </YStack>
  );
}

export default GamePlayer;
