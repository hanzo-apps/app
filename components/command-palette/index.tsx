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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@hanzo/ui';
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
import { builderLink } from '@/lib/api/projects';
import { markProjectOpened, lastOpenedAt, recentProjectIds } from '@/lib/recent-projects';
import { relativeTime } from '@/lib/projects-view';

interface PaletteProject {
  id: string;
  slug: string;
  name: string;
  org?: string;
  status: string;
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
        className="max-w-2xl overflow-hidden border-white/10 bg-neutral-950 p-0 text-white gap-0"
      >
        <DialogTitle className="sr-only">Search projects and commands</DialogTitle>
        <Command
          value={activeValue}
          onValueChange={setActiveValue}
          onKeyDown={handleKeyDown}
          className="bg-transparent [&_[cmdk-group-heading]]:text-white/40"
        >
          <CommandInput
            placeholder="Search projects and commands…"
            className="text-white placeholder:text-white/30"
          />
          <div className="flex min-h-[320px]">
            {/* Left: results */}
            <CommandList className="max-h-[320px] w-1/2 border-r border-white/10 py-1">
              <CommandEmpty className="text-white/40">No results found.</CommandEmpty>

              {projects.length > 0 && (
                <CommandGroup heading="Recent projects">
                  {projects.map((p) => (
                    <CommandItem
                      key={p.slug}
                      value={`project:${p.slug}`}
                      onSelect={() => openProject(p)}
                      className="gap-2 text-white/80 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <FolderOpen className="h-4 w-4 text-white/50" />
                      <span className="truncate">{p.name}</span>
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
                    className="gap-2 text-white/80 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <c.icon className="h-4 w-4 text-white/50" />
                    <span>{c.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>

            {/* Right: live preview of the highlighted project */}
            <div className="w-1/2">
              <PreviewPanel project={activeProject} authorName={user?.name || user?.fullname || '—'} />
            </div>
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 border-t border-white/10 px-3 py-2 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              Open published project
              <kbd className="inline-flex items-center gap-0.5 rounded border border-white/15 bg-white/5 px-1 py-0.5">
                <CommandIcon className="h-3 w-3" />
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
            </span>
            <span className="flex items-center gap-1.5">
              Open project
              <kbd className="inline-flex items-center rounded border border-white/15 bg-white/5 px-1 py-0.5">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function StatusDot({ status, className }: { status: string; className?: string }) {
  const live = status === 'live' || status === 'published';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide ${
        live ? 'text-emerald-400' : 'text-white/35'
      } ${className ?? ''}`}
    >
      <Circle className={`h-1.5 w-1.5 ${live ? 'fill-emerald-400' : 'fill-white/35'}`} />
      {live ? 'Live' : 'Draft'}
    </span>
  );
}

function PreviewPanel({ project, authorName }: { project: PaletteProject | null; authorName: string }) {
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/30">
        Highlight a project to preview it.
      </div>
    );
  }
  const opened = lastOpenedAt(project.slug || project.id);
  const rows: Array<[string, string]> = [
    ['Created by', authorName],
    ['Status', project.status === 'live' || project.status === 'published' ? 'Live' : 'Draft'],
    ['Created', relativeTime(project.createdAtIso)],
    ['Last edited', relativeTime(project.updatedAtIso)],
    ['Last opened', opened ? relativeTime(new Date(opened).toISOString()) : '—'],
  ];
  const initial = (project.name || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-full flex-col p-4">
      {/* Thumbnail — an honest monogram tile (we don't fabricate a screenshot). */}
      <div className="relative mb-3 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.01]">
        <span className="text-3xl font-medium text-white/70">{initial}</span>
        <span className="absolute bottom-2 left-2 truncate font-mono text-[10px] text-white/40">
          {project.slug}
        </span>
      </div>
      <h3 className="truncate text-sm font-medium text-white">{project.name}</h3>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 text-xs">
            <dt className="text-white/40">{k}</dt>
            <dd className="truncate text-white/70">{v}</dd>
          </div>
        ))}
      </dl>
      <a
        href={publishedUrl(project.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1 pt-3 font-mono text-[11px] text-white/40 transition-colors hover:text-white"
      >
        {project.slug}.hanzo.app
        <ArrowUpRight className="h-3 w-3" />
      </a>
    </div>
  );
}

export default CommandPalette;
