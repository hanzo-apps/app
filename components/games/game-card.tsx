'use client';

/**
 * GameCard — one entry in the /games grid. Fully derived from the catalog row:
 * engine badge, genre, license, target families, and an honest play affordance.
 * The whole card links to the title's detail page; a "Play" pill appears only
 * when a WebGL build is hosted for the title.
 */

import Link from 'next/link';
import { Badge } from '@hanzo/ui';
import { Gamepad2, Monitor, Smartphone, Globe, Play } from 'lucide-react';
import type { GameEntry, GameEngine } from '@/data/games-catalog';
import { isPlayable } from '@/data/games-catalog';
import { targetFamilies } from '@/components/games/targets';

const ENGINE_LABEL: Record<GameEngine, string> = {
  unity: 'Unity',
  unreal: 'Unreal',
};

const FAMILY_ICON = { web: Globe, desktop: Monitor, mobile: Smartphone } as const;

export function GameCard({ game }: { game: GameEntry }) {
  const playable = isPlayable(game);
  const families = targetFamilies(game.targets);
  return (
    <Link
      href={`/games/${game.id}`}
      data-testid="game-card"
      aria-label={`${game.name} — ${game.genre}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all hover:-translate-y-1 hover:border-white/50"
    >
      {/* Header band — engine + play status */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
          <Gamepad2 className="h-4 w-4 text-neutral-400" aria-hidden />
          {ENGINE_LABEL[game.engine]}
          <span className="text-neutral-600">{game.engineVersion}</span>
        </span>
        {playable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-black">
            <Play className="h-3 w-3 fill-black" aria-hidden />
            Play
          </span>
        ) : (
          <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-400">
            {game.targets.includes('webgl') ? 'WebGL-ready' : 'Desktop'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-medium text-white">{game.name}</h3>
          <Badge variant="secondary" className="text-[11px]">
            {game.genre}
          </Badge>
        </div>
        <p className="line-clamp-3 flex-1 text-xs text-neutral-500">{game.description}</p>

        {/* Target families + license */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-400">
            {families.map((f) => {
              const Icon = FAMILY_ICON[f];
              return <Icon key={f} className="h-3.5 w-3.5" aria-label={f} />;
            })}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-600">
            {game.license}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default GameCard;
