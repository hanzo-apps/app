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
import { Pencil, Trash2, MoreVertical, ExternalLink, Globe, Settings } from 'lucide-react';
import { buttonVariants } from '@hanzo/ui';
import { cn } from '@/lib/utils';
import { builderLink, configLink, liveUrlOf, type Project } from '@/lib/api/projects';
import { statusOf } from '@/lib/project-status';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

function timeAgo(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const status = statusOf(project.status);
  // The SERVABLE public URL — normalizes any legacy two-label liveUrl to the
  // bare <slug>.hanzo.app host that actually resolves.
  const visitUrl = liveUrlOf(project);

  return (
    <div className="group border border-border rounded-lg bg-card hover:shadow-lg hover:border-primary/50 transition-all">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.dot}`} title={status.label} />
            <h3 className="font-medium text-base truncate">{project.name}</h3>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(builderLink(project.slug, project.org))}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit in builder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(configLink(project.slug, project.org))}>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              {visitUrl && (
                <DropdownMenuItem onClick={() => window.open(visitUrl, '_blank', 'noopener')}>
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
            onClick={() => router.push(builderLink(project.slug, project.org))}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {visitUrl && (
            // Plain anchor, NOT the shared Button with `asChild`: the @hanzo/ui
            // Button wraps its children in an array for the loading slot, which
            // trips Radix Slot's React.Children.only when it renders as a Slot.
            // See components/editor/cross-surface-links.tsx for the same footgun.
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: 'sm', variant: 'ghost' }),
                'h-7 px-2 text-xs',
              )}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Visit
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
