'use client';

import { SizableText, XStack, H1, Paragraph } from '@hanzo/gui';
import Link from 'next/link';
import { HanzoBrand } from '@/components/HanzoLogo';

/**
 * 404 — Next.js renders this for any unmatched route. Server component (no
 * client state), true-black monochrome to match /login: the canonical HanzoBrand
 * lockup, a plain heading, one white pill back home, one ghost link to the
 * dashboard.
 */
export default function NotFound() {
  return (
    <SizableText minHeight="100%" backgroundColor="$background" color="$color" alignItems="center" justifyContent="center" paddingHorizontal="$5" paddingVertical="$11" display="flex" flexDirection="row">
      <SizableText width="100%" maxWidth={448} textAlign="center" display="flex" flexDirection="column">
        <XStack justifyContent="center" marginBottom="$7">
          <HanzoBrand
            color="var(--foreground)"
            markSize={44}
            wordmarkSize={30}
  />
        </XStack>

        <H1 fontSize="$11" fontWeight="500" marginBottom="$4" letterSpacing={-0.4}>404 — page not found</H1>
        <Paragraph color="$color11" fontSize="$6" marginBottom="$7">This page does not exist or has moved.</Paragraph>

        <XStack alignItems="center" justifyContent="center" gap="$4">
          <Link
            href="/"
          ><SizableText paddingHorizontal="$4.5" paddingVertical="$2.5" backgroundColor="$color12" color="$background" borderRadius="$6" fontWeight="500" fontSize="$3" hoverStyle={{ backgroundColor: "$color12" }}>
            Back to Hanzo
          </SizableText></Link>
          <Link
            href="/dashboard"
          ><SizableText fontSize="$3" color="$color" hoverStyle={{ color: "$color" }}>
            Go to dashboard
          </SizableText></Link>
        </XStack>
      </SizableText>
    </SizableText>
  );
}
