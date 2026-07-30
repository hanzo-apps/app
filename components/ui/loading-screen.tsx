'use client';

// The ONE full-viewport loading/redirect state: the brand mark on its idle
// breathe (hanzo-logo-idle, reduced-motion-safe, assets/globals.css) over a
// single line of copy. Every page-level auth/loading gate renders THIS —
// no per-page logo + spinner re-tunes.

import { Paragraph, YStack } from '@hanzo/gui';
import { HanzoLogo } from '@/components/HanzoLogo';

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  return (
    <YStack minHeight="100%" alignItems="center" justifyContent="center" gap="$4" backgroundColor="$background">
      <HanzoLogo size={48} className="hanzo-logo-idle" />
      <Paragraph color="$color11" textAlign="center">{children}</Paragraph>
    </YStack>
  );
}
