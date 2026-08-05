'use client';

import { YStack, XStack, Image, H3, SizableText, Paragraph, Anchor } from '@hanzo/gui';
import React from 'react';
import { CustomTemplate, LICENSE_OPTIONS } from '@/lib/vfs/types';
import type { BuiltInTemplateMetadata } from '@/lib/vfs/templates/registry';
import { getRuntimeBadge } from '@/lib/runtimes/registry';
import { Button, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@hanzo/ui';
import { Trash2, Plus, FileBox, Download, Link2, ExternalLink, MoreVertical, Server } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateCardProps {
  template: CustomTemplate | BuiltInTemplateMetadata;
  onSelect: (template: CustomTemplate | BuiltInTemplateMetadata) => void;
  onDelete?: (id: string) => void;
  onExport?: (template: CustomTemplate | BuiltInTemplateMetadata) => void;
  viewMode?: 'grid' | 'list';
}

export function TemplateCard({
  template,
  onSelect,
  onDelete,
  onExport,
  viewMode = 'grid'
}: TemplateCardProps) {
  const isBuiltIn = 'isBuiltIn' in template && template.isBuiltIn;
  const customTemplate = !isBuiltIn ? template as CustomTemplate : null;
  const hasBackendFeatures = 'backendFeatures' in template && !!template.backendFeatures;

  const getLicenseLabel = (licenseValue: string): string => {
    const license = LICENSE_OPTIONS.find(opt => opt.value === licenseValue);
    return license?.label || licenseValue;
  };

  const runtimeBadge = isBuiltIn && 'runtime' in template
    ? getRuntimeBadge((template as BuiltInTemplateMetadata).runtime)
    : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBuiltIn || !onDelete) return;
    onDelete(template.id);
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExport) onExport(template);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // List view (horizontal row)
  if (viewMode === 'list') {
    return (
      <YStack
        borderWidth={1} borderColor="$borderColor" borderRadius="$5" padding="$4" backgroundColor="$background"
      >
        <XStack alignItems="center" gap="$4">
          {/* Thumbnail */}
          <YStack position="relative" flexShrink={0}>
            {customTemplate?.metadata.thumbnail ? (
              <YStack width="$12" height="$10" borderRadius="$3" overflow="hidden" backgroundColor="$color3">
                <Image
                  src={customTemplate.metadata.thumbnail}
                  alt={template.name}
                  width="100%" height="100%" objectFit="cover"
  />
              </YStack>
            ) : (
              <XStack width="$12" height="$10" borderRadius="$3" backgroundColor="$color3" alignItems="center" justifyContent="center">
                <FileBox size={32} />
              </XStack>
            )}
            {isBuiltIn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <YStack position="absolute" top="$1" right="$1" backgroundColor="$background" borderRadius="$10" padding="$1">
                    <Link2 size={12} />
                  </YStack>
                </TooltipTrigger>
                <TooltipContent>Built-in template</TooltipContent>
              </Tooltip>
            )}
          </YStack>

          {/* Template Info */}
          <YStack flex={1} minWidth={0}>
            <XStack alignItems="center" gap="$2" marginBottom="$1">
              <H3 fontWeight="500" fontSize="$4" numberOfLines={1}>
                {template.name}
              </H3>
              {customTemplate && (
                <SizableText fontSize="$1" color="$color11" flexShrink={0}>
                  v{customTemplate.version}
                </SizableText>
              )}
            </XStack>

            <Paragraph fontSize="$3" color="$color11" numberOfLines={1} marginBottom="$2">
              {template.description}
            </Paragraph>

            {/* Metadata */}
            <XStack flexWrap="wrap" alignItems="center" columnGap="$2" rowGap="$1">
              {runtimeBadge && (
                <Badge className="text-xs px-1.5 py-0 h-auto" style={runtimeBadge.tone}>{runtimeBadge.label}</Badge>
              )}
              {hasBackendFeatures && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-auto">
                  <Server size={12} />
                  Backend
                </Badge>
              )}
              {(customTemplate?.metadata.author || template.metadata?.author) && (
                <SizableText numberOfLines={1} maxWidth={150} fontSize="$1" color="$color11">
                  by {customTemplate?.metadata.author || template.metadata?.author}
                </SizableText>
              )}
              {customTemplate?.metadata.license && (
                <>
                  {customTemplate.metadata.author && <SizableText fontSize="$1" color="$color11">•</SizableText>}
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-auto">
                    {getLicenseLabel(customTemplate.metadata.license)}
                  </Badge>
                </>
              )}
              {customTemplate?.files && (
                <>
                  <SizableText fontSize="$1" color="$color11">•</SizableText>
                  <SizableText fontSize="$1" color="$color11">{customTemplate.files.length} files</SizableText>
                </>
              )}
              {(customTemplate?.metadata.tags || template.metadata?.tags) && (
                <>
                  <SizableText fontSize="$1" color="$color11">•</SizableText>
                  {(customTemplate?.metadata.tags || template.metadata?.tags || []).slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 h-auto">
                      {tag}
                    </Badge>
                  ))}
                  {(customTemplate?.metadata.tags || template.metadata?.tags || []).length > 2 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-auto">
                      +{(customTemplate?.metadata.tags || template.metadata?.tags || []).length - 2}
                    </Badge>
                  )}
                </>
              )}
            </XStack>
          </YStack>

          {/* Actions - Desktop */}
          <XStack display="none" $md={{ display: "flex" }} alignItems="center" gap="$3" flexShrink={0}>
            <SizableText fontSize="$1" color="$color11" whiteSpace="nowrap">
              {formatDate(customTemplate?.updatedAt || template.updatedAt)}
            </SizableText>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" height="$6" width="$6">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onSelect(template)}>
                  <Plus size={16} />
                  Create Project
                </DropdownMenuItem>
                {onExport && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExport}>
                      <Download size={16} />
                      Export Template
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isBuiltIn}
                          >
                            <Trash2 size={16} />
                            Delete
                          </DropdownMenuItem>
                        </div>
                      </TooltipTrigger>
                      {isBuiltIn && (
                        <TooltipContent>Built-in templates cannot be deleted</TooltipContent>
                      )}
                    </Tooltip>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </XStack>

          {/* Actions - Mobile */}
          <YStack $md={{ display: "none" }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" height="$6" width="$6">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onSelect(template)}>
                  <Plus size={16} />
                  Create Project
                </DropdownMenuItem>
                {onExport && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExport}>
                      <Download size={16} />
                      Export Template
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isBuiltIn}
                    >
                      <Trash2 size={16} />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </YStack>
        </XStack>
      </YStack>
    );
  }

  // Grid view (vertical card)
  return (
    <YStack
      borderWidth={1} borderColor="$borderColor" borderRadius="$5" overflow="hidden" backgroundColor="$background" group
    >
      {/* Thumbnail */}
      <YStack position="relative">
        {customTemplate?.metadata.thumbnail ? (
          <YStack width="100%" backgroundColor="$color3">
            <Image
              src={customTemplate.metadata.thumbnail}
              alt={template.name}
              width="100%" height="100%" objectFit="cover"
  />
          </YStack>
        ) : (
          <XStack width="100%" backgroundColor="$color3" alignItems="center" justifyContent="center">
            <FileBox size={64} />
          </XStack>
        )}
        {isBuiltIn && (
          <Tooltip>
            <TooltipTrigger asChild>
              <YStack position="absolute" top="$2" right="$2" backgroundColor="$background" borderRadius="$10" padding="$1.5" elevation={1}>
                <Link2 size={16} />
              </YStack>
            </TooltipTrigger>
            <TooltipContent>Built-in template</TooltipContent>
          </Tooltip>
        )}
        {customTemplate?.metadata.downloadUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Anchor
                href={customTemplate.metadata.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                position="absolute" top="$2" left="$2" backgroundColor="$background" borderRadius="$10" padding="$1.5" elevation={1} hoverStyle={{ backgroundColor: "$background" }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} />
              </Anchor>
            </TooltipTrigger>
            <TooltipContent>View on marketplace</TooltipContent>
          </Tooltip>
        )}
      </YStack>

      {/* Content */}
      <YStack padding="$4" rowGap="$3">
        {/* Header */}
        <YStack rowGap="$1">
          <XStack alignItems="center" gap="$2">
            <H3 fontWeight="500" fontSize="$4" numberOfLines={1} flex={1}>
              {template.name}
            </H3>
            {customTemplate && (
              <SizableText fontSize="$1" color="$color11" flexShrink={0}>
                v{customTemplate.version}
              </SizableText>
            )}
          </XStack>
          <Paragraph fontSize="$3" color="$color11" numberOfLines={2}>
            {template.description}
          </Paragraph>
        </YStack>

        {/* Metadata */}
        <YStack rowGap="$2">
          {(customTemplate?.metadata.author || template.metadata?.author) && (
            <YStack>
              {customTemplate?.metadata.authorUrl ? (
                <Anchor display="inline-flex"
                  href={customTemplate.metadata.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="$color11" fontSize="$1" alignItems="center" gap="$1" hoverStyle={{ color: "$color", textDecorationLine: "underline" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  by {customTemplate.metadata.author}
                  <ExternalLink size={12} />
                </Anchor>
              ) : (
                <SizableText fontSize="$1" color="$color11">by {customTemplate?.metadata.author || template.metadata?.author}</SizableText>
              )}
            </YStack>
          )}

          {/* Tags */}
          {((customTemplate?.metadata.tags || template.metadata?.tags || []).length > 0 || (isBuiltIn && 'runtime' in template) || hasBackendFeatures) && (
            <XStack flexWrap="wrap" gap="$1">
              {runtimeBadge && (
                <Badge className="text-xs px-1.5 py-0.5" style={runtimeBadge.tone}>{runtimeBadge.label}</Badge>
              )}
              {hasBackendFeatures && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  <Server size={12} />
                  Backend
                </Badge>
              )}
              {(customTemplate?.metadata.tags || template.metadata?.tags || []).slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
              {(customTemplate?.metadata.tags || template.metadata?.tags || []).length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  +{(customTemplate?.metadata.tags || template.metadata?.tags || []).length - 3}
                </Badge>
              )}
            </XStack>
          )}

          {/* License and file count */}
          <XStack alignItems="center" gap="$2" flexWrap="wrap">
            {customTemplate?.metadata.license && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-auto">
                {getLicenseLabel(customTemplate.metadata.license)}
              </Badge>
            )}
            {customTemplate?.files && (
              <>
                {customTemplate.metadata.license && <SizableText fontSize="$1" color="$color11">•</SizableText>}
                <SizableText fontSize="$1" color="$color11">{customTemplate.files.length} files</SizableText>
              </>
            )}
          </XStack>
        </YStack>

        {/* Footer */}
        <XStack paddingTop="$3" borderTopWidth={1} borderColor="$borderColor" alignItems="center" justifyContent="space-between">
          <SizableText fontSize="$1" color="$color11">
            {formatDate(customTemplate?.updatedAt || template.updatedAt)}
          </SizableText>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" height="$6" width="$6">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onSelect(template)}>
                <Plus size={16} />
                Create Project
              </DropdownMenuItem>
              {onExport && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport}>
                    <Download size={16} />
                    Export Template
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isBuiltIn}
                        >
                          <Trash2 size={16} />
                          Delete
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {isBuiltIn && (
                      <TooltipContent>Built-in templates cannot be deleted</TooltipContent>
                    )}
                  </Tooltip>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </XStack>
      </YStack>
    </YStack>
  );
}
