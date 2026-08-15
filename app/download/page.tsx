'use client'

import { H1, Paragraph, YStack } from '@hanzo/gui'

import Header from '@/components/layout/header'
import { SurfaceCard } from '@/components/download/surface-card'
import { LEAD, REST } from '@/data/downloads'

/**
 * /download — every way to get Hanzo, on one page.
 *
 * This is the ONE download page. hanzo.ai/download forwards here rather than
 * keeping a second copy, and the shared `@hanzogui/shell` registry that every
 * surface links its "Download" through resolves to that forward — so one page
 * answers for the whole estate.
 *
 * A surface is on this page iff something real is behind it. The builds come
 * from `data/releases.json`, resolved against the actual releases on every
 * build, so a platform that stopped publishing stops rendering instead of
 * becoming a button that 404s. There is deliberately no mobile card: no iOS or
 * Android build exists yet, and a tile that apologises for itself is worse than
 * an honest absence.
 */
export default function DownloadPage() {
  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />

      {/* `width="100%"` is load-bearing on every centred column here: without it
          `alignSelf="center"` is shrink-to-fit and `maxWidth` caps a width the
          column never takes, which is how three sections on the landing page
          came to be silently narrow. */}
      <YStack paddingHorizontal="$4" paddingTop="$8" paddingBottom="$10" $md={{ paddingHorizontal: '$6', paddingTop: '$10' }}>
        <YStack alignSelf="center" width="100%" maxWidth={1152} gap="$8">
          <YStack gap="$4" maxWidth={720}>
            <H1 fontSize="$11" fontWeight="500" lineHeight="1.05" letterSpacing={-0.5} color="$color" $md={{ fontSize: 56 }}>
              Get Hanzo everywhere you work.
            </H1>
            <Paragraph fontSize="$5" lineHeight="1.55" color="$color11">
              One account, one key. Install the coding agent, the desktop app and the
              extensions — or open the workspaces that need nothing installed at all.
            </Paragraph>
          </YStack>

          <SurfaceCard surface={LEAD} lead />

          {/* A plain div, not a YStack: every style gui compiles is an atomic
              class at the same specificity as this one, and gui.css is imported
              last — so `display: grid` on a gui element loses on load order and
              the cards stack on top of each other. Every other grid in this app
              is a bare div for the same reason. */}
          <div className="surface-grid">
            {REST.map((s) => (
              <SurfaceCard key={s.id} surface={s} />
            ))}
          </div>
        </YStack>
      </YStack>
    </YStack>
  )
}
