'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@hanzo/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@hanzo/ui';
import {
  Eye,
  Settings,
  Trash2,
  MoreVertical,
  Globe,
  Server,
  Brain,
  FileCode,
} from 'lucide-react';
import type { ManagedProject, ProjectStatus, ProjectType } from '@/lib/api/projects';

interface ProjectCardProps {
  project: ManagedProject;
  onView: (project: ManagedProject) => void;
  onSettings: (project: ManagedProject) => void;
  onDelete: (project: ManagedProject) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  active:  { color: 'bg-emerald-500', label: 'Active' },
  paused:  { color: 'bg-amber-500',   label: 'Paused' },
  stopped: { color: 'bg-red-500',     label: 'Stopped' },
};

const TYPE_ICON: Record<ProjectType, React.ReactNode> = {
  'web-app':     <Globe className="h-4 w-4" />,
  'api':         <Server className="h-4 w-4" />,
  'ai-model':    <Brain className="h-4 w-4" />,
  'static-site': <FileCode className="h-4 w-4" />,
};

const TYPE_LABEL: Record<ProjectType, string> = {
  'web-app':     'Web App',
  'api':         'API',
  'ai-model':    'AI Model',
  'static-site': 'Static Site',
};

function ResourceBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const barColor =
    clamped > 80 ? 'bg-red-500' :
    clamped > 60 ? 'bg-amber-500' :
    'bg-emerald-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function ProjectCard({ project, onView, onSettings, onDelete }: ProjectCardProps) {
  const status = STATUS_CONFIG[project.status];

  return (
    <div className="group border border-border rounded-lg bg-card hover:shadow-lg hover:border-primary/50 transition-all">
      {/* Header */}
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
              <DropdownMenuItem onClick={() => onView(project)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSettings(project)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Type badge and description */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {TYPE_ICON[project.type]}
          <span>{TYPE_LABEL[project.type]}</span>
          <span className="mx-1">-</span>
          <span>{project.region}</span>
        </div>

        {project.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Resource usage */}
      <div className="px-4 pb-3 space-y-2">
        <ResourceBar label="CPU" value={project.resources.cpu} />
        <ResourceBar label="Memory" value={project.resources.memory} />
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => onView(project)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => onSettings(project)}
          >
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
