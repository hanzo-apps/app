'use client';

import { H2, Paragraph, SizableText, Spinner, XStack, YStack } from '@hanzo/ui';
import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '@hanzo/ui';
import { Plus, Search, FolderOpen, Star, User, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  fetchProjects,
  deleteProject as apiDeleteProject,
  type Project,
} from '@/lib/api/projects';
import { ProjectCard } from './ProjectCard';
import { CreateProject } from './CreateProject';
import { OrgSwitcher } from '@/components/org-switcher';
import { useOrg } from '@/lib/org/client';

/**
 * ONE empty state, for every reason a list can be empty.
 *
 * There were going to be five of these — no projects, no search match, and one
 * per sidebar filter — and five hand-written centred columns is how five
 * different paddings and four different tones of voice get into one product.
 * A state is DATA here: an icon, a heading, a line of explanation, and whether
 * the create button belongs on it.
 *
 * The copy is the part that has to be honest. Three of these are filters the
 * data cannot express yet, and each says so in its own words rather than the
 * generic "nothing here yet" — which reads as "you have none of these" and is a
 * different claim entirely.
 */
export interface EmptyState {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Offer to create — only where creating is what the reader is missing. */
  create?: boolean;
  /** This filter cannot be computed, so the list is empty by construction. */
  none?: boolean;
}

export const NO_PROJECTS: EmptyState = {
  icon: FolderOpen,
  title: 'No projects yet',
  body: 'Projects in this organization show up here. Create one and it gets its own files, database and URL.',
  create: true,
};

export const SEARCH_EMPTY: EmptyState = {
  icon: Search,
  title: 'Nothing matches that search',
  body: 'No project here has that name, description or framework.',
};

/**
 * What the sidebar's three filters answer with.
 *
 * `none: true` on all of them is not a placeholder — it is the current truth.
 * A project carries no star, no creator and no sharing (see `Project` in
 * lib/api/projects), so there is no field to select on. Each says what would
 * have to exist for it to fill, so a reader learns the feature is absent rather
 * than concluding they have none.
 */
export const FILTERS: Record<string, EmptyState> = {
  starred: {
    icon: Star,
    title: 'Starring is not here yet',
    body: 'Projects cannot be starred at the moment, so this list has nothing to hold. Every project you have is under All projects.',
    none: true,
  },
  mine: {
    icon: User,
    title: 'Projects do not record who made them yet',
    body: 'This view needs an author on each project, and there is not one. Until then, All projects is the same list.',
    none: true,
  },
  shared: {
    icon: Users,
    title: 'Sharing is not here yet',
    body: 'Projects belong to an organization rather than being shared person to person, so nothing arrives here. Everyone in this org sees the same All projects.',
    none: true,
  },
};

function Empty({ state, onCreate }: { state: EmptyState; onCreate: () => void }) {
  const Icon = state.icon;
  return (
    <YStack alignItems="center" paddingVertical="$10">
      <Icon size={48} />
      <H2 fontSize="$7" fontWeight="500" marginBottom="$2" textAlign="center">
        {state.title}
      </H2>
      <Paragraph color="$color11" marginBottom="$5" textAlign="center" maxWidth={460}>
        {state.body}
      </Paragraph>
      {state.create === true && (
        <Button onClick={onCreate}>
          <Plus size={16} />
          Create a project
        </Button>
      )}
    </YStack>
  );
}

/**
 * The org-scoped projects list — reads the ONE shared `/v1/projects` store
 * (same records console.hanzo.ai shows). Every row belongs to the currently
 * selected org; switching org (top-right) re-scopes the list.
 */
