'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@hanzo/ui';
import { Input } from '@hanzo/ui';
import { Plus, Search, FolderOpen, Loader2 } from 'lucide-react';
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
 * The org-scoped projects list — reads the ONE shared `/v1/projects` store
 * (same records console.hanzo.ai shows). Every row belongs to the currently
 * selected org; switching org (top-right) re-scopes the list.
 */
export function ProjectList() {
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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading projects…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-sm">
          <p className="text-destructive font-medium mb-2">Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Org selector — every project belongs to the selected org */}
          <OrgSwitcher />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Which org these projects belong to (billing transparency) */}
      {ctx?.currentOrg && (
        <p className="text-xs text-muted-foreground">
          Showing projects in <span className="font-medium">{ctx.currentOrg}</span>
          {' '}— created and billed to this organization.
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? 'Try a different search term.' : 'Create your first project to get started.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CreateProject open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </div>
  );
}
