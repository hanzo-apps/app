'use client';

import { YStack, XStack, SizableText } from '@hanzo/ui';
import { useState, useEffect, useCallback } from 'react';
import { Project, PublishSettings } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@hanzo/ui';
import { GeneralTab } from './general-tab';
import { ScriptsTab } from './scripts-tab';
import { CdnTab } from './cdn-tab';
import { AnalyticsTab } from './analytics-tab';
import { SeoTab } from './seo-tab';
import { ComplianceTab } from './compliance-tab';

interface PublishSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PublishSettings) => Promise<void>;
}

const DEFAULT_SETTINGS: PublishSettings = {
  enabled: false,
  underConstruction: false,
  headScripts: [],
  bodyScripts: [],
  cdnLinks: [],
  analytics: {
    enabled: false,
    provider: 'builtin',
    privacyMode: true,
  },
  seo: {},
  compliance: {
    enabled: false,
    bannerPosition: 'bottom',
    bannerStyle: 'bar',
    message: 'We use cookies to improve your experience. By using this site, you accept our use of cookies.',
    acceptButtonText: 'Accept',
    declineButtonText: 'Decline',
    mode: 'opt-in',
    blockAnalytics: true,
  },
  settingsVersion: 1,
};

export function PublishSettingsModal({
  project,
  isOpen,
  onClose,
  onSave,
}: PublishSettingsModalProps) {
  // Legacy code - publishSettings removed from Project type
  const [settings, setSettings] = useState<PublishSettings>(
    DEFAULT_SETTINGS
  );
  const [initialSettings, setInitialSettings] = useState<PublishSettings>(
    DEFAULT_SETTINGS
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Reset state when project or isOpen changes
  useEffect(() => {
    if (isOpen) {
      // Legacy: publishSettings removed from Project type
      const currentSettings = DEFAULT_SETTINGS;
      setSettings(currentSettings);
      setInitialSettings(currentSettings);
      setIsDirty(false);
      setActiveTab('general');
    }
  }, [project, isOpen]);

  // Track dirty state
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);
    setIsDirty(hasChanges);
  }, [settings, initialSettings]);

  // Stable callback for settings changes
  const handleSettingsChange = useCallback((newSettings: PublishSettings) => {
    setSettings(newSettings);
  }, []);

  const handleClose = () => {
    if (isDirty) {
      // Show confirmation if there are unsaved changes
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Increment settings version
      const updatedSettings: PublishSettings = {
        ...settings,
        settingsVersion: settings.settingsVersion + 1,
      };

      // Save settings
      await onSave(updatedSettings);

      // Update local state
      setInitialSettings(updatedSettings);
      setSettings(updatedSettings);
      setIsDirty(false);

      // Close modal - settings are saved
      onClose();
    } catch (error) {
      console.error('[PublishSettingsModal] Failed to save settings:', error);
      alert('The settings were not saved. Your changes are still on screen.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent maxWidth={896} height="80vh" flexDirection="column">
          <DialogHeader>
            <DialogTitle>Publish Settings - {project.name}</DialogTitle>
            <DialogDescription>
              Configure scripts, CDN resources, analytics, and SEO settings for your published deployment.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} flex={1} flexDirection="column" overflow="hidden">
            <TabsList width="100%">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="cdn">CDN</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <YStack flex={1} padding="$4" overflow="scroll">
              <TabsContent value="general" marginTop="$0">
                <GeneralTab settings={settings} onChange={handleSettingsChange} projectId={project.id} deploymentId={project.id} />
              </TabsContent>

              <TabsContent value="scripts" marginTop="$0">
                <ScriptsTab settings={settings} onChange={handleSettingsChange} />
              </TabsContent>

              <TabsContent value="cdn" marginTop="$0">
                <CdnTab settings={settings} onChange={handleSettingsChange} />
              </TabsContent>

              <TabsContent value="analytics" marginTop="$0">
                <AnalyticsTab settings={settings} onChange={handleSettingsChange} />
              </TabsContent>

              <TabsContent value="seo" marginTop="$0">
                <SeoTab settings={settings} onChange={handleSettingsChange} />
              </TabsContent>

              <TabsContent value="compliance" marginTop="$0">
                <ComplianceTab settings={settings} onChange={handleSettingsChange} />
              </TabsContent>
            </YStack>
          </Tabs>

          <XStack justifyContent="space-between" alignItems="center" paddingTop="$4" borderTopWidth={1}>
            <YStack>
              <SizableText fontSize="$3" color="$color11">
                {isDirty && '• Unsaved changes'}
              </SizableText>
            </YStack>
            <XStack gap="$2">
              <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? 'Saving…' : 'Save settings'}
              </Button>
            </XStack>
          </XStack>
        </DialogContent>
      </Dialog>

    </>
  );
}
