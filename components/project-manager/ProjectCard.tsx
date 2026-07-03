'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@hanzo/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@hanzo/ui';
import { Pencil, Trash2, MoreVertical, ExternalLink, Globe } from 'lucide-react';
import { builderLink, type Project, type ProjectStatus } from '@/lib/api/projects';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  draft:    { color: 'bg-slate-400',   label: 'Draft' },
  building: { color: 'bg-amber-500',   label: 'Building' },
  live:     { color: 'bg-emerald-500', label: 'Live' },
  error:    { color: 'bg-red-500',     label: 'Error' },
};

function timeAgo(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="group border border-border rounded-lg bg-card hover:shadow-lg hover:border-primary/50 transition-all">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.color}`} title={status.label} />
            <h3 className="font-semibold text-base truncate">{project.name}</h3>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(builderLink(project.slug))}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit in builder
              </DropdownMenuItem>
              {project.liveUrl && (
                <DropdownMenuItem onClick={() => window.open(project.liveUrl, '_blank', 'noopener')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit site
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(project)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span className="capitalize">{project.framework || 'static'}</span>
          <span className="mx-1">·</span>
          <span>{status.label}</span>
        </div>

        {project.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Updated {timeAgo(project.updatedAt)}</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => router.push(builderLink(project.slug))}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {project.liveUrl && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
