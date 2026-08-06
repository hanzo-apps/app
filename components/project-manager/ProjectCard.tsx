'use client';

import { YStack, XStack, SizableText, H3, Paragraph } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { useRouter } from 'next/navigation';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, buttonVariants } from '@hanzo/ui';
import { Pencil, Trash2, MoreVertical, ExternalLink, Globe, Settings } from 'lucide-react';
import { builderLink, configLink, liveUrlOf, type Project } from '@/lib/api/projects';
import { statusOf } from '@/lib/project-status';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

function timeAgo(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const status = statusOf(project.status);
  // The SERVABLE public URL — normalizes any legacy two-label liveUrl to the
  // bare <slug>.hanzo.app host that actually resolves.
  const visitUrl = liveUrlOf(project);

  return (
    <YStack group borderWidth={1} borderColor="$borderColor" borderRadius="$5" backgroundColor="$background" hoverStyle={{ elevation: 4, borderColor: "$color06" }}>
      <YStack padding="$4" paddingBottom="$3">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
          <XStack alignItems="center" gap="$2" minWidth={0} flex={1}>
            <SizableText height="$2.5" width="$2.5" borderRadius="$10" flexShrink={0} backgroundColor={status.dot} />
            <H3 fontWeight="500" fontSize="$4" numberOfLines={1}>{project.name}</H3>
          </XStack>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" height={28} width={28} flexShrink={0}>
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => router.push(builderLink(project.slug, project.org))}>
                <Pencil size={16} />
                Edit in builder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(configLink(project.slug, project.org))}>
                <Settings size={16} />
                Configure
              </DropdownMenuItem>
              {visitUrl && (
                <DropdownMenuItem onClick={() => window.open(visitUrl, '_blank', 'noopener')}>
                  <ExternalLink size={16} />
                  Visit site
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(project)}>
                <Trash2 size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </XStack>

        <XStack marginTop="$2" alignItems="center" gap="$1.5">
          <Globe size={14} />
          <SizableText textTransform="capitalize" fontSize="$1" color="$color11">{project.framework || 'static'}</SizableText>
          <SizableText marginHorizontal="$1" fontSize="$1" color="$color11">·</SizableText>
          <SizableText fontSize="$1" color="$color11">{status.label}</SizableText>
        </XStack>

        {project.description && (
          <Paragraph marginTop="$2" fontSize="$3" color="$color11" numberOfLines={2}>{project.description}</Paragraph>
        )}
      </YStack>

      <XStack borderTopWidth={1} paddingHorizontal="$4" paddingVertical="$3" alignItems="center" justifyContent="space-between">
        <SizableText fontSize="$1" color="$color11">Updated {timeAgo(project.updatedAt)}</SizableText>
        <XStack gap="$1">
          <Button
            size="sm"
            variant="ghost"
            height={28} paddingHorizontal="$2"
            onClick={() => router.push(builderLink(project.slug, project.org))}
          >
            <Pencil size={12} />
            <SizableText fontSize="$1">Edit</SizableText>
          </Button>
          {visitUrl && (
            // Plain anchor, NOT the shared Button with `asChild`: the @hanzo/ui
            // Button wraps its children in an array for the loading slot, which
            // trips Radix Slot's React.Children.only when it renders as a Slot.
            // See components/editor/cross-surface-links.tsx for the same footgun.
            <Anchor
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              height={28} paddingHorizontal="$2" fontSize="$1" className={`${buttonVariants({ size: 'sm', variant: 'ghost' })}`}
            >
              <ExternalLink size={12} />
              Visit
            </Anchor>
          )}
        </XStack>
      </XStack>
    </YStack>
  );
}
