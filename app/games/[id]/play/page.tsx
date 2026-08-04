'use client';

import { SizableText, Paragraph, XStack, YStack } from '@hanzo/gui';
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
      <SizableText minHeight="100%" backgroundColor="$background" color="$color" display="flex" flexDirection="column">
        <Header />
        <SizableText flex={1} flexDirection="column" alignItems="center" justifyContent="center" gap="$4" backgroundColor="$background" color="$color" display="flex">
          <Paragraph fontSize="$6" color="$color11">
            {game ? `${game.name} has no in-browser build.` : 'Game not found.'}
          </Paragraph>
          <Link href={game ? `/games/${game.id}` : '/games'}><SizableText color="$color" textDecorationLine="underline">
            Back
          </SizableText></Link>
        </SizableText>
        <SiteFooter />
      </SizableText>
    );
  }

  return (
    <SizableText minHeight="100%" backgroundColor="$background" color="$color" display="flex" flexDirection="column">
      <Header />
      <SizableText flex={1} flexDirection="column" backgroundColor="$background" color="$color" display="flex">
        <XStack alignItems="center" gap="$4" borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$5" paddingVertical="$3">
          <Link
            href={`/games/${game.id}`}
          ><SizableText alignItems="center" gap="$1.5" fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}>
            <ArrowLeft size={16} />
            {game.name}
          </SizableText></Link>
          {isPlaceholderBuild(game) && (
            <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$0.5" fontSize={11} color="$color11">
              placeholder build
            </SizableText>
          )}
        </XStack>
        <YStack minHeight={0} flex={1} padding="$4">
          <GamePlayer gameId={game.id} title={game.name} />
        </YStack>
      </SizableText>
      <SiteFooter />
    </SizableText>
  );
}
