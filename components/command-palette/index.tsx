'use client';

/**
 * ⌘K command palette — the ONE fast switcher for hanzo.app.
 *
 * Opens on ⌘K (or clicking the sidebar "Search"). Two sections wired to REAL
 * data: "Recent projects" (the org-scoped /v1/projects list, ordered by what
 * this browser most recently opened — see lib/recent-projects) with a live
 * RIGHT-side preview panel (created-by, status, created, last-edited,
 * last-opened), and "Navigate to" (Dashboard, Create new project, Resources,
 * Connectors, Documentation).
 *
 *   ↵     open the highlighted project in the builder (/dev?project=<slug>)
 *   ⌘↵    open its published site (https://<slug>.hanzo.app)
 *
 * Composed from the @hanzo/ui `Command` primitive inside a wide `Dialog` (rather
 * than the stock `CommandDialog`, which doesn't forward `onValueChange` — needed
 * to drive the preview panel from the highlighted row).
 */

import { XStack, SizableText, YStack, H3, Anchor } from '@hanzo/gui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Dialog, DialogContent, DialogTitle } from '@hanzo/ui';
import {
  LayoutDashboard,
  Plus,
  BookOpen,
  Sparkles,
  Plug,
  FolderOpen,
  ArrowUpRight,
  CornerDownLeft,
  Command as CommandIcon,
  Circle,
} from 'lucide-react';

import { useUser } from '@/hooks/useUser';
import { useProjects } from '@/hooks/useProjects';
import { builderLink, liveUrlOf } from '@/lib/api/projects';
import { ProjectThumb } from '@/components/project-thumb';
import { markProjectOpened, lastOpenedAt, recentProjectIds } from '@/lib/recent-projects';
import { relativeTime } from '@/lib/projects-view';
import { statusOf } from '@/lib/project-status';

interface PaletteProject {
  id: string;
  slug: string;
  name: string;
  org?: string;
  status: string;
  liveUrl?: string | null;
  createdAtIso: string | null;
  updatedAtIso: string | null;
}

interface NavCommand {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
}

const NAV_COMMANDS: NavCommand[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { id: 'new', label: 'Create new project', icon: Plus, route: '/dev' },
  { id: 'resources', label: 'Resources', icon: Sparkles, route: '/resources' },
  { id: 'connectors', label: 'Connectors', icon: Plug, route: '/connectors' },
  { id: 'docs', label: 'Documentation', icon: BookOpen, route: '/docs' },
];

