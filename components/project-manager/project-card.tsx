'use client';

import React, { useState, useEffect } from 'react';
import { Project } from '@/lib/vfs/types';
import { vfs, logger } from '@/lib/vfs';

// Temporary interface until VFS provides ProjectStats
interface ProjectStats {
  fileCount: number;
  totalSize: number;
  lastModified?: Date;
  fileTypes?: Record<string, number>;
  formattedSize?: string;
}
import { Button } from '@hanzo/ui';
import { Input } from '@hanzo/ui';
import {
  Trash2,
  Download,
  Package,
  Edit2,
  Check,
  X,
  Copy,
  Eye,
  FileCode,
  FileText,
  Image,
  MoreVertical,
  FolderOpen,
  HardDrive,
  DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@hanzo/ui';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (project: Project) => void;
  onExport: (project: Project) => void;
  onExportZip: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onUpdate: (project: Project) => void;
  viewMode?: 'grid' | 'list';
}

export function ProjectCard({
  project,
  onSelect,
  onDelete,
  onExport,
  onExportZip,
  onDuplicate,
  onUpdate,
  viewMode = 'grid',
}: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadProjectStats();
  }, [project.id]);

  const loadProjectStats = async () => {
    // TODO: Implement when VFS supports getProjectStats
    setLoadingStats(false);
    // try {
    //   const projectStats = await vfs.getProjectStats(project.id);
    //   setStats(projectStats);
    // } catch (error) {
    //   logger.error('Failed to load project stats:', error);
    // } finally {
    //   setLoadingStats(false);
    // }
  };

  const saveEdits = async () => {
    if (!editedName.trim()) {
      setEditedName(project.name);
      setIsEditing(false);
      return;
    }

    if (editedName.length > 50) {
      return;
    }

    try {
      project.name = editedName.trim();
      await vfs.updateProject(project);
      onUpdate(project);
      setIsEditing(false);
    } catch (error) {
      logger.error('Failed to update project:', error);
      setEditedName(project.name);
    }
  };

  const cancelEdit = () => {
    setEditedName(project.name);
    setIsEditing(false);
  };

  // Get main file types for display (top 3)
  const getMainFileTypes = () => {
    if (!stats || !stats.fileTypes) return [];
    const entries = Object.entries(stats.fileTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    return entries;
  };

  // Get icon for file type
  const getFileTypeIcon = (ext: string) => {
    const lowerExt = ext.toLowerCase();
    if (['html', 'htm'].includes(lowerExt)) return <FileCode className="h-3 w-3" />;
    if (['css', 'scss', 'sass'].includes(lowerExt)) return <FileText className="h-3 w-3" />;
    if (['js', 'jsx', 'ts', 'tsx'].includes(lowerExt)) return <FileCode className="h-3 w-3" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(lowerExt)) return <Image className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  // Format cost display
  const formatCost = (cost?: number) => {
    if (!cost || cost === 0) return null;
    return `$${cost.toFixed(2)}`;
  };

  if (viewMode === 'list') {
    return (
      <div
        className="border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary/50 bg-card"
        onClick={() => onSelect(project)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdits();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="h-7 text-sm"
                    autoFocus
                    maxLength={50}
                  />
                  <span className="text-xs text-muted-foreground">{editedName.length}/50</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={saveEdits}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {project.description && !isEditing && (
                <span className="text-sm text-muted-foreground truncate max-w-md">
                  {project.description}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            {stats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" />
                  {stats.fileCount} files
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  {stats.formattedSize}
                </span>
                {project.costTracking?.totalCost && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCost(project.costTracking.totalCost)}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(project);
                  }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onExportZip(project);
                  }}>
                    <Package className="mr-2 h-4 w-4" />
                    Export as ZIP
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(project);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className="border border-border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 group bg-card"
      onClick={() => onSelect(project)}
    >
      <div className="space-y-3">
        {/* Header with name and actions */}
        <div className="flex justify-between items-start">
          {isEditing ? (
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey === false) {
                      e.preventDefault();
                      saveEdits();
                    }
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="h-8 text-sm font-semibold"
                  autoFocus
                  maxLength={50}
                />
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={saveEdits}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground mt-1">{editedName.length}/50</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <h3 className="font-semibold text-lg truncate flex-1">{project.name}</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDuplicate(project);
              }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onExportZip(project);
              }}>
                <Package className="mr-2 h-4 w-4" />
                Export as ZIP
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(project);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <div className="min-h-[40px]">
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">
              No description
            </p>
          )}
        </div>

        {/* Stats */}
        {loadingStats ? (
          <div className="h-6 bg-muted animate-pulse rounded" />
        ) : stats && (
          <>
            <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t">
              <span className="flex items-center gap-1">
                <FolderOpen className="h-4 w-4" />
                {stats.fileCount} {stats.fileCount === 1 ? 'file' : 'files'}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="h-4 w-4" />
                {stats.formattedSize}
              </span>
              {project.costTracking?.totalCost && project.costTracking.totalCost > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCost(project.costTracking.totalCost)}
                </span>
              )}
            </div>

            {/* File types */}
            {getMainFileTypes().length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                {getMainFileTypes().map(([ext, count]) => (
                  <div key={ext} className="flex items-center gap-1 text-muted-foreground">
                    {getFileTypeIcon(ext)}
                    <span>{ext} ({count})</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}</p>
        </div>
      </div>
    </div>
  );
}
