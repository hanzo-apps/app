'use client';

import { YStack, SizableText, Paragraph, XStack, H4, Anchor } from '@hanzo/gui';
import React, { useState, useMemo } from 'react';
import { vfs } from '@/lib/vfs';
import { Tabs, TabsContent, TabsList, TabsTrigger, Switch, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, Tooltip, TooltipContent, TooltipTrigger, toast } from '@hanzo/ui';
import { FunctionsManager } from '@/components/database-manager/functions-manager';
import { ServerFunctionsManager } from '@/components/database-manager/server-functions-manager';
import { SecretsManager } from '@/components/database-manager/secrets-manager';
import { ScheduledFunctionsManager } from '@/components/database-manager/scheduled-functions-manager';
import { Code2, Wrench, Key, Clock, Lock, Settings2, PowerOff, Database } from 'lucide-react';
import { logger } from '@/lib/utils';
import type { Project, ProjectRuntime } from '@/lib/vfs/types';
import { getProjectRuntimes } from '@/lib/runtimes/registry';
import type {
  FunctionsDataProvider,
  ServerFunctionsDataProvider,
  SecretsDataProvider,
  ScheduledFunctionsDataProvider,
} from '@/components/database-manager/data-providers';
import { SchemaEditor } from './schema-editor';

interface ProjectSettingsPanelProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  enabled: boolean;
}

function createFunctionsProvider(projectId: string): FunctionsDataProvider {
  return {
    async list() {
      const adapter = vfs.getStorageAdapter();
      return adapter.listEdgeFunctions ? await adapter.listEdgeFunctions(projectId) : [];
    },
    async save(id, data) {
      const adapter = vfs.getStorageAdapter();
      const now = new Date();
      if (id && adapter.getEdgeFunction && adapter.updateEdgeFunction) {
        const existing = await adapter.getEdgeFunction(id);
        if (existing) await adapter.updateEdgeFunction({ ...existing, ...data, updatedAt: now });
      } else if (adapter.createEdgeFunction) {
        await adapter.createEdgeFunction({
          id: crypto.randomUUID(),
          projectId,
          name: data.name || '',
          method: data.method || 'GET',
          code: data.code || '',
          description: data.description || '',
          enabled: data.enabled ?? true,
          timeoutMs: data.timeoutMs ?? 10000,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    async remove(id) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.deleteEdgeFunction) await adapter.deleteEdgeFunction(id);
    },
    async toggle(id, enabled) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.getEdgeFunction && adapter.updateEdgeFunction) {
        const existing = await adapter.getEdgeFunction(id);
        if (existing) await adapter.updateEdgeFunction({ ...existing, enabled, updatedAt: new Date() });
      }
    },
  };
}

function createServerFunctionsProvider(projectId: string): ServerFunctionsDataProvider {
  return {
    async list() {
      const adapter = vfs.getStorageAdapter();
      return adapter.listServerFunctions ? await adapter.listServerFunctions(projectId) : [];
    },
    async save(id, data) {
      const adapter = vfs.getStorageAdapter();
      const now = new Date();
      if (id && adapter.getServerFunction && adapter.updateServerFunction) {
        const existing = await adapter.getServerFunction(id);
        if (existing) await adapter.updateServerFunction({ ...existing, ...data, updatedAt: now });
      } else if (adapter.createServerFunction) {
        await adapter.createServerFunction({
          id: crypto.randomUUID(),
          projectId,
          name: data.name || '',
          code: data.code || '',
          description: data.description || '',
          enabled: data.enabled ?? true,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    async remove(id) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.deleteServerFunction) await adapter.deleteServerFunction(id);
    },
    async toggle(id, enabled) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.getServerFunction && adapter.updateServerFunction) {
        const existing = await adapter.getServerFunction(id);
        if (existing) await adapter.updateServerFunction({ ...existing, enabled, updatedAt: new Date() });
      }
    },
  };
}

