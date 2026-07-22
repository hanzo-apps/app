'use client';

import { useMemo, useState } from 'react';
import { Badge, Input } from '@hanzo/ui';
import { Gamepad2, Search } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { GameCard } from '@/components/games/game-card';
import { gamesCatalog, genreList } from '@/data/games-catalog';

export default function GamesCatalog() {
  const [genre, setGenre] = useState('All');
  const [query, setQuery] = useState('');

  const genres = useMemo(() => genreList(gamesCatalog), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return gamesCatalog.filter((g) => {
      const matchesGenre = genre === 'All' || g.genre === genre;
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.engine.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q);
      return matchesGenre && matchesSearch;
    });
  }, [genre, query]);

  return (
    <AppShell currentView="games">
      <div className="flex-1 overflow-y-auto bg-background text-foreground">
        {/* Hero */}
        <header className="border-b border-border bg-gradient-to-b from-card to-background">
          <div className="container mx-auto px-6 py-10">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-card">
                <Gamepad2 className="h-6 w-6 text-foreground" />
              </div>
              <h1 className="text-3xl font-medium">Games</h1>
              <Badge variant="secondary" className="ml-1">
                {gamesCatalog.length} titles
              </Badge>
            </div>
            <p className="mb-6 max-w-2xl text-muted-foreground">
              Fork a real game, play WebGL builds in the browser, and generate assets with
              the studio pipeline. Every title runs on the same Hanzo gateway and identity as
              the rest of your workspace.
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto flex flex-wrap items-center gap-3 px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search games…"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                className="w-64 border-border bg-card pl-9 text-foreground"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    genre === g
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} shown
            </Badge>
          </div>
        </div>

        {/* Grid */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">No games match your search.</p>
              <button
                onClick={() => {
                  setGenre('All');
                  setQuery('');
                }}
                className="mt-2 text-foreground underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
