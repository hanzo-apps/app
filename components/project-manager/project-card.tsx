'use client';

import { YStack, XStack, SizableText, H3, Paragraph } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Project } from '@/lib/vfs/types';
import { getRuntimeBadge } from '@/lib/runtimes/registry';
import { vfs } from '@/lib/vfs';
import { logger } from '@/lib/utils';
import { Button, Badge, Input, Textarea, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, toast } from '@hanzo/ui';
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
  DollarSign,
  FileBox,
  Server
} from 'lucide-react';
import { ThumbnailArea } from '@/components/ui/thumbnail-area';
import { captureProjectScreenshot } from '@/lib/utils/project-thumbnail';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (project: Project) => void;
  onExport: (project: Project) => void;
  onExportZip: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onPreview: (project: Project) => void;
  onUpdate: (project: Project) => void;
  onExportAsTemplate?: (project: Project) => void;
  onBackend?: (project: Project) => void;
  viewMode?: 'grid' | 'list';
  forceMenuOpen?: boolean;
  highlightExport?: boolean;
}

interface ProjectStats {
  fileCount: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  formattedSize: string;
}

export function ProjectCard({
  project,
  onSelect,
  onDelete,
  onExport,
  onExportZip,
  onDuplicate,
  onPreview,
  onUpdate,
  onExportAsTemplate,
  onBackend,
  viewMode = 'grid',
  forceMenuOpen = false,
  highlightExport = false,
}: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description || '');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadProjectStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const loadProjectStats = async () => {
    try {
      const projectStats = await vfs.getProjectStats(project.id);
      setStats(projectStats);
    } catch (error) {
      logger.error('Failed to load project stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const saveEdits = async () => {
    if (!editedName.trim()) {
      toast.error('Project name cannot be empty');
      setEditedName(project.name);
      setIsEditing(false);
      return;
    }

    if (editedName.length > 50) {
      toast.error('Project name must be 50 characters or less');
      return;
    }

    if (editedDescription.length > 200) {
      toast.error('Description must be 200 characters or less');
      return;
    }

    try {
      project.name = editedName.trim();
      project.description = editedDescription.trim() || undefined;
      await vfs.updateProject(project);
      onUpdate(project);
      setIsEditing(false);
      toast.success('Project updated');
    } catch (error) {
      logger.error('Failed to update project:', error);
      toast.error('Failed to update project');
      setEditedName(project.name);
      setEditedDescription(project.description || '');
    }
  };

  const cancelEdit = () => {
    setEditedName(project.name);
    setEditedDescription(project.description || '');
    setIsEditing(false);
  };

  useEffect(() => {
    if (forceMenuOpen) {
      setMenuOpen(true);
    } else {
      setMenuOpen(false);
    }
  }, [forceMenuOpen]);

  const handleMenuOpenChange = (open: boolean) => {
    if (forceMenuOpen) {
      setMenuOpen(true);
      return;
    }
    setMenuOpen(open);
  };

  // Get main file types for display (top 3)
  const getMainFileTypes = () => {
    if (!stats) return [];
    const entries = Object.entries(stats.fileTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    return entries;
  };

  // Get icon for file type
  const getFileTypeIcon = (ext: string) => {
    const lowerExt = ext.toLowerCase();
    if (['html', 'htm'].includes(lowerExt)) return <FileCode size={12} />;
    if (['css', 'scss', 'sass'].includes(lowerExt)) return <FileText size={12} />;
    if (['js', 'jsx', 'ts', 'tsx'].includes(lowerExt)) return <FileCode size={12} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(lowerExt)) return <Image size={12} />;
    return <FileText size={12} />;
  };

  // Runtime badge display
  const runtime = project.settings?.runtime || 'static';
  const runtimeBadge = getRuntimeBadge(runtime);

  // Format cost display
  const formatCost = (cost?: number) => {
    if (!cost || cost === 0) return null;
    return `$${cost.toFixed(2)}`;
  };

  if (viewMode === 'list') {
    return (
      <YStack
        group borderWidth={1} borderColor="$borderColor" borderRadius="$5" padding="$4" cursor="pointer" hoverStyle={{ elevation: 3, borderColor: "$color12" }}
        style={{ background: `linear-gradient(rgb(var(--tint) / 0.02), rgb(var(--tint) / 0.02)), var(--card)` }}
        onClick={() => onSelect(project)}
      >
        <XStack alignItems="flex-start" gap="$4">
          {/* Preview Thumbnail */}
          <ThumbnailArea
            image={project.previewImage}
            onCapture={() => captureProjectScreenshot(project.id)}
            onImageChange={(img) => onUpdate({ ...project, previewImage: img, previewUpdatedAt: img ? new Date() : undefined })}
            size="sm"
  />

          {/* Content - 2 columns on desktop, stacked on mobile */}
          <YStack flex={1} minWidth={0} $md={{ flexDirection: "row", gap: "$5" }}>
            {/* Column 2: Primary info (Title, Description, Updated) */}
            <YStack flex={1} minWidth={0} rowGap="$1">
              {isEditing ? (
                <YStack rowGap="$2" onClick={(e) => e.stopPropagation()}>
                  {/* Name input */}
                  <div>
                    <XStack alignItems="center" gap="$2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdits();
                          }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        height={28} fontSize="$3" fontWeight="500"
                        autoFocus
                        maxLength={50}
                        placeholder="Project name"
  />
                      <Button size="icon" variant="ghost" flexShrink={0} onClick={saveEdits}>
                        <Check size={12} />
                      </Button>
                      <Button size="icon" variant="ghost" flexShrink={0} onClick={cancelEdit}>
                        <X size={12} />
                      </Button>
                    </XStack>
                    <SizableText fontSize="$1" color="$color11">{editedName.length}/50</SizableText>
                  </div>
                  {/* Description input */}
                  <div>
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      placeholder="Add a description..."
                      minHeight={60} fontSize="$3" className="resize-none"
                      maxLength={200}
  />
                    <SizableText fontSize="$1" color="$color11">{editedDescription.length}/200</SizableText>
                  </div>
                </YStack>
              ) : (
                <>
                  {/* Title row */}
                  <XStack alignItems="center" gap="$2">
                    <H3 fontWeight="500" numberOfLines={1}>{project.name}</H3>
                    <Badge variant="outline" className="shrink-0 h-auto px-1.5 py-0 text-[11px]" style={runtimeBadge.tone}>{runtimeBadge.label}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      opacity={0} $group-hover={{ opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      <Edit2 size={12} />
                    </Button>
                  </XStack>

                  {/* Description */}
                  {project.description && (
                    <Paragraph fontSize="$3" color="$color11" numberOfLines={1}>
                      {project.description}
                    </Paragraph>
                  )}

                  {/* Updated timestamp */}
                  <Paragraph fontSize="$1" color="$color11">
                    Updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                  </Paragraph>
                </>
              )}
            </YStack>

            {/* Column 3: Stats and File types */}
            <YStack rowGap="$2" marginTop="$2" $md={{ marginTop: "$0" }}>
              {/* Stats - inline on desktop, horizontal on mobile */}
              {stats && (
                <XStack flexWrap="wrap" alignItems="center" columnGap="$3" rowGap="$1">
                  <XStack alignItems="center" gap="$1">
                    <FolderOpen size={16} />
                    <SizableText fontSize="$3" color="$color11">{stats.fileCount} {stats.fileCount === 1 ? 'file' : 'files'}</SizableText>
                  </XStack>
                  <XStack alignItems="center" gap="$1">
                    <HardDrive size={16} />
                    <SizableText fontSize="$3" color="$color11">{stats.formattedSize}</SizableText>
                  </XStack>
                  {project.costTracking?.totalCost && project.costTracking.totalCost > 0 && (
                    <XStack alignItems="center" gap="$1">
                      <DollarSign size={16} />
                      <SizableText fontSize="$3" color="$color11">{formatCost(project.costTracking.totalCost)}</SizableText>
                    </XStack>
                  )}
                </XStack>
              )}

              {/* File types */}
              {stats && getMainFileTypes().length > 0 && (
                <XStack flexWrap="wrap" alignItems="center" columnGap="$3" rowGap="$1">
                  {getMainFileTypes().map(([ext, count]) => (
                    <XStack key={ext} alignItems="center" gap="$1">
                      {getFileTypeIcon(ext)}
                      <SizableText fontSize="$1" color="$color11">{ext.toUpperCase()} ({count})</SizableText>
                    </XStack>
                  ))}
                </XStack>
              )}
            </YStack>
          </YStack>

          <XStack alignItems="center" gap="$2" marginLeft="$4">
            <DropdownMenu open={forceMenuOpen ? true : menuOpen} onOpenChange={handleMenuOpenChange} placement="bottom-end">
              <DropdownMenuTrigger
                asChild
                onClick={(e) => e.stopPropagation()}
                data-tour-id={highlightExport ? 'project-actions-trigger' : undefined}
              >
                <Button size="icon" variant="ghost">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onPreview(project);
                }}>
                  <Eye size={16} />
                  Preview
                </DropdownMenuItem>
                {onBackend && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onBackend(project);
                  }}>
                    <Server size={16} />
                    Backend
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(project);
                }}>
                  <Copy size={16} />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onExportZip(project);
                }}>
                  <Package size={16} />
                  Export as ZIP
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(project);
                  }}
                  data-tour-id={highlightExport ? 'project-export-json' : undefined}
                >
                  <Download size={16} />
                  Export as JSON
                </DropdownMenuItem>
                {onExportAsTemplate && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onExportAsTemplate(project);
                  }}>
                    <FileBox size={16} />
                    Export as Template
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </XStack>
        </XStack>
      </YStack>
    );
  }

  // Grid view (default)
  return (
    <YStack
      borderWidth={1} borderColor="$borderColor" borderRadius="$5" overflow="hidden" cursor="pointer" group hoverStyle={{ elevation: 4, borderColor: "$color12" }}
      style={{ background: `linear-gradient(rgb(var(--tint) / 0.02), rgb(var(--tint) / 0.02)), var(--card)` }}
      onClick={() => onSelect(project)}
      data-tour-id="project-card"
    >
      {/* Preview Thumbnail */}
      <YStack position="relative">
        <ThumbnailArea
          image={project.previewImage}
          onCapture={() => captureProjectScreenshot(project.id)}
          onImageChange={(img) => onUpdate({ ...project, previewImage: img, previewUpdatedAt: img ? new Date() : undefined })}
          size="md"
  />
        <YStack position="absolute" bottom="$2" left="$2">
          <Badge variant="outline" className="px-1.5 py-0.5 text-[11px] shadow-sm" style={runtimeBadge.tone}>{runtimeBadge.label}</Badge>
        </YStack>
      </YStack>

      <YStack padding="$4" rowGap="$3">
        {/* Header with name and actions */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          {isEditing ? (
            <YStack flex={1} onClick={(e) => e.stopPropagation()}>
              <XStack alignItems="center" gap="$2">
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
                  height="$6" fontSize="$3" fontWeight="500"
                  autoFocus
                  maxLength={50}
  />
                <Button size="icon" variant="ghost" onClick={saveEdits}>
                  <Check size={12} />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                  <X size={12} />
                </Button>
              </XStack>
              <SizableText fontSize="$1" color="$color11" marginTop="$1">{editedName.length}/50</SizableText>
            </YStack>
          ) : (
            <XStack alignItems="center" gap="$2" flex={1}>
              <H3 fontWeight="500" fontSize="$6" numberOfLines={1} flex={1}>{project.name}</H3>
              <Button
                size="icon"
                variant="ghost"
                opacity={0} $group-hover={{ opacity: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 size={12} />
              </Button>
            </XStack>
          )}
          
          <DropdownMenu open={forceMenuOpen ? true : menuOpen} onOpenChange={handleMenuOpenChange}>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
              data-tour-id={highlightExport ? 'project-actions-trigger' : undefined}
            >
              <Button size="icon" variant="ghost">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onPreview(project);
              }}>
                <Eye size={16} />
                Preview
              </DropdownMenuItem>
              {onBackend && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onBackend(project);
                }}>
                  <Server size={16} />
                  Backend
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDuplicate(project);
              }}>
                <Copy size={16} />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onExportZip(project);
              }}>
                <Package size={16} />
                Export as ZIP
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(project);
                }}
                data-tour-id={highlightExport ? 'project-export-json' : undefined}
              >
                <Download size={16} />
                Export as JSON
              </DropdownMenuItem>
              {onExportAsTemplate && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onExportAsTemplate(project);
                }}>
                  <FileBox size={16} />
                  Export as Template
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
              >
                <Trash2 size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </XStack>

        {/* Description */}
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEdit();
              }}
              placeholder="Add a description..."
              minHeight={60} fontSize="$3" className="resize-none"
              maxLength={200}
  />
            <XStack alignItems="center" justifyContent="space-between" marginTop="$1">
              <SizableText fontSize="$1" color="$color11">{editedDescription.length}/200</SizableText>
            </XStack>
          </div>
        ) : (
          <YStack minHeight={40}>
            {project.description ? (
              <Paragraph fontSize="$3" color="$color11" numberOfLines={2}>
                {project.description}
              </Paragraph>
            ) : (
              <Paragraph fontSize="$3" color="$color11" fontStyle="italic">
                No description
              </Paragraph>
            )}
          </YStack>
        )}

        {/* Stats */}
        {loadingStats ? (
          <YStack height="$5" backgroundColor="$color3" borderRadius="$2" />
        ) : stats && (
          <>
            <XStack alignItems="center" gap="$3" paddingTop="$2" borderTopWidth={1}>
              <XStack alignItems="center" gap="$1">
                <FolderOpen size={16} />
                <SizableText fontSize="$3" color="$color11">{stats.fileCount} {stats.fileCount === 1 ? 'file' : 'files'}</SizableText>
              </XStack>
              <XStack alignItems="center" gap="$1">
                <HardDrive size={16} />
                <SizableText fontSize="$3" color="$color11">{stats.formattedSize}</SizableText>
              </XStack>
              {project.costTracking?.totalCost && project.costTracking.totalCost > 0 && (
                <XStack alignItems="center" gap="$1">
                  <DollarSign size={16} />
                  <SizableText fontSize="$3" color="$color11">{formatCost(project.costTracking.totalCost)}</SizableText>
                </XStack>
              )}
            </XStack>

            {/* File types */}
            {getMainFileTypes().length > 0 && (
              <XStack alignItems="center" gap="$3">
                {getMainFileTypes().map(([ext, count]) => (
                  <XStack key={ext} alignItems="center" gap="$1">
                    {getFileTypeIcon(ext)}
                    <SizableText fontSize="$1" color="$color11">{ext} ({count})</SizableText>
                  </XStack>
                ))}
              </XStack>
            )}
          </>
        )}

        {/* Timestamps */}
        <YStack paddingTop="$2" borderTopWidth={1}>
          <SizableText fontSize="$1" color="$color11">Updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}</SizableText>
        </YStack>
      </YStack>
    </YStack>
  );
}
