'use client';

import { SizableText, XStack, YStack, H1, Paragraph } from '@hanzo/ui';
import Link from 'next/link';
import { HanzoBrand } from '@/components/HanzoLogo';
import { screen } from '@/lib/chrome';

/**
 * 404 — Next.js renders this for any unmatched route. Server component (no
 * client state), true-black monochrome to match /login: the canonical HanzoBrand
 * lockup, a plain heading, one white pill back home, one ghost link to the
 * dashboard.
 */
export default function NotFound() {
  return (
    <XStack {...screen} backgroundColor="$background" paddingHorizontal="$5" paddingVertical="$11">
      <YStack width="100%" maxWidth={448}>
        <XStack justifyContent="center" marginBottom="$7">
          <HanzoBrand
            color="var(--foreground)"
            markSize={44}
            wordmarkSize={30}
  />
        </XStack>

        <H1 fontSize="$11" fontWeight="500" marginBottom="$4" letterSpacing={-0.4} textAlign="center">This page doesn&apos;t exist</H1>
        <Paragraph color="$color11" fontSize="$6" marginBottom="$7" textAlign="center">The link may be out of date, or the page may have moved. Everything you have built is in your dashboard.</Paragraph>

        <XStack alignItems="center" justifyContent="center" gap="$4">
          <Link
            href="/"
          ><SizableText paddingHorizontal="$4.5" paddingVertical="$2.5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" color="$color12" borderRadius="$6" fontWeight="500" fontSize="$3" hoverStyle={{ backgroundColor: "$color6" }}>
            Go to the home page
          </SizableText></Link>
          <Link
            href="/dashboard"
          ><SizableText fontSize="$3" color="$color" hoverStyle={{ color: "$color" }}>
            Open your dashboard
          </SizableText></Link>
        </XStack>
      </YStack>
    </XStack>
  );
}
