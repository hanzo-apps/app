'use client';

import { YStack, H3, XStack, Paragraph, SizableText } from '@hanzo/ui';
import { useState } from 'react';
import { PublishSettings, Project } from '@/lib/vfs/types';
import { Label, Input, Switch, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Globe, AlertTriangle } from 'lucide-react';
import { panel, row } from "@/lib/chrome";

interface GeneralTabProps {
  settings: PublishSettings;
  onChange: (settings: PublishSettings) => void;
  projectId: string;
  deploymentId: string;
  projects?: Project[];
  onProjectChange?: (projectId: string) => void;
}

export function GeneralTab({ settings, onChange, projectId, deploymentId, projects, onProjectChange }: GeneralTabProps) {
  const [originalProjectId] = useState(projectId);
  const handleChange = (field: keyof PublishSettings, value: any) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  // Generate public URL (uses deploymentId, not projectId!)
  const publicUrl = settings.customDomain
    ? `https://${settings.customDomain}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/deployments/${deploymentId}`;

  // Generate Hanzo App path URL (always show for debugging - uses deploymentId, not projectId!)
  const appUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/deployments/${deploymentId}`;

  return (
    <YStack rowGap="$5">
      {/* Publishing Status */}
      <YStack rowGap="$4">
        <div>
          <H3 fontSize="$6" fontWeight="500" marginBottom="$4">Publishing Status</H3>
        </div>

        <XStack {...panel} {...row}>
          <YStack rowGap="$1">
            <Label htmlFor="enabled" fontSize="$3" fontWeight="500">
              Published
            </Label>
            <Paragraph fontSize="$1" color="$color11">
              Make this deployment publicly accessible
            </Paragraph>
          </YStack>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
  />
        </XStack>

        <XStack {...panel} {...row}>
          <YStack rowGap="$1">
            <Label htmlFor="under-construction" fontSize="$3" fontWeight="500">
              Under Construction
            </Label>
            <Paragraph fontSize="$1" color="$color11">
              Show maintenance overlay on live deployment
            </Paragraph>
          </YStack>
          <Switch
            id="under-construction"
            checked={settings.underConstruction}
            onCheckedChange={(checked) => handleChange('underConstruction', checked)}
  />
        </XStack>
      </YStack>

      {/* Source Project */}
      {projects && projects.length > 0 && onProjectChange && (
        <YStack rowGap="$4">
          <div>
            <H3 fontSize="$6" fontWeight="500" marginBottom="$4">Source Project</H3>
          </div>

          <YStack rowGap="$2">
            <Label htmlFor="project-select">Project</Label>
            <Select value={projectId} onValueChange={onProjectChange}>
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Paragraph fontSize="$1" color="$color11">
              The project whose files are published to this deployment.
            </Paragraph>
          </YStack>

          {projectId !== originalProjectId && (
            <XStack alignItems="flex-start" gap="$3" padding="$3" backgroundColor="$yellow1" borderWidth={1} borderColor="$yellow3" borderRadius="$5">
              <AlertTriangle size={16} />
              <YStack>
                <Paragraph fontSize="$3" fontWeight="500" color="$yellow12">Changing the source project may break the published deployment.</Paragraph>
                <Paragraph fontSize="$3" marginTop="$1" color="$yellow11">
                  The new project may have different files and structure. You will need to republish after saving.
                </Paragraph>
              </YStack>
            </XStack>
          )}
        </YStack>
      )}

      {/* Public URL */}
      <YStack rowGap="$4">
        <div>
          <H3 fontSize="$6" fontWeight="500" marginBottom="$4">Public URL</H3>
        </div>

        <YStack rowGap="$3">
          <YStack rowGap="$2">
            <Label fontSize="$1" color="$color11">Public URL</Label>
            <XStack alignItems="center" gap="$2" padding="$3" backgroundColor="$color3" borderRadius="$5">
              <Globe size={16} />
              <SizableText fontSize="$3" flex={1}>{publicUrl}</SizableText>
              {settings.enabled && (
                <Badge variant="default">
                  Live
                </Badge>
              )}
              {!settings.enabled && (
                <Badge variant="secondary">
                  Not Published
                </Badge>
              )}
            </XStack>
            <Paragraph fontSize="$1" color="$color11">
              This is the public URL where your deployment will be accessible
            </Paragraph>
          </YStack>

          {/* Show Hanzo App path if custom domain is set */}
          {settings.customDomain && (
            <YStack rowGap="$2">
              <Label fontSize="$1" color="$color11">Hanzo App Path (Debug)</Label>
              <XStack alignItems="center" gap="$2" padding="$3" backgroundColor="$color3" borderRadius="$5" borderWidth={1} borderStyle="dashed">
                <Globe size={16} />
                <SizableText fontSize="$1" flex={1} color="$color11">{appUrl}</SizableText>
              </XStack>
              <Paragraph fontSize="$1" color="$color11">
                Internal path used by reverse proxy. Map your custom domain to this URL.
              </Paragraph>
            </YStack>
          )}
        </YStack>
      </YStack>

      {/* Custom Domain */}
      <YStack rowGap="$4">
        <div>
          <H3 fontSize="$6" fontWeight="500" marginBottom="$4">Custom Domain (Advanced)</H3>
        </div>

        <YStack rowGap="$2">
          <Label htmlFor="custom-domain">Domain Name (Optional)</Label>
          <Input
            id="custom-domain"
            type="text"
            placeholder="example.com"
            value={settings.customDomain || ''}
            onChangeText={(value) => handleChange('customDomain', value || undefined)}
  />
          <Paragraph fontSize="$1" color="$color11">
            Enter your custom domain if you've configured a reverse proxy to point it to this deployment. This is used for SEO meta tags and sitemaps. See documentation for setup instructions.
          </Paragraph>
        </YStack>
      </YStack>

      {/* Version Info */}
      <YStack rowGap="$4">
        <div>
          <H3 fontSize="$6" fontWeight="500" marginBottom="$4">Version Information</H3>
        </div>

        <YStack gap="$4">
          <YStack padding="$3" borderWidth={1} borderRadius="$5">
            <YStack marginBottom="$1"><SizableText fontSize="$3" color="$color11">Current Version</SizableText></YStack>
            <YStack><SizableText fontSize="$8" fontWeight="500">{settings.settingsVersion}</SizableText></YStack>
          </YStack>
          <YStack padding="$3" borderWidth={1} borderRadius="$5">
            <YStack marginBottom="$1"><SizableText fontSize="$3" color="$color11">Published Version</SizableText></YStack>
            <YStack><SizableText fontSize="$8" fontWeight="500">
              {settings.lastPublishedVersion !== null && settings.lastPublishedVersion !== undefined
                ? settings.lastPublishedVersion
                : '-'}
            </SizableText></YStack>
          </YStack>
        </YStack>

        {settings.lastPublishedVersion !== undefined &&
          settings.settingsVersion > settings.lastPublishedVersion && (
            <YStack padding="$3" backgroundColor="$yellow1" borderWidth={1} borderColor="$yellow3" borderRadius="$5">
              <XStack alignItems="center" gap="$2">
                <Badge variant="outline">
                  Pending Changes
                </Badge>
                <SizableText fontSize="$3">
                  You have unpublished changes. Republish to apply them.
                </SizableText>
              </XStack>
            </YStack>
          )}
      </YStack>
    </YStack>
  );
}