/** The public vanity URL a project deploys to (honest — where publish ships). */
function publishedUrl(slug: string): string {
  return `https://${slug}.hanzo.app`;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  // ONE shared, org-scoped project source (hooks/useProjects) — same cloud list
  // the sidebar + dashboard read; a module cache dedupes the fetch.
  const { projects: apiProjects } = useProjects();
  const [activeValue, setActiveValue] = useState('');

  const projects = useMemo<PaletteProject[]>(() => {
    const mapped: PaletteProject[] = apiProjects.map((p) => ({
      id: p.id || p.slug,
      slug: p.slug,
      name: p.name || p.slug,
      org: p.org,
      status: p.status || 'draft',
      liveUrl: liveUrlOf(p),
      createdAtIso: p.createdAt ? new Date(p.createdAt * 1000).toISOString() : null,
      updatedAtIso: p.updatedAt ? new Date(p.updatedAt * 1000).toISOString() : null,
    }));
    // Recently-opened first (real local signal), then most-recently-updated.
    const recency = recentProjectIds();
    const rank = (p: PaletteProject) => {
      const i = recency.indexOf(p.slug);
      return i === -1 ? recency.indexOf(p.id) : i;
    };
    mapped.sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb);
      return (b.updatedAtIso || '').localeCompare(a.updatedAtIso || '');
    });
    return mapped;
  }, [apiProjects]);

  // Default the highlighted row when the palette opens / the list changes.
  useEffect(() => {
    if (!open) return;
    setActiveValue(projects.length ? `project:${projects[0].slug}` : 'nav:dashboard');
  }, [open, projects]);

  const openProject = useCallback(
    (p: PaletteProject) => {
      markProjectOpened(p.slug || p.id);
      onOpenChange(false);
      router.push(builderLink(p.slug || p.id, p.org));
    },
    [onOpenChange, router],
  );

  const openPublished = useCallback(
    (p: PaletteProject) => {
      onOpenChange(false);
      if (typeof window !== 'undefined') {
        window.open(publishedUrl(p.slug), '_blank', 'noopener,noreferrer');
      }
    },
    [onOpenChange],
  );

  const activeProject = useMemo(
    () => projects.find((p) => `project:${p.slug}` === activeValue) ?? null,
    [projects, activeValue],
  );

  // ⌘↵ opens the highlighted project's PUBLISHED site; plain ↵ is handled by
  // cmdk's onSelect (opens in the builder). We intercept only the meta/ctrl case.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (activeProject) {
        e.preventDefault();
        e.stopPropagation();
        openPublished(activeProject);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        maxWidth={672} overflow="hidden" borderColor="$borderColor" backgroundColor="$background" padding="$0" color="$color" gap="$0"
      >
        <DialogTitle position="absolute" width={1} height={1} overflow="hidden">Search projects and commands</DialogTitle>
        <Command
          value={activeValue}
          onValueChange={setActiveValue}
          onKeyDown={handleKeyDown}
          backgroundColor="transparent" className="[&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <CommandInput
            placeholder="Search projects and commands…"
            color="$color" placeholderTextColor="$color11"
  />
          <XStack minHeight={320}>
            {/* Left: results */}
            <CommandList maxHeight={320} width="50%" borderRightWidth={1} borderColor="$borderColor" paddingVertical="$1">
              <CommandEmpty color="$color11">No results found.</CommandEmpty>

              {projects.length > 0 && (
                <CommandGroup heading="Recent projects">
                  {projects.map((p) => (
                    <CommandItem
                      key={p.slug}
                      value={`project:${p.slug}`}
                      onSelect={() => openProject(p)}
                      gap="$2" color="$color" className="data-[selected=true]:bg-accent data-[selected=true]:text-foreground"
                    >
                      <FolderOpen size={16} color="$color11" />
                      <SizableText numberOfLines={1}>{p.name}</SizableText>
                      <StatusDot status={p.status} className="ml-auto" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup heading="Navigate to">
                {NAV_COMMANDS.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`nav:${c.id}`}
                    onSelect={() => {
                      onOpenChange(false);
                      router.push(c.route);
                    }}
                    gap="$2" color="$color" className="data-[selected=true]:bg-accent data-[selected=true]:text-foreground"
                  >
                    <c.icon size={16} color="var(--muted-foreground)" />
                    <span>{c.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>

            {/* Right: live preview of the highlighted project */}
            <YStack width="50%">
              <PreviewPanel project={activeProject} authorName={user?.name || user?.fullname || '—'} />
            </YStack>
          </XStack>

          {/* Footer hints */}
          <SizableText alignItems="center" gap="$4" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$2" fontSize={11} color="$color11" display="flex" flexDirection="row">
            <SizableText alignItems="center" gap="$1.5">
              Open published project
              <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5">
                <CommandIcon size={12} />
                <CornerDownLeft size={12} />
              </kbd>
            </SizableText>
            <SizableText alignItems="center" gap="$1.5">
              Open project
              <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0.5">
                <CornerDownLeft size={12} />
              </kbd>
            </SizableText>
          </SizableText>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function StatusDot({ status, className }: { status: string; className?: string }) {
  const st = statusOf(status);
  return (
    <SizableText
      alignItems="center" gap="$1" fontSize={10} textTransform="uppercase" letterSpacing={0.4} className={`${st.text} ${className ?? ''}`}
    >
      <Circle size={6} />
      {st.label}
    </SizableText>
  );
}

function PreviewPanel({ project, authorName }: { project: PaletteProject | null; authorName: string }) {
  if (!project) {
    return (
      <SizableText height="100%" alignItems="center" justifyContent="center" padding="$5" textAlign="center" fontSize="$3" color="$color11" display="flex" flexDirection="row">
        Highlight a project to preview it.
      </SizableText>
    );
  }
  const opened = lastOpenedAt(project.slug || project.id);
  const rows: Array<[string, string]> = [
    ['Created by', authorName],
    ['Status', statusOf(project.status).label],
    ['Created', relativeTime(project.createdAtIso)],
    ['Last edited', relativeTime(project.updatedAtIso)],
    ['Last opened', opened ? relativeTime(new Date(opened).toISOString()) : '—'],
  ];
  return (
    <YStack height="100%" padding="$4">
      {/* Thumbnail — the REAL live site (inert, sandboxed) for a published
          project; an honest monogram tile otherwise. */}
      <YStack position="relative" marginBottom="$3" overflow="hidden" borderRadius="$5" borderWidth={1} borderColor="$borderColor">
        <ProjectThumb name={project.name} liveUrl={project.liveUrl} />
        <SizableText position="absolute" bottom="$2" left="$2" numberOfLines={1} borderRadius="$2" backgroundColor="black" paddingHorizontal="$1.5" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="white" backdropFilter="blur(4px)">
          {project.slug}
        </SizableText>
      </YStack>
      <H3 numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{project.name}</H3>
      <YStack marginTop="$3" rowGap="$1.5">
        {rows.map(([k, v]) => (
          <SizableText key={k} alignItems="center" justifyContent="space-between" gap="$2" fontSize="$1" display="flex" flexDirection="row">
            <SizableText color="$color11">{k}</SizableText>
            <SizableText numberOfLines={1} color="$color">{v}</SizableText>
          </SizableText>
        ))}
      </YStack>
      <Anchor
        href={publishedUrl(project.slug)}
        target="_blank"
        rel="noopener noreferrer"
        marginTop="auto" alignItems="center" gap="$1" paddingTop="$3" fontFamily="$mono" fontSize={11} color="$color11" hoverStyle={{ color: "$color" }}
      >
        {project.slug}.hanzo.app
        <ArrowUpRight size={12} />
      </Anchor>
    </YStack>
  );
}

export default CommandPalette;
