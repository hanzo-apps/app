'use client';

// The ONE full-viewport loading/redirect state: the brand mark on its idle
// breathe (hanzo-logo-idle, reduced-motion-safe, assets/globals.css) over a
// single line of copy. Every page-level auth/loading gate renders THIS —
// no per-page logo + spinner re-tunes.
//
// The mark's breathe is the ONLY motion here, deliberately: it is the thing that
// says "still working", and it says it without a second widget to place, size
// and colour on every gate. /auth/callback was the one holdout, and it is the
// reason this file says so out loud now — see that page.
//
// `screen` supplies the measure. Every consumer returns this INSTEAD of
// <AppShell>, so nothing above it has a height to inherit.

import { Paragraph, YStack } from '@hanzo/ui';
import { HanzoLogo } from '@/components/HanzoLogo';
import { screen } from '@/lib/chrome';

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  return (
    <YStack {...screen} gap="$4" backgroundColor="$background" paddingHorizontal="$5">
      <HanzoLogo size={48} className="hanzo-logo-idle" />
      <Paragraph color="$color11" textAlign="center">{children}</Paragraph>
    </YStack>
  );
}
