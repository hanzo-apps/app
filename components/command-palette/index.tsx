'use client';

/**
 * ⌘K command palette — the ONE fast switcher for hanzo.app.
 *
 * The bar itself is `Palette` from `@hanzo/ui/product` now: the dialog, the
 * cursor, the grouping and the matching rule are the package's, so hanzo.app,
 * console and chat stop being three hand-rolled palettes that disagree. What
 * stays here is the only part that is genuinely this app's — its projects, its
 * navigation, and the live preview panel, which the package takes as its
 * right-hand slot.
 *
 * Three groups, and the third is the point:
 *
 *   Recent projects  the org-scoped /v1/projects list, ordered by what this
 *                    browser most recently opened (lib/recent-projects), with a
 *                    RIGHT-side preview of the highlighted row.
 *   Navigate to      this app's own pages. Local commands: no route behind them,
 *                    so they are the only ones that must be declared by hand.
 *   Run              EVERY operation the cloud answers, from /v1/commands. Not
 *                    written down here and not curated here — see
 *                    hooks/useCommands.
 *
 * The safety rule that makes a 2,323-operation bar usable lives in the package
 * (`@hanzo/ui/product` → match.ts): GET commands match fuzzily, every other
 * method needs an exact `service operation` prefix, and no route shows on an
 * empty query. So opening ⌘K still shows projects and navigation exactly as it
 * did, and typing is what reaches the API.
 *
 *   ↵     open the highlighted project in the builder (/dev?project=<slug>), or
 *         run the highlighted command
 *   ⌘↵    open the highlighted project's published site
 */

import { XStack, SizableText, YStack, H3, Anchor } from '@hanzo/gui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, type Op } from '@hanzo/ui/product';
import { toast } from '@hanzo/ui';
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
import { useCommands } from '@/hooks/useCommands';
import { run } from '@/lib/run';
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

const PROJECTS = 'Recent projects';
const NAVIGATE = 'Navigate to';

/** The pages this app has. Nothing routes them, so they are declared. */
const NAV: Array<Op & { route: string }> = [
  { id: 'nav:dashboard', group: NAVIGATE, label: 'Dashboard', route: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'nav:new', group: NAVIGATE, label: 'Create new project', route: '/dev', icon: <Plus size={16} /> },
  { id: 'nav:resources', group: NAVIGATE, label: 'Resources', route: '/resources', icon: <Sparkles size={16} /> },
  { id: 'nav:connectors', group: NAVIGATE, label: 'Connectors', route: '/connectors', icon: <Plug size={16} /> },
  { id: 'nav:docs', group: NAVIGATE, label: 'Documentation', route: '/docs', icon: <BookOpen size={16} /> },
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
  const { ops: commands, find } = useCommands();
  const [active, setActive] = useState('');

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

  // One list, three kinds of row. The package groups by `group` in this order
  // and decides which survive the search; a project and a fleet operation differ
  // only in whether they carry a `method`.
  const ops = useMemo<Op[]>(
    () => [
      ...projects.map((p) => ({
        id: `project:${p.slug}`,
        group: PROJECTS,
        label: p.name,
        icon: <FolderOpen size={16} />,
        end: <StatusDot status={p.status} />,
      })),
      ...NAV,
      ...commands,
    ],
    [projects, commands],
  );

  // Default the highlighted row when the palette opens / the list changes.
  useEffect(() => {
    if (!open) return;
    setActive(projects.length ? `project:${projects[0].slug}` : 'nav:dashboard');
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
    () => projects.find((p) => `project:${p.slug}` === active) ?? null,
    [projects, active],
  );

  // Three kinds of row, three executors, one callback — which is what lets a
  // local command and a fleet operation sit in one list.
  const onRun = useCallback(
    (op: Op) => {
      const project = projects.find((p) => `project:${p.slug}` === op.id);
      if (project) {
        openProject(project);
        return;
      }

      const nav = NAV.find((n) => n.id === op.id);
      if (nav) {
        onOpenChange(false);
        router.push(nav.route);
        return;
      }

      const command = find(op.id);
      if (!command) return;
      onOpenChange(false);
      // The answer is a sentence either way: `run` translates a refusal through
      // lib/gateway, so a 403 says it is permission and never "try again".
      void run(command).then(({ ok, message }) =>
        ok ? toast.success(message) : toast.error(message),
      );
    },
    [projects, openProject, onOpenChange, router, find],
  );

  // ⌘↵ opens the highlighted project's PUBLISHED site; plain ↵ is the package's
  // own onSelect. Only the meta/ctrl case is intercepted, and only for a project.
  useEffect(() => {
    if (!open || !activeProject) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        openPublished(activeProject);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, activeProject, openPublished]);

  return (
    <Palette
      open={open}
      onOpenChange={onOpenChange}
      ops={ops}
      onRun={onRun}
      active={active}
      onActive={setActive}
      placeholder="Search projects and commands…"
      title="Search projects and commands"
      footer={<Hints />}
    >
      <PreviewPanel project={activeProject} authorName={user?.name || user?.fullname || '—'} />
    </Palette>
  );
}

function Hints() {
  return (
    <>
      <XStack alignItems="center" gap="$1.5">
        <SizableText fontSize={11} color="$color11">Open published project</SizableText>
        <kbd>
          <CommandIcon size={12} />
          <CornerDownLeft size={12} />
        </kbd>
      </XStack>
      <XStack alignItems="center" gap="$1.5">
        <SizableText fontSize={11} color="$color11">Open project</SizableText>
        <kbd>
          <CornerDownLeft size={12} />
        </kbd>
      </XStack>
    </>
  );
}

function StatusDot({ status }: { status: string }) {
  const st = statusOf(status);
  return (
    <XStack alignItems="center" gap="$1" marginLeft="auto">
      <Circle size={6} color={st.text} />
      <SizableText fontSize={10} letterSpacing={0.4} color={st.text}>{st.label}</SizableText>
    </XStack>
  );
}

function PreviewPanel({ project, authorName }: { project: PaletteProject | null; authorName: string }) {
  if (!project) {
    return (
      <XStack height="100%" alignItems="center" justifyContent="center" padding="$5">
        <SizableText textAlign="center" fontSize="$3" color="$color11">Highlight a project to preview it.</SizableText>
      </XStack>
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
          <XStack key={k} alignItems="center" justifyContent="space-between" gap="$2">
            <SizableText fontSize="$1" color="$color11">{k}</SizableText>
            <SizableText fontSize="$1" numberOfLines={1} color="$color">{v}</SizableText>
          </XStack>
        ))}
      </YStack>
      <Anchor display="inline-flex"
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
