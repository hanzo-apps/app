'use client'

import { Anchor, Paragraph, SizableText, XStack, YStack } from '@hanzo/gui'
import { ArrowUpRight, Download } from 'lucide-react'

import { weigh, type Build, type Surface } from '@/data/downloads'

/**
 * One surface, as a card: what it is, and every real way to get it.
 *
 * Every action is a real `<a>`. That is the whole focus story — `assets/globals.css`
 * rings any `a[href]` at `var(--focus-ring)` and nothing here may weaken it, so a
 * card gets a visible ring by being built out of links rather than by declaring one.
 */

/** A platform, and the artifact it takes. The row pattern, once. */
function BuildRow({ build }: { build: Build }) {
  const Icon = build.icon
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      paddingVertical="$2.5"
      borderBottomWidth={1}
      borderColor="$color04"
    >
      <XStack alignItems="center" gap="$2.5" flex={1} minWidth={0}>
        {Icon ? <Icon size={16} strokeWidth={1.5} color="var(--text-tertiary)" aria-hidden /> : null}
        <SizableText fontSize="$3" color="$color">
          {build.name}
        </SizableText>
      </XStack>
      <XStack alignItems="center" gap="$3" flexShrink={0}>
        <SizableText fontSize="$1" color="$color11">
          {weigh(build.size)}
        </SizableText>
        <Anchor
          className="hz-tap"
          href={build.url}
          aria-label={`Download ${build.name}`}
          display="flex"
          alignItems="center"
          gap="$1.5"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$color06"
          paddingHorizontal="$3"
          paddingVertical="$1.5"
          hoverStyle={{ backgroundColor: '$color04', borderColor: '$color' }}
        >
          <Download size={13} strokeWidth={2} aria-hidden />
          <SizableText fontSize="$2" fontWeight="500" color="$color">
            Download
          </SizableText>
        </Anchor>
      </XStack>
    </XStack>
  )
}

/** The action a hosted surface carries: it opens, it does not download. */
function Open({ href, label }: { href: string; label: string }) {
  return (
    <Anchor
      className="hz-tap"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      alignSelf="flex-start"
      display="flex"
      alignItems="center"
      gap="$2"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$color06"
      paddingHorizontal="$4"
      paddingVertical="$2.5"
      hoverStyle={{ backgroundColor: '$color04', borderColor: '$color' }}
    >
      <SizableText fontSize="$3" fontWeight="500" color="$color">
        {label}
      </SizableText>
      <ArrowUpRight size={15} strokeWidth={2} aria-hidden />
    </Anchor>
  )
}

export function SurfaceCard({ surface, lead = false }: { surface: Surface; lead?: boolean }) {
  const { name, blurb, version, command, builds, open, all, visual } = surface

  // The lead card lays its copy beside its picture from $lg up; the grid cards
  // stack. One card, two arrangements — not two components.
  // `flexGrow` + `flexBasis: auto`, never `flex={1}`: in gui's flex model
  // `flex: 1` sets `flex-basis: 0`, and in a card that sizes to its contents a
  // base size of 0 IS the size — the card collapses to its padding and the copy
  // paints outside it.
  const body = (
    <YStack
      flexGrow={1}
      flexBasis="auto"
      minWidth={0}
      gap="$4"
      $lg={lead ? { flexBasis: 0 } : undefined}
    >
      <YStack gap="$2">
        <XStack alignItems="center" gap="$3">
          <SizableText fontSize="$7" fontWeight="600" letterSpacing={-0.3} color="$color">
            {name}
          </SizableText>
          {version ? (
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
              {version}
            </SizableText>
          ) : null}
        </XStack>
        <Paragraph fontSize="$3" lineHeight="1.6" color="$color11" maxWidth={52 * 8}>
          {blurb}
        </Paragraph>
      </YStack>

      {command ? (
        <XStack
          alignItems="center"
          gap="$3"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$color04"
          backgroundColor="$color2"
          paddingHorizontal="$3.5"
          paddingVertical="$2.5"
        >
          <SizableText fontFamily="$mono" fontSize="$2" color="$color" flex={1} minWidth={0}>
            {command}
          </SizableText>
        </XStack>
      ) : null}

      {builds?.length ? (
        <YStack>
          {builds.map((b) => (
            <BuildRow key={b.name} build={b} />
          ))}
        </YStack>
      ) : null}

      {open ? <Open href={open.href} label={open.label} /> : null}

      {all ? (
        <Anchor
          className="hz-tap"
          href={all}
          target="_blank"
          rel="noopener noreferrer"
          alignSelf="flex-start"
          display="flex"
          alignItems="center"
        >
          <SizableText fontSize="$2" color="$color11" hoverStyle={{ color: '$color' }}>
            All builds and checksums →
          </SizableText>
        </Anchor>
      ) : null}
    </YStack>
  )

  return (
    <YStack
      width="100%"
      borderRadius={18}
      borderWidth={1}
      borderColor="$color04"
      backgroundColor="$color2"
      padding="$5"
      gap="$5"
      $md={{ padding: '$6' }}
      $lg={lead ? { flexDirection: 'row', alignItems: 'center', padding: '$7', gap: '$8' } : undefined}
    >
      {body}
      {visual ? (
        // `flexBasis: 0` at $lg ONLY, and the axis is the whole reason. From $lg
        // a lead card is a ROW, so basis governs WIDTH: `auto` would take the
        // capture's intrinsic 1920px as the basis and push the page wider than
        // the viewport, and 0 lets the two halves split the row evenly. Below
        // $lg the card is a COLUMN, where basis governs HEIGHT and 0 would
        // flatten the picture to nothing — which is why this is not set at base.
        <YStack
          flexGrow={1}
          flexBasis="auto"
          minWidth={0}
          width="100%"
          $lg={lead ? { flexBasis: 0 } : undefined}
          borderRadius="$4"
          overflow="hidden"
          borderWidth={1}
          borderColor="$color04"
        >
          {/* A real capture. `alt` carries what it shows, because that is the
              one description a reader who cannot see it gets. */}
          <img
            src={visual}
            alt={`${name} in use`}
            style={{ display: 'block', width: '100%', maxWidth: '100%', height: 'auto' }}
          />
        </YStack>
      ) : null}
    </YStack>
  )
}
