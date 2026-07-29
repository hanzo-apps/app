'use client';

import { SizableText, YStack, XStack, H1, Paragraph } from '@hanzo/gui';
import { useMemo, useState } from 'react';
import { Badge, Input, Button } from '@hanzo/ui';
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
      <SizableText flex={1} backgroundColor="$background" color="$color" overflow="scroll" display="flex" flexDirection="column">
        {/* Hero */}
        <YStack borderBottomWidth={1} borderColor="$borderColor">
          <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$7">
            <XStack marginBottom="$3" alignItems="center" gap="$3">
              <XStack height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$5">
                <Gamepad2 size={24} color="$color" />
              </XStack>
              <H1 fontSize="$10" fontWeight="500">Games</H1>
              <Badge variant="secondary" marginLeft="$1">
                {gamesCatalog.length} titles
              </Badge>
            </XStack>
            <Paragraph marginBottom="$5" maxWidth={672} color="$color11">
              Fork a real game, play WebGL builds in the browser, and generate assets with
              the studio pipeline. Every title runs on the same Hanzo gateway and identity as
              the rest of your workspace.
            </Paragraph>
          </YStack>
        </YStack>

        {/* Filters */}
        <YStack position="sticky" top="$0" zIndex={40} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" backdropFilter="blur(8px)">
          <XStack width="100%" maxWidth={1280} alignSelf="center" flexWrap="wrap" alignItems="center" gap="$3" paddingHorizontal="$5" paddingVertical="$3">
            <YStack position="relative">
              <Search size={16} color="$color11" />
              <Input
                placeholder="Search games…"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                width={256} borderColor="$borderColor" backgroundColor="$background" paddingLeft={36} color="$color"
  />
            </YStack>
            <XStack flexWrap="wrap" alignItems="center" gap="$1.5">
              {genres.map((g) => (
                <Button
                  key={g}
                  onClick={() => setGenre(g)}
                  borderRadius="$10" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$1" fontWeight="500" {...{ backgroundColor: genre === g ? "$color12" : "$background", color: genre === g ? "$background" : "$color11", hoverStyle: genre === g ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                >
                  {g}
                </Button>
              ))}
            </XStack>
            <Badge variant="secondary" marginLeft="auto">
              {filtered.length} shown
            </Badge>
          </XStack>
        </YStack>

        {/* Grid */}
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
          <YStack gap="$4.5">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </YStack>

          {filtered.length === 0 && (
            <SizableText paddingVertical="$11" textAlign="center" display="flex" flexDirection="column">
              <Paragraph fontSize="$6" color="$color11">No games match your search.</Paragraph>
              <Button
                onClick={() => {
                  setGenre('All');
                  setQuery('');
                }}
                marginTop="$2" color="$color" textDecorationLine="underline"
              >
                Clear filters
              </Button>
            </SizableText>
          )}
        </YStack>
      </SizableText>
    </AppShell>
  );
}
