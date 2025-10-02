'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/vfs/types';
import { vfs, logger } from '@/lib/vfs';
import { Button } from '@hanzo/ui';
import { Input } from '@hanzo/ui';
import { cn } from '@/lib/utils';
import { ProjectCard } from './project-card';
import {
  Plus,
  Upload,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  FolderOpen,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void;
}

type SortOption = 'updated' | 'created' | 'name';
type ViewMode = 'grid' | 'list';

// Dialog Components
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);

// Select Components
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export function ProjectManager({ onProjectSelect }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      await vfs.init();
      const projectList = await vfs.listProjects();
      const sorted = projectList.sort((a, b) =>
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
      setProjects(sorted);
    } catch (error) {
      logger.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }

    try {
      const project = await vfs.createProject(
        newProjectName.trim().slice(0, 50),
        newProjectDescription.trim().slice(0, 200) || undefined
      );

      setCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      await loadProjects();
      onProjectSelect(project);
    } catch (error) {
      logger.error('Failed to create project:', error);
    }
  };

  const deleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await vfs.deleteProject(project.id);
      await loadProjects();
    } catch (error) {
      logger.error('Failed to delete project:', error);
    }
  };

  const duplicateProject = async (project: Project) => {
    try {
      const newProject = await vfs.duplicateProject(project.id);
      await loadProjects();
      onProjectSelect(newProject);
    } catch (error) {
      logger.error('Failed to duplicate project:', error);
    }
  };

  const exportProject = async (project: Project) => {
    // TODO: Implement export functionality when VFS supports it
    logger.error('Export functionality not yet implemented');
    // try {
    //   const data = await vfs.exportProject(project.id);
    //   const json = JSON.stringify(data, null, 2);
    //   const blob = new Blob([json], { type: 'application/json' });
    //   const url = URL.createObjectURL(blob);

    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = `${project.name.replace(/\s+/g, '-')}-export.json`;
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    // } catch (error) {
    //   logger.error('Failed to export project:', error);
    // }
  };

  const exportProjectAsZip = async (project: Project) => {
    // TODO: Implement ZIP export when VFS supports it
    logger.error('ZIP export functionality not yet implemented');
    // try {
    //   const blob = await vfs.exportProjectAsZip(project.id);
    //   const url = URL.createObjectURL(blob);

    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = `${project.name.replace(/\s+/g, '-')}.zip`;
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    // } catch (error) {
    //   logger.error('Failed to export project as ZIP:', error);
    // }
  };

  const importProject = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        if (file.name.endsWith('.zip')) {
          const imported = await vfs.importProjectFromZip(file);
          await loadProjects();
          onProjectSelect(imported);
        } else {
          const text = await file.text();
          const data = JSON.parse(text);

          if (!data.project || !data.files) {
            throw new Error('Invalid project file');
          }

          const imported = await vfs.importProject(data);
          await loadProjects();
          onProjectSelect(imported);
        }
      } catch (error) {
        logger.error('Failed to import project:', error);
      }
    };

    input.click();
  };

  const sortProjects = (projects: Project[], sortBy: SortOption): Project[] => {
    const sorted = [...projects];
    switch (sortBy) {
      case 'updated':
        return sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      case 'created':
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const filteredProjects = sortProjects(
    projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    sortBy
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 py-3 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hanzo Build Projects</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <Button variant="outline" size="sm" onClick={importProject}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="flex-1 md:w-[180px] bg-card">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-0.5 border rounded-sm p-1 bg-card h-9">
                  <Button
                    size="icon"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-full w-8 rounded-sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    className="h-full w-8 rounded-sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first project to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          ) : (
            <div
              className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}
            >
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={onProjectSelect}
                  onDelete={deleteProject}
                  onExport={exportProject}
                  onExportZip={exportProjectAsZip}
                  onDuplicate={duplicateProject}
                  onUpdate={(updatedProject) => {
                    setProjects(projects.map(p =>
                      p.id === updatedProject.id ? updatedProject : p
                    ));
                  }}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Start a new project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value.slice(0, 50))}
                placeholder="My Awesome Project"
                className="mt-2"
                maxLength={50}
              />
              <span className="text-xs text-muted-foreground">
                {newProjectName.length}/50
              </span>
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value.slice(0, 200))}
                placeholder="A brief description of your project"
                className="mt-2"
                maxLength={200}
              />
              <span className="text-xs text-muted-foreground">
                {newProjectDescription.length}/200
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createProject}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
