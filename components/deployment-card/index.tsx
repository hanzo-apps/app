'use client';

import { YStack, XStack, H3, SizableText, Paragraph } from '@hanzo/ui';
import { Deployment, Project } from '@/lib/vfs/types';
import { Button, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@hanzo/ui';
import { CopyButton } from '@hanzo/ui/product';
import {
  Globe,
  Settings,
  Server,
  ExternalLink,
  Copy,
  RefreshCw,
  EyeOff,
  Eye,
  Trash2,
  MoreVertical,
  AlertCircle,
  Construction,
  Folder,
  BarChart3,
  Pencil,
  FileBox,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbnailArea } from '@/components/ui/thumbnail-area';
import { captureDeploymentScreenshot } from '@/lib/utils/deployment-thumbnail';
import { Spinner } from '@/components/ui/spinner';

interface DeploymentCardProps {
  deployment: Deployment;
  project?: Project;
  isPublishing?: boolean;
  onOpenSettings: (deployment: Deployment) => void;
  onOpenServerSettings?: (deployment: Deployment) => void;
  onViewAnalytics: (deployment: Deployment) => void;
  onEditProject: (deployment: Deployment) => void;
  onPublish: (deploymentId: string) => void;
  onDisable: (deploymentId: string) => void;
  onEnable: (deploymentId: string) => void;
  onDelete: (deploymentId: string) => void;
  onExportAsTemplate?: (deployment: Deployment) => void;
  onThumbnailChange?: (deploymentId: string, image: string | undefined) => void;
}

export function DeploymentCard({
  deployment,
  project,
  isPublishing = false,
  onOpenSettings,
  onOpenServerSettings,
  onViewAnalytics,
  onEditProject,
  onPublish,
  onDisable,
  onEnable,
  onDelete,
  onExportAsTemplate,
  onThumbnailChange,
}: DeploymentCardProps) {
  // Determine status
  const isPublished = deployment.lastPublishedVersion !== null && deployment.lastPublishedVersion !== undefined;
  const hasPendingChanges = isPublished && Number(deployment.settingsVersion) > Number(deployment.lastPublishedVersion);

  const publicUrl = deployment.customDomain
    ? `https://${deployment.customDomain}`
    : `${window.location.origin}/deployments/${deployment.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
  };

  const handleViewLive = () => {
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <YStack borderWidth={1} borderRadius="$5" overflow="hidden" backgroundColor="$background" hoverStyle={{ elevation: 4 }}>
      {/* Preview Image */}
      <YStack backgroundColor="$color3" position="relative">
        <ThumbnailArea
          image={deployment.previewImage || project?.previewImage}
          onCapture={isPublished ? async () => {
            const deploymentUrl = deployment.customDomain
              ? `https://${deployment.customDomain}`
              : `${window.location.origin}/deployments/${deployment.id}`;
            return captureDeploymentScreenshot(deploymentUrl);
          } : undefined}
          onImageChange={(img) => onThumbnailChange?.(deployment.id, img)}
          size="md"
  />

        {/* Publishing spinner overlay */}
        {isPublishing && (
          <XStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$background" alignItems="center" justifyContent="center" zIndex={10}>
            <Spinner size={24} />
          </XStack>
        )}

        {/* Status Badge Overlay */}
        <XStack position="absolute" top="$2" right="$2" gap="$2">
          {!deployment.enabled && (
            <Badge variant="outline">
              <EyeOff size={12} />
              Disabled
            </Badge>
          )}
          {deployment.underConstruction && deployment.enabled && (
            <Badge variant="outline">
              <Construction size={12} />
              Holding page
            </Badge>
          )}
          {hasPendingChanges && deployment.enabled && (
            <Badge variant="outline">
              <AlertCircle size={12} />
              Unpublished changes
            </Badge>
          )}
        </XStack>
      </YStack>

      {/* Content */}
      <YStack padding="$4">
        {/* Title and Description */}
        <YStack marginBottom="$3">
          <H3 fontWeight="500" fontSize="$6" numberOfLines={1} marginBottom="$1">{deployment.name}</H3>
          {project && (
            <XStack alignItems="center" gap="$1">
              <Folder size={12} />
              <SizableText numberOfLines={1} fontSize="$1" color="$color11">{project.name}</SizableText>
            </XStack>
          )}
          {deployment.slug && (
            <Paragraph fontSize="$1" color="$color11" marginTop="$1">
              Slug: {deployment.slug}
            </Paragraph>
          )}
        </YStack>

        {/* URL */}
        {deployment.enabled && (
          <XStack alignItems="center" gap="$2" marginBottom="$3" padding="$2" backgroundColor="$color3" borderRadius="$2">
            <Globe size={12} />
            <SizableText flex={1} numberOfLines={1} fontSize="$1">{publicUrl}</SizableText>
            <CopyButton value={publicUrl} label="Copy URL" size={20} id="deployment-url" />
          </XStack>
        )}

        {/* Metadata */}
        <XStack alignItems="center" gap="$4" marginBottom="$3">
          <SizableText fontSize="$1" color="$color11">
            Version: {deployment.settingsVersion}
            {deployment.lastPublishedVersion && (
              <> / {deployment.lastPublishedVersion}</>
            )}
          </SizableText>
          {deployment.publishedAt && (
            <SizableText fontSize="$1" color="$color11">
              Published {formatDistanceToNow(new Date(deployment.publishedAt), { addSuffix: true })}
            </SizableText>
          )}
        </XStack>

        {/* Stats Badges */}
        <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
          {deployment.headScripts.filter(s => s.enabled).length +
            deployment.bodyScripts.filter(s => s.enabled).length >
            0 && (
            <Badge variant="secondary">
              {deployment.headScripts.filter(s => s.enabled).length +
                deployment.bodyScripts.filter(s => s.enabled).length}{' '}
              Script
              {deployment.headScripts.filter(s => s.enabled).length +
                deployment.bodyScripts.filter(s => s.enabled).length !==
                1 && 's'}
            </Badge>
          )}
          {deployment.cdnLinks.filter(c => c.enabled).length > 0 && (
            <Badge variant="secondary">
              {deployment.cdnLinks.filter(c => c.enabled).length} CDN Resource
              {deployment.cdnLinks.filter(c => c.enabled).length !== 1 && 's'}
            </Badge>
          )}
          {deployment.analytics.enabled && (
            <Badge variant="secondary">
              Analytics
            </Badge>
          )}
          {(deployment.seo.title || deployment.seo.description) && (
            <Badge variant="secondary">
              SEO Configured
            </Badge>
          )}
          {deployment.compliance.enabled && (
            <Badge variant="secondary">
              Compliance
            </Badge>
          )}
        </XStack>

        {/* Actions */}
        <XStack gap="$2">
          {deployment.enabled ? (
            <>
              <Button
                variant={hasPendingChanges ? undefined : 'outline'}
                size="sm"
                {...{ flex: hasPendingChanges ? 1 : 1, backgroundColor: hasPendingChanges ? "$orange9" : undefined, color: hasPendingChanges ? "white" : undefined, hoverStyle: hasPendingChanges ? {"backgroundColor":"$orange10"} : undefined }}
                onClick={() => onPublish(deployment.id)}
                disabled={isPublishing}
              >
                <RefreshCw size={16} />
                {isPublishing
                  ? 'Publishing...'
                  : hasPendingChanges
                    ? 'Publish Changes'
                    : isPublished
                      ? 'Republish'
                      : 'Publish Deployment'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewLive}
                title="View Live"
              >
                <ExternalLink size={16} />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              flex={1}
              onClick={() => onEnable(deployment.id)}
            >
              <Eye size={16} />
              Enable
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEditProject(deployment)}>
                <Pencil size={16} />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenSettings(deployment)}>
                <Settings size={16} />
                Deployment Settings
              </DropdownMenuItem>
              {deployment.databaseEnabled && (
                <DropdownMenuItem onClick={() => onOpenServerSettings?.(deployment)}>
                  <Server size={16} />
                  Server Settings
                </DropdownMenuItem>
              )}
              {deployment.analytics.enabled && deployment.analytics.provider === 'builtin' && (
                <DropdownMenuItem onClick={() => onViewAnalytics(deployment)}>
                  <BarChart3 size={16} />
                  View Analytics
                </DropdownMenuItem>
              )}
              {deployment.enabled && (
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Copy size={16} />
                  Copy URL
                </DropdownMenuItem>
              )}
              {onExportAsTemplate && (
                <DropdownMenuItem onClick={() => onExportAsTemplate(deployment)}>
                  <FileBox size={16} />
                  Export as Deployment Template
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {deployment.enabled ? (
                <DropdownMenuItem onClick={() => onDisable(deployment.id)}>
                  <EyeOff size={16} />
                  Disable Deployment
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEnable(deployment.id)}>
                  <Eye size={16} />
                  Enable Deployment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(deployment.id)}
                variant="destructive"
              >
                <Trash2 size={16} />
                Delete Deployment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </XStack>
      </YStack>
    </YStack>
  );
}
