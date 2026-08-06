'use client';

/**
 * GameCard — one entry in the /games grid. Fully derived from the catalog row:
 * engine badge, genre, license, target families, and an honest play affordance.
 * The whole card links to the title's detail page; a "Play" pill appears only
 * when a WebGL build is hosted for the title.
 */

import { YStack, XStack, SizableText, H3, Paragraph } from '@hanzo/ui';
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
    ><YStack group height="100%" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" hoverStyle={{ y: "$-1", borderColor: "$color" }}>
      {/* Header band — engine + play status */}
      <XStack alignItems="center" justifyContent="space-between" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3">
        <SizableText display="inline-flex" alignItems="center" gap="$2" fontSize="$3" fontWeight="500" color="$color">
          <Gamepad2 size={16} aria-hidden />
          {ENGINE_LABEL[game.engine]}
          <SizableText color="$color11">{game.engineVersion}</SizableText>
        </SizableText>
        {playable ? (
          <SizableText display="inline-flex" alignItems="center" gap="$1" borderRadius="$10" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$2" paddingVertical="$0.5" fontSize={11} fontWeight="500" color="$color12">
            <Play size={12} aria-hidden />
            Play
          </SizableText>
        ) : (
          <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$0.5" fontSize={11} color="$color11">
            {game.targets.includes('webgl') ? 'WebGL-ready' : 'Desktop'}
          </SizableText>
        )}
      </XStack>

      <YStack flex={1} padding="$4">
        <XStack marginBottom="$1" alignItems="center" gap="$2">
          <H3 fontWeight="500" color="$color">{game.name}</H3>
          <Badge variant="secondary">
            {game.genre}
          </Badge>
        </XStack>
        <Paragraph numberOfLines={3} flex={1} fontSize="$1" color="$color11">{game.description}</Paragraph>

        {/* Target families + license */}
        <XStack marginTop="$3" alignItems="center" justifyContent="space-between">
          <SizableText alignItems="center" gap="$1.5" color="$color11" display="flex" flexDirection="row">
            {families.map((f) => {
              const Icon = FAMILY_ICON[f];
              return <Icon key={f} size={14} aria-label={f} />;
            })}
          </SizableText>
          <SizableText fontFamily="$mono" fontSize={10} letterSpacing={0.4} color="$color11">
            {game.license}
          </SizableText>
        </XStack>
      </YStack>
    </YStack></Link>
  );
}

export default GameCard;
