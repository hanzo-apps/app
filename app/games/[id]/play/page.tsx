'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { GamePlayer } from '@/components/games/game-player';
import { getGame, isPlayable } from '@/data/games-catalog';

export default function GamePlay() {
  const params = useParams<{ id: string }>();
  const game = getGame(params.id);

  if (!game || !isPlayable(game)) {
    return (
      <AppShell currentView="games">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black text-white">
          <p className="text-lg text-neutral-400">
            {game ? `${game.name} has no in-browser build.` : 'Game not found.'}
          </p>
          <Link href={game ? `/games/${game.id}` : '/games'} className="text-white underline">
            Back
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentView="games">
      <div className="flex flex-1 flex-col bg-black text-white">
        <div className="flex items-center gap-4 border-b border-neutral-900 px-6 py-3">
          <Link
            href={`/games/${game.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {game.name}
          </Link>
          {game.playable === 'placeholder' && (
            <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-400">
              placeholder build
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 p-4">
          <GamePlayer gameId={game.id} title={game.name} />
        </div>
      </div>
    </AppShell>
  );
}
