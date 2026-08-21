'use client';

import { YStack, XStack, SizableText, H3, Paragraph } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { useRouter } from 'next/navigation';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@hanzo/ui';
import { Pencil, Trash2, MoreVertical, ExternalLink, Globe, Settings, Star } from 'lucide-react';
import { builderLink, configLink, liveUrlOf, type Project } from '@/lib/api/projects';
import { statusOf } from '@/lib/project-status';
import { useState } from 'react';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
  onToggleStar: (project: Project) => void;
}

function timeAgo(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function ProjectCard({ project, onDelete, onToggleStar }: ProjectCardProps) {
  const router = useRouter();
  const status = statusOf(project.status);
  // The SERVABLE public URL — normalizes any legacy two-label liveUrl to the
  // bare <slug>.hanzo.app host that actually resolves.
  const visitUrl = liveUrlOf(project);
  // No capture yet, or none possible — the frame stays empty rather than
  // inventing something to fill it.
  const [broken, setBroken] = useState(false);

  return (
    <YStack group borderWidth={1} borderColor="$borderColor" borderRadius="$5" backgroundColor="$background" overflow="hidden" hoverStyle={{ elevation: 4, borderColor: "$color06" }}>
      {/*
        A project is a SITE, so the card shows a PICTURE OF THE SITE — captured
        from the live URL by Hanzo Crawl (cloud GET /v1/projects/:slug/shot),
        the same headless Chromium the rest of the fleet already runs.

        It used to draw a tinted arrangement of rectangles derived from the slug.
        That is a placeholder that looks like a design and is not one, so the grid
        read as a wall of mockups somebody had invented — which is exactly what it
        was. A drawing that varies by slug is still a drawing.

        NOTHING IS INVENTED WHEN THERE IS NO PICTURE. A project that never
        deployed, a capture that failed, a crawl service that is down: all of them
        404, `broken` flips, and the frame renders EMPTY. An empty frame says
        "there is nothing to show yet", which is true. A generated one says "this
        is what it looks like", which is not.

        16:10 is the shape of a browser window and the capture is taken at
        1280x800 — the same ratio, so it lands without distortion. `top` because a
        site's identity is in its header; centring a tall page shows whatever
        happens to be in the middle of it.
      */}
      <YStack
        aria-hidden
        width="100%"
        aspectRatio={16 / 10}
        borderBottomWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color2"
        overflow="hidden"
      >
        {!broken && (
          <img
            src={`/v1/projects/${encodeURIComponent(project.slug)}/shot`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        )}
      </YStack>

      <YStack padding="$4" paddingBottom="$3">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
          <XStack alignItems="center" gap="$2" minWidth={0} flex={1}>
            <SizableText height="$2.5" width="$2.5" borderRadius="$10" flexShrink={0} backgroundColor={status.dot} />
            <H3 fontWeight="500" fontSize="$4" numberOfLines={1}>{project.name}</H3>
            {/* A star has to be visible on the card, or the only way to know a
                project is starred is to open its menu — and the filter would
                look broken to anyone who had not. */}
            {project.starred && <Star size={14} fill="currentColor" aria-label="Starred" />}
          </XStack>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" flexShrink={0}>
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
                <DropdownMenuItem onClick={() => onToggleStar(project)}>
                <Star size={16} />
                {project.starred ? 'Remove star' : 'Star'}
              </DropdownMenuItem>
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
            paddingHorizontal="$2"
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
            // So it wears the ghost look as gui props directly — this app doesn't
            // load Tailwind, so a `buttonVariants` className was inert, which left
            // the icon stacked ABOVE the label with nothing centered. It states
            // `--control-h` (30) itself to stand level with the Edit button.
            <Anchor
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap="$1.5" height={30} paddingHorizontal="$2" borderRadius="$3" fontSize="$1" color="$color11" cursor="pointer" textDecorationLine="none" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
            >
              <ExternalLink size={12} />
              <SizableText fontSize="$1">Visit</SizableText>
            </Anchor>
          )}
        </XStack>
      </XStack>
    </YStack>
  );
}
