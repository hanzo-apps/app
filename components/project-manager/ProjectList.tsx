'use client';

import { XStack, SizableText, Paragraph, YStack, H2 } from '@hanzo/ui';
import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '@hanzo/ui';
import { Plus, Search, FolderOpen } from 'lucide-react';
import {
  fetchProjects,
  deleteProject as apiDeleteProject,
  type Project,
} from '@/lib/api/projects';
import { ProjectCard } from './ProjectCard';
import { CreateProject } from './CreateProject';
import { OrgSwitcher } from '@/components/org-switcher';
import { useOrg } from '@/lib/org/client';
import { Spinner } from '@/components/ui/spinner';

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
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
      alert(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const handleCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  const filtered = projects.filter((p) => {
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
          <Paragraph color="$red9" fontWeight="500" marginBottom="$2" textAlign="center">Error</Paragraph>
          <Paragraph fontSize="$3" color="$color11" marginBottom="$4" textAlign="center">{error}</Paragraph>
          <Button variant="outline" onClick={load}>Retry</Button>
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
            New Project
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
        <YStack alignItems="center" paddingVertical="$10">
          <FolderOpen size={48} />
          <H2 fontSize="$7" fontWeight="500" marginBottom="$2" textAlign="center">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </H2>
          <Paragraph color="$color11" marginBottom="$5" textAlign="center">
            {searchQuery ? 'Try a different search term.' : 'Create your first project to get started.'}
          </Paragraph>
          {!searchQuery && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Create Project
            </Button>
          )}
        </YStack>
      ) : (
        <YStack gap="$4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </YStack>
      )}

      <CreateProject open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </YStack>
  );
}
