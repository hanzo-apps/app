'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@hanzo/ui';
import { Input } from '@hanzo/ui';
import { Plus, Search, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchProjects,
  deleteProject as apiDeleteProject,
  type ManagedProject,
} from '@/lib/api/projects';
import { ProjectCard } from './ProjectCard';
import { CreateProject } from './CreateProject';

interface ProjectListProps {
  /** Called when the user clicks View on a project. */
  onViewProject?: (project: ManagedProject) => void;
  /** Called when the user clicks Settings on a project. */
  onSettingsProject?: (project: ManagedProject) => void;
}

export function ProjectList({ onViewProject, onSettingsProject }: ProjectListProps) {
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (project: ManagedProject) => {
    if (!confirm(`Delete "${project.name}"? This action cannot be undone.`)) return;
    try {
      await apiDeleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const handleView = (project: ManagedProject) => {
    onViewProject?.(project);
  };

  const handleSettings = (project: ManagedProject) => {
    onSettingsProject?.(project);
  };

  const handleCreated = (project: ManagedProject) => {
    setProjects((prev) => [project, ...prev]);
  };

  // Filter by search
  const filtered = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  });

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-sm">
          <p className="text-destructive font-medium mb-2">Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={load}>
            Retry
          </Button>
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
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try a different search term.'
              : 'Create your first project to get started.'}
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
            <ProjectCard
              key={project.id}
              project={project}
              onView={handleView}
              onSettings={handleSettings}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateProject
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
