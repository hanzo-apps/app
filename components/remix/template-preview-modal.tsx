'use client';

/**
 * Template preview modal — the first step of the remix flow.
 *
 * A large preview of the template (its real screenshot rendered big, with a link
 * to the live page), titled with "by Hanzo" and a "Use template" action top-right
 * that advances to the Remix dialog. Games (no screenshot) show a schematic tile
 * and link straight to their existing detail page instead.
 */

import { XStack, YStack, H2, Paragraph, Image, SizableText, Anchor } from '@hanzo/gui';
import { Dialog, DialogContent, DialogTitle, Button } from '@hanzo/ui';
import { ExternalLink, Sparkles, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import type { ResourceItem } from '@/lib/resources-catalog';

export function TemplatePreviewModal({
  item,
  open,
  onOpenChange,
  onUse,
}: {
  item: ResourceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (item: ResourceItem) => void;
}) {
  if (!item) return null;
  const isGame = item.kind === 'game';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth={768} overflow="hidden" borderColor="$borderColor" backgroundColor="$background" padding="$0">
        <DialogTitle position="absolute" width={1} height={1} overflow="hidden">{item.title} preview</DialogTitle>

        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" gap="$3" borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$4.5" paddingVertical="$3">
          <YStack minWidth={0}>
            <H2 numberOfLines={1} fontSize="$4" fontWeight="500">{item.title}</H2>
            <Paragraph fontSize="$1" color="$color11">
              {isGame ? `by Hanzo · ${item.framework}` : 'by Hanzo'}
            </Paragraph>
          </YStack>
          {isGame ? (
            <Link href={item.href || '#'} onClick={() => onOpenChange(false)}>
              <Button size="sm" gap="$1.5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}>
                <Gamepad2 size={16} />
                Open game
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              gap="$1.5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}
              onClick={() => onUse(item)}
            >
              <Sparkles size={16} />
              Use template
            </Button>
          )}
        </XStack>

        {/* Preview body */}
        <YStack padding="$4.5">
          <YStack position="relative" overflow="hidden" aspectRatio={16 / 10} borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
            {item.hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <Image
                src={item.image}
                alt={`${item.title} preview`}
                height="100%" width="100%" objectFit="cover" objectPosition="top"
  />
            ) : (
              <YStack height="100%" alignItems="center" justifyContent="center" gap="$2">
                <Gamepad2 size={40} />
                <SizableText fontSize="$3">{item.framework}</SizableText>
                {item.meta && <SizableText fontSize="$1" color="$color11">{item.meta}</SizableText>}
              </YStack>
            )}
          </YStack>

          <XStack marginTop="$4" alignItems="flex-start" justifyContent="space-between" gap="$4">
            <Paragraph fontSize="$3" color="$color11">{item.description}</Paragraph>
            {item.previewUrl && (
              <Anchor display="inline-flex"
                href={item.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                flexShrink={0} alignItems="center" gap="$1" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}
              >
                Live preview
                <ExternalLink size={12} />
              </Anchor>
            )}
          </XStack>
        </YStack>
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePreviewModal;
