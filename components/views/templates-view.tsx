'use client';

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack } from '@hanzo/gui';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TemplateManager } from '@/components/template-manager';
import { TemplateGallery } from '@/components/template-gallery';
import { Sparkles, Package, Users } from 'lucide-react';

interface TemplatesViewProps {
  onProjectSelect?: (project: { id: string }) => void;
  onNavigate?: (view: string) => void;
}

type Mode = 'gallery' | 'custom';

// The in-app Templates view. Gallery mode renders the SAME `TemplateGallery` as
// the public `/gallery` route — one categorized surface over the SEO catalog SOT
// (lib/templates-catalog), no live gallery.hanzo.ai fetch. "My Templates" keeps
// the existing custom/imported template manager. Cards open the detail page
// /templates/<slug>; "Use template" forks into the builder.
export function TemplatesView({ onProjectSelect }: TemplatesViewProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('gallery');

  const handleProjectCreated = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect({ id: projectId });
    } else {
      router.push(`/workspace/${projectId}`);
    }
  };

  return (
    <YStack height="100%" backgroundColor="$background">
      {/* Mode toggle: the curated gallery vs. your imported/built-in templates. */}
      <YStack flexShrink={0} paddingHorizontal="$4.5" paddingTop="$4.5" $sm={{ paddingHorizontal: "$6", paddingTop: "$5" }}>
        <XStack alignSelf="center" maxWidth={1280} alignItems="center">
          <XStack borderRadius="$10" borderWidth={1} borderColor="$borderColor" padding="$0.5">
            <Button
              onClick={() => setMode('gallery')}
              group alignItems="center" gap="$1.5" borderRadius="$10" paddingHorizontal="$3.5" paddingVertical="$1.5" backgroundColor={mode === 'gallery' ? "$color12" : "transparent"}
            >
              <XStack alignItems="center" gap="$1.5">
                <Sparkles size={16} />
                <SizableText fontSize="$3" color={mode === 'gallery' ? "$background" : "$color11"} $group-hover={{ color: mode === 'gallery' ? "$background" : "$color" }}>
                  Gallery
                </SizableText>
              </XStack>
            </Button>
            <Button
              onClick={() => setMode('custom')}
              group alignItems="center" gap="$1.5" borderRadius="$10" paddingHorizontal="$3.5" paddingVertical="$1.5" backgroundColor={mode === 'custom' ? "$color12" : "transparent"}
            >
              <XStack alignItems="center" gap="$1.5">
                <Package size={16} />
                <SizableText fontSize="$3" color={mode === 'custom' ? "$background" : "$color11"} $group-hover={{ color: mode === 'custom' ? "$background" : "$color" }}>
                  My Templates
                </SizableText>
              </XStack>
            </Button>
          </XStack>
          <Link
            href="/community"
          ><XStack marginLeft="auto" alignItems="center" gap="$1.5">
            <Users size={16} />
            <SizableText fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}>
              See what people built
            </SizableText>
          </XStack></Link>
        </XStack>
      </YStack>

      {mode === 'custom' ? (
        <YStack minHeight={0} flex={1}>
          <TemplateManager onProjectCreated={handleProjectCreated} />
        </YStack>
      ) : (
        <YStack minHeight={0} flex={1} overflow="scroll">
          <TemplateGallery />
        </YStack>
      )}
    </YStack>
  );
}
