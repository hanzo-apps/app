'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/header';
import SiteFooter from '@/components/landing/site-footer';
import { GamePlayer } from '@/components/games/game-player';
import { getGame, isPlayable, isPlaceholderBuild } from '@/data/games-catalog';

export default function GamePlay() {
  const params = useParams<{ id: string }>();
  const game = getGame(params.id);

  if (!game || !isPlayable(game)) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background text-foreground">
          <p className="text-lg text-muted-foreground">
            {game ? `${game.name} has no in-browser build.` : 'Game not found.'}
          </p>
          <Link href={game ? `/games/${game.id}` : '/games'} className="text-foreground underline">
            Back
          </Link>
        </div>
        <SiteFooter />
    </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="flex flex-1 flex-col bg-background text-foreground">
        <div className="flex items-center gap-4 border-b border-border px-6 py-3">
          <Link
            href={`/games/${game.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {game.name}
          </Link>
          {isPlaceholderBuild(game) && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              placeholder build
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 p-4">
          <GamePlayer gameId={game.id} title={game.name} />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
