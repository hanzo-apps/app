'use client';

import { SizableText, Paragraph, YStack, XStack, H1, Anchor, H2 } from '@hanzo/gui';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Textarea } from '@hanzo/ui';
import {
  Gamepad2,
  Play,
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
  Wand2,
  Github,
  Monitor,
  Smartphone,
  Globe,
  Check,
} from 'lucide-react';
import Header from '@/components/layout/header';
import SiteFooter from '@/components/landing/site-footer';
import {
  getGame,
  studioHref,
  builderHref,
  isPlayable,
  type BuildTarget,
} from '@/data/games-catalog';

const TARGET_ICON: Record<BuildTarget, typeof Globe> = {
  webgl: Globe,
  windows: Monitor,
  mac: Monitor,
  linux: Monitor,
  android: Smartphone,
  ios: Smartphone,
};

function upstreamUrl(upstream: string): string {
  return /^https?:\/\//.test(upstream) ? upstream : `https://github.com/${upstream}`;
}

export default function GameDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const game = getGame(params.id);
  const [ask, setAsk] = useState('');

  if (!game) {
    return (
      <YStack minHeight="100%" backgroundColor="$background">
        <Header />
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" backgroundColor="$background">
          <Paragraph fontSize="$6" color="$color11">Game not found.</Paragraph>
          <Link href="/games"><SizableText color="$color" textDecorationLine="underline">
            Back to games
          </SizableText></Link>
        </YStack>
        <SiteFooter />
      </YStack>
    );
  }

  const playable = isPlayable(game);
  const webglCapable = game.targets.includes('webgl');
  const submitAsk = () => {
    if (!ask.trim()) return;
    router.push(builderHref(game, ask.trim()));
  };

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />
      <YStack flex={1} backgroundColor="$background" overflow="scroll">
        <YStack width="100%" maxWidth={1024} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
          <Link
            href="/games"
          ><XStack marginBottom="$5" alignItems="center" gap="$1.5" group>
            <ArrowLeft size={16} />
            <SizableText fontSize="$3" color="$color11" $group-hover={{ color: "$color" }}>
              Games
            </SizableText>
          </XStack></Link>

          {/* Header */}
          <XStack flexWrap="wrap" alignItems="flex-start" justifyContent="space-between" gap="$4">
            <div>
              <XStack marginBottom="$2" alignItems="center" gap="$2">
                <Gamepad2 size={20} color="$color11" />
                <SizableText fontSize="$3" fontWeight="500">
                  {game.engine[0].toUpperCase() + game.engine.slice(1)} {game.engineVersion}
                </SizableText>
                <Badge variant="secondary">{game.genre}</Badge>
              </XStack>
              <H1 fontSize="$10" fontWeight="500">{game.name}</H1>
              <Paragraph marginTop="$2" maxWidth={672} color="$color11">{game.description}</Paragraph>
            </div>
            {playable && (
              <Button
                gap="$2" backgroundColor="$color12" hoverStyle={{ backgroundColor: "$color12" }}
                onClick={() => router.push(`/games/${game.id}/play`)}
                data-testid="play-button"
              >
                <Play size={16} />
                Play
              </Button>
            )}
          </XStack>

          {/* Spec grid */}
          <YStack marginTop="$6" gap="$4">
            <Spec label="Targets">
              <XStack flexWrap="wrap" alignItems="center" gap="$2">
                {game.targets.map((t) => {
                  const Icon = TARGET_ICON[t];
                  return (
                    <XStack key={t} alignItems="center" gap="$1">
                      <Icon size={16} />
                      <SizableText fontSize="$3">{t}</SizableText>
                    </XStack>
                  );
                })}
              </XStack>
            </Spec>
            <Spec label="License">
              <SizableText fontSize="$3" color="$color">{game.license}</SizableText>
            </Spec>
            <Spec label="Build status">
              <XStack alignItems="center" gap="$1.5">
                {game.buildable && <Check size={16} color="$color" />}
                <SizableText fontSize="$3" color="$color">
                  {playable
                    ? 'WebGL build (placeholder)'
                    : webglCapable
                      ? 'WebGL-capable — build not hosted'
                      : game.buildable
                        ? 'Desktop build'
                        : 'Not buildable'}
                </SizableText>
              </XStack>
            </Spec>
            <Spec label="Upstream">
              <Anchor
                href={upstreamUrl(game.upstream)}
                target="_blank"
                rel="noopener noreferrer"
                alignItems="center" gap="$1" fontSize="$3" color="$color" hoverStyle={{ color: "$color" }}
              >
                <Github size={16} />
                {game.upstream}
                <ArrowUpRight size={14} />
              </Anchor>
            </Spec>
            <Spec label="Hanzo fork">
              {game.fork ? (
                <Anchor
                  href={`https://github.com/${game.fork}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  alignItems="center" gap="$1" fontFamily="$mono" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}
                >
                  {game.fork}
                  <ArrowUpRight size={12} />
                </Anchor>
              ) : (
                <SizableText fontSize="$1" color="$color11">
                  Reference only — {game.forkReason ?? 'license forbids redistribution'}
                </SizableText>
              )}
            </Spec>
            <Spec label="License terms">
              <SizableText fontSize="$1" color="$color11">{game.licenseRestrictions}</SizableText>
            </Spec>
          </YStack>

          {/* No in-browser build — honest note, no fake play / pixel-stream button */}
          {!playable && (
            <Paragraph marginTop="$5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3" fontSize="$3" color="$color11">
              {webglCapable ? (
                <>
                  {game.name} builds to WebGL, but no artifact is hosted yet. A CI job drops the
                  build under <SizableText color="$color11">/webgl/{game.id}/</SizableText> (see the
                  artifact contract) to enable in-browser play.
                </>
              ) : (
                <>
                  {game.name} targets {game.targets.join(', ')} — no in-browser build.
                  Pixel-streaming preview is a render-node feature and is not enabled here.
                </>
              )}
            </Paragraph>
          )}

          {/* Generative hook — studio pipeline */}
          <YStack marginTop="$7" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$5">
            <XStack marginBottom="$4" alignItems="center" gap="$2">
              <Sparkles size={20} color="$color" />
              <H2 fontSize="$6" fontWeight="500">Generate assets</H2>
            </XStack>
            <Paragraph marginBottom="$4" fontSize="$3" color="$color11">
              Open this title in the Hanzo studio pipeline to regenerate its assets.
            </Paragraph>
            {game.assetSlots.length > 0 ? (
              <XStack marginBottom="$4.5" flexWrap="wrap" gap="$2">
                {game.assetSlots.map((slot) => (
                  <SizableText
                    key={slot}
                    borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1" fontSize="$1" textTransform="capitalize" color="$color"
                  >
                    {slot}
                  </SizableText>
                ))}
              </XStack>
            ) : (
              <Paragraph marginBottom="$4.5" fontSize="$1" color="$color11">
                Asset slots are defined in a later catalog pass; studio infers them for now.
              </Paragraph>
            )}
            <a href={studioHref(game)} target="_blank" rel="noopener noreferrer">
              {/* Same defect as the /enterprise CTA: a hand-painted dark-neutral
                  gradient under the default variant's near-black text. */}
              <Button gap="$2">
                <Wand2 size={16} />
                Generate assets in Studio
                <ArrowUpRight size={16} />
              </Button>
            </a>
          </YStack>

          {/* Builder hook — natural-language prompt with the game repo as context */}
          <YStack marginTop="$5" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$5">
            <XStack marginBottom="$4" alignItems="center" gap="$2">
              <Gamepad2 size={20} color="$color" />
              <H2 fontSize="$6" fontWeight="500">Build with AI</H2>
            </XStack>
            <Paragraph marginBottom="$4" fontSize="$3" color="$color11">
              Describe a change and open it in the builder with{' '}
              <SizableText color="$color11">{game.name}</SizableText> as repo context — the same
              gateway-wired flow the editor uses.
            </Paragraph>
            <YStack gap="$3" $sm={{ flexDirection: "row" }}>
              <Textarea
                value={ask}
                onChangeText={(t) => setAsk(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAsk();
                }}
                placeholder="e.g. add a second enemy type and a score multiplier…"
                rows={2}
                data-testid="builder-prompt"
                flex={1} borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3" fontSize="$3" color="$color" placeholderTextColor="$color11" focusStyle={{ borderColor: "$color8", outlineWidth: 0 }}
  />
              <Button
                gap="$2" alignSelf="flex-end"
                onClick={submitAsk}
                disabled={!ask.trim()}
              >
                <Sparkles size={16} />
                Open in builder
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
      <SiteFooter />
    </YStack>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <YStack borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4">
      <Paragraph marginBottom="$1.5" fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={0.8} color="$color11">
        {label}
      </Paragraph>
      {children}
    </YStack>
  );
}