export function ProjectList({ showOrgSwitcher = true }: { showOrgSwitcher?: boolean } = {}) {
  const { ctx } = useOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  /** Which sidebar destination the reader came in through — see FILTERS. */
  const filter = useSearchParams()?.get('filter') ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This also removes the live site.`)) return;
    try {
      await apiDeleteProject(project.slug);
      setProjects((prev) => prev.filter((p) => p.slug !== project.slug));
    } catch (err) {
      alert(err instanceof Error ? err.message : `Could not delete "${project.name}". Try again in a moment.`);
    }
  };

  const handleCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  /**
   * The sidebar links to `/projects?filter=starred|mine|shared`, and this list
   * did not read that param at all — so all three showed the FULL list. That is
   * worse than showing nothing: "Starred" answering with every project you have
   * is a wrong answer delivered confidently.
   *
   * None of the three can be computed today. `Project` (lib/api/projects) has no
   * star flag, no creator and no sharing — cloud does not send them, so there is
   * nothing here to filter on. The honest answer is an empty result with copy
   * that says WHY, which is what EMPTY below carries. It deliberately does not
   * say "no starred projects yet": that would imply you could star one.
   */
  const view = FILTERS[filter] ?? null;

  const filtered = projects.filter((p) => {
    if (view?.none) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      (p.framework ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <XStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <YStack alignItems="center">
          <Spinner size={40} />
          <Paragraph marginTop="$4" fontSize="$3" color="$color11" textAlign="center">Loading projects…</Paragraph>
        </YStack>
      </XStack>
    );
  }

  if (error) {
    return (
      <XStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <YStack maxWidth={384} alignItems="center">
          <Paragraph color="$red9" fontWeight="500" marginBottom="$2" textAlign="center">Could not load your projects</Paragraph>
          <Paragraph fontSize="$3" color="$color11" marginBottom="$4" textAlign="center">{error}</Paragraph>
          <Button variant="outline" onClick={load}>Try again</Button>
        </YStack>
      </XStack>
    );
  }

  return (
    <YStack rowGap="$5">
      {/* Toolbar */}
      {/* Toolbar — the search field grows to a sensible cap and the action
          cluster sits to its right, wrapping beneath only when the row is too
          narrow to hold both. The search glyph rides INSIDE the field via
          `startAdornment` (the one canonical idiom); the old `<Search>`-sibling
          + `paddingLeft` left it floating above the input and, on a phone, the
          New Project button overlapping the field. */}
      <XStack flexWrap="wrap" gap="$3" alignItems="center" justifyContent="space-between">
        <Input
          startAdornment={<Search size={16} />}
          placeholder="Search projects…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          flex={1} minWidth={200} maxWidth={384} backgroundColor="$background"
  />
        <XStack alignItems="center" gap="$2" flexShrink={0}>
          {/* Org selector — suppressed when a parent shell already renders one
              (AppShell's sidebar) so the org control never appears twice. */}
          {showOrgSwitcher && <OrgSwitcher />}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New project
          </Button>
        </XStack>
      </XStack>

      {/* Which org these projects belong to (billing transparency) */}
      {ctx?.currentOrg && (
        <Paragraph fontSize="$1" color="$color11">
          Showing projects in <SizableText fontWeight="500">{ctx.currentOrg}</SizableText>
          {' '}— created and billed to this organization.
        </Paragraph>
      )}

      {filtered.length === 0 ? (
        <Empty
          state={searchQuery ? SEARCH_EMPTY : (view ?? NO_PROJECTS)}
          onCreate={() => setCreateOpen(true)}
        />
      ) : (
        /*
          A GRID, because the cards now lead with a picture of the site.
          Stacked full-width, a 16:10 thumbnail is most of a screen per project
          and the list stops being a list. Cards want to be card-sized.

          `auto-fill` + a 280px floor rather than counted breakpoints: the column
          count follows the space there actually is, so it is right inside the
          app shell, inside a narrowed window, and on a phone (where 280 exceeds
          the width and it falls to one column) without three separate rules
          agreeing with each other. Geometry rides the `style` prop, the way
          TemplateSchematic's does — this app loads no Tailwind, so a utility
          class here would be inert.
        */
        <YStack
          gap="$4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            alignItems: 'start',
          }}
        >
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </YStack>
      )}

      <CreateProject open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </YStack>
  );
}