function createSecretsProvider(projectId: string): SecretsDataProvider {
  return {
    async list() {
      const adapter = vfs.getStorageAdapter();
      const secrets = adapter.listSecrets ? await adapter.listSecrets(projectId) : [];
      return { secrets, encryptionConfigured: true };
    },
    async save(id, data) {
      const adapter = vfs.getStorageAdapter();
      const now = new Date();
      if (id && adapter.getSecret && adapter.updateSecret) {
        const existing = await adapter.getSecret(id);
        if (existing) await adapter.updateSecret({ ...existing, ...data, hasValue: !!data.value || existing.hasValue, updatedAt: now });
      } else if (adapter.createSecret) {
        await adapter.createSecret({
          id: crypto.randomUUID(),
          projectId,
          name: data.name,
          description: data.description || '',
          hasValue: !!data.value,
          value: data.value,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    async remove(id) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.deleteSecret) await adapter.deleteSecret(id);
    },
  };
}

function createScheduledFunctionsProvider(projectId: string): ScheduledFunctionsDataProvider {
  return {
    async listScheduled() {
      const adapter = vfs.getStorageAdapter();
      return adapter.listScheduledFunctions ? await adapter.listScheduledFunctions(projectId) : [];
    },
    async listEdgeFunctions() {
      const adapter = vfs.getStorageAdapter();
      return adapter.listEdgeFunctions ? await adapter.listEdgeFunctions(projectId) : [];
    },
    async save(id, data) {
      const adapter = vfs.getStorageAdapter();
      const now = new Date();
      if (id && adapter.getScheduledFunction && adapter.updateScheduledFunction) {
        const existing = await adapter.getScheduledFunction(id);
        if (existing) await adapter.updateScheduledFunction({ ...existing, ...data, updatedAt: now });
      } else if (adapter.createScheduledFunction) {
        await adapter.createScheduledFunction({
          id: crypto.randomUUID(),
          projectId,
          name: data.name || '',
          description: data.description || '',
          functionId: data.functionId || '',
          cronExpression: data.cronExpression || '',
          timezone: data.timezone || 'UTC',
          config: data.config || {},
          enabled: data.enabled ?? true,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    async remove(id) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.deleteScheduledFunction) await adapter.deleteScheduledFunction(id);
    },
    async toggle(id, enabled) {
      const adapter = vfs.getStorageAdapter();
      if (adapter.getScheduledFunction && adapter.updateScheduledFunction) {
        const existing = await adapter.getScheduledFunction(id);
        if (existing) await adapter.updateScheduledFunction({ ...existing, enabled, updatedAt: new Date() });
      }
    },
  };
}

function GeneralTab({ project, onProjectUpdate }: { project: Project; onProjectUpdate: (project: Project) => void }) {
  const [editingEntryPoint, setEditingEntryPoint] = useState(
    project.settings?.previewEntryPoint || '/index.html'
  );

  const handleRuntimeChange = async (value: ProjectRuntime) => {
    try {
      const proj = await vfs.getProject(project.id);
      proj.settings = { ...proj.settings, runtime: value };
      await vfs.updateProject(proj);
      onProjectUpdate(proj);
      const label = getProjectRuntimes().find(r => r.value === value)?.label || value;
      toast.success(`Runtime changed to ${label}`);
    } catch (err) {
      logger.error('Failed to update runtime:', err);
      toast.error('Failed to update runtime');
    }
  };

  const handleEntryPointCommit = async () => {
    const trimmed = editingEntryPoint.trim();
    const current = project.settings?.previewEntryPoint || '/index.html';
    if (trimmed === current) return;
    try {
      const proj = await vfs.getProject(project.id);
      proj.settings = { ...proj.settings, previewEntryPoint: trimmed };
      await vfs.updateProject(proj);
      onProjectUpdate(proj);
      toast.success(`Entry point set to ${trimmed}`);
    } catch (err) {
      logger.error('Failed to update entry point:', err);
      toast.error('Failed to update entry point');
    }
  };

  return (
    <YStack padding="$4" rowGap="$5">
      <YStack rowGap="$2">
        <Label htmlFor="runtime">Runtime</Label>
        <Select value={project.settings?.runtime || 'static'} onValueChange={handleRuntimeChange}>
          <SelectTrigger id="runtime" width="100%">
            <SizableText numberOfLines={1} flex={1} textAlign="left" display="flex" flexDirection="column">
              {getProjectRuntimes().find(r => r.value === (project.settings?.runtime || 'static'))?.label}
            </SizableText>
          </SelectTrigger>
          <SelectContent>
            {getProjectRuntimes().map(rt => (
              <SelectItem key={rt.value} value={rt.value}>
                <YStack gap="$0.5">
                  <SizableText fontWeight="500" display="flex" flexDirection="column">{rt.label}</SizableText>
                  <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">{rt.description}</SizableText>
                </YStack>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </YStack>

      <YStack rowGap="$2">
        <Label htmlFor="entry-point">Preview Entry Point</Label>
        <Input
          id="entry-point"
          value={editingEntryPoint}
          onChange={(e) => setEditingEntryPoint(e.target.value)}
          onBlur={handleEntryPointCommit}
          onKeyDown={(e) => { if (e.key === 'Enter') handleEntryPointCommit(); }}
          placeholder="/index.html"
  />
        <Paragraph fontSize="$1" color="$color11">
          The file loaded in the preview panel when opening this project.
        </Paragraph>
      </YStack>
    </YStack>
  );
}

export function ProjectSettingsPanel({ project, onProjectUpdate, enabled }: ProjectSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('general');
  const isServerMode = process.env.NEXT_PUBLIC_SERVER_MODE === 'true';
  const backendTabsDisabled = !isServerMode || !enabled;

  const functionsProvider = useMemo(() => createFunctionsProvider(project.id), [project.id]);
  const serverFunctionsProvider = useMemo(() => createServerFunctionsProvider(project.id), [project.id]);
  const secretsProvider = useMemo(() => createSecretsProvider(project.id), [project.id]);
  const scheduledFunctionsProvider = useMemo(() => createScheduledFunctionsProvider(project.id), [project.id]);

  const backendTabTrigger = (value: string, icon: React.ReactNode, label: string) => {
    const trigger = (
      <TabsTrigger
        value={value}
        alignItems="center" gap="$1"
        disabled={backendTabsDisabled}
      >
        {icon}
        <SizableText fontSize="$1">{label}</SizableText>
      </TabsTrigger>
    );

    if (!isServerMode) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>Requires Server Mode</TooltipContent>
        </Tooltip>
      );
    }

    return trigger;
  };

  return (
    <YStack height="100%">
      <YStack flex={1} overflow="hidden" padding="$3">
        <Tabs value={activeTab} onValueChange={setActiveTab} height="100%" flexDirection="column">
          <TabsList width="100%">
            <TabsTrigger value="general" alignItems="center" gap="$1">
              <Settings2 size={12} />
              <SizableText fontSize="$1">General</SizableText>
            </TabsTrigger>
            {backendTabTrigger('functions', <Code2 size={12} />, 'Functions')}
            {backendTabTrigger('helpers', <Wrench size={12} />, 'Helpers')}
            {backendTabTrigger('secrets', <Key size={12} />, 'Secrets')}
            {backendTabTrigger('schedules', <Clock size={12} />, 'Schedules')}
            {backendTabTrigger('schema', <Database size={12} />, 'Schema')}
          </TabsList>

          <YStack flex={1} overflow="hidden" marginTop="$3">
            <TabsContent value="general" height="100%" margin="$0" overflow="scroll">
              <GeneralTab project={project} onProjectUpdate={onProjectUpdate} />
            </TabsContent>

            {!isServerMode ? (
              /* Browser mode: backend tabs show lock screen */
              <>
                {['functions', 'helpers', 'secrets', 'schedules', 'schema'].map(tab => (
                  <TabsContent key={tab} value={tab} height="100%" margin="$0">
                    <XStack height="100%" alignItems="center" justifyContent="center" padding="$6">
                      <SizableText textAlign="center" maxWidth={384} display="flex" flexDirection="column">
                        <Lock size={40} color="$color11" />
                        <H4 fontWeight="500" marginBottom="$2">Server Mode Required</H4>
                        <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                          Backend features require Server Mode. Deploy to a self-hosted instance to use edge functions, secrets, and database features.
                        </Paragraph>
                        <Anchor
                          href="https://github.com/hanzoai/app"
                          target="_blank"
                          rel="noopener noreferrer"
                          fontSize="$3" color="$color12" hoverStyle={{ textDecorationLine: "underline" }}
                        >
                          View setup guide
                        </Anchor>
                      </SizableText>
                    </XStack>
                  </TabsContent>
                ))}
              </>
            ) : !enabled ? (
              /* Server mode but backend disabled */
              <>
                {['functions', 'helpers', 'secrets', 'schedules', 'schema'].map(tab => (
                  <TabsContent key={tab} value={tab} height="100%" margin="$0">
                    <XStack height="100%" alignItems="center" justifyContent="center">
                      <SizableText textAlign="center" maxWidth={320} display="flex" flexDirection="column">
                        <PowerOff size={32} color="$color11" />
                        <Paragraph fontSize="$3" color="$color11">
                          Backend features are disabled for this project. Enable them using the toggle above to manage edge functions, secrets, and more.
                        </Paragraph>
                      </SizableText>
                    </XStack>
                  </TabsContent>
                ))}
              </>
            ) : (
              /* Server mode, backend enabled */
              <>
                <TabsContent value="functions" height="100%" margin="$0">
                  <FunctionsManager dataProvider={functionsProvider} hideRuntimeFeatures />
                </TabsContent>

                <TabsContent value="helpers" height="100%" margin="$0">
                  <ServerFunctionsManager dataProvider={serverFunctionsProvider} />
                </TabsContent>

                <TabsContent value="secrets" height="100%" margin="$0">
                  <SecretsManager dataProvider={secretsProvider} />
                </TabsContent>

                <TabsContent value="schedules" height="100%" margin="$0">
                  <ScheduledFunctionsManager dataProvider={scheduledFunctionsProvider} />
                </TabsContent>

                <TabsContent value="schema" height="100%" margin="$0">
                  <SchemaEditor
                    projectId={project.id}
                    enabled={enabled}
                    onSchemaChange={() => {
                      vfs.refreshServerContext();
                    }}
  />
                </TabsContent>
              </>
            )}
          </YStack>
        </Tabs>
      </YStack>
    </YStack>
  );
}

interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdate: (project: Project) => void;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export function ProjectSettingsModal({ project, isOpen, onClose, onProjectUpdate, enabled, onToggleEnabled }: ProjectSettingsModalProps) {
  const isServerMode = process.env.NEXT_PUBLIC_SERVER_MODE === 'true';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent height="70vh" flexDirection="column" $sm={{ maxWidth: 768 }}>
        <DialogHeader>
          <XStack alignItems="center" justifyContent="space-between" paddingRight="$5">
            <div>
              <DialogTitle alignItems="center" gap="$2">
                <Settings2 size={16} />
                Project Settings
              </DialogTitle>
              <Paragraph fontSize="$3" color="$color11" marginTop="$1">
                {project.name}
              </Paragraph>
            </div>
            {isServerMode && (
              <XStack alignItems="center" gap="$2">
                <SizableText fontSize="$1" color="$color11">Backend {enabled ? 'Enabled' : 'Disabled'}</SizableText>
                <Switch checked={enabled} onCheckedChange={onToggleEnabled} />
              </XStack>
            )}
          </XStack>
        </DialogHeader>
        <YStack flex={1} overflow="hidden">
          <ProjectSettingsPanel project={project} onProjectUpdate={onProjectUpdate} enabled={enabled} />
        </YStack>
      </DialogContent>
    </Dialog>
  );
}
