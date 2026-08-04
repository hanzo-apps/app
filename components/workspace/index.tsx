'use client';

import { SizableText, XStack, YStack } from '@hanzo/gui';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Project, VirtualFile } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { logger } from '@/lib/utils';
import { FileExplorer } from '@/components/file-explorer';
import { MultiTabEditor, openFileInEditor } from '@/components/editor/multi-tab-editor';
import { MultipagePreview, MultipagePreviewHandle } from '@/components/preview/multipage-preview';
import { Button, toast, ResizableHandle, ResizablePanel, ResizablePanelGroup, Tooltip, TooltipContent, TooltipTrigger, Popover, PopoverContent, PopoverTrigger } from '@hanzo/ui';
import { ArrowLeft, MessageSquare, FolderTree, Code2, Eye, Settings, Save, Bug, RotateCcw, History, Settings2 } from 'lucide-react';
import { AppHeader, HeaderAction } from '@/components/ui/app-header';
import { MultiAgentOrchestrator, PendingImage } from '@/lib/llm/multi-agent-orchestrator';
import { configManager, migrateBackendKey } from '@/lib/config/storage';
import { useCostSettings } from '@/lib/hooks/use-cost-settings';
import { getProvider, modelSupportsVision } from '@/lib/llm/providers/registry';
import { debugEventsState } from '@/lib/llm/debug-events-state';
import { checkpointManager } from '@/lib/vfs/checkpoint';
import { saveManager } from '@/lib/vfs/save-manager';
import { SettingsPanel } from '@/components/settings';
import { GuidedTourOverlay } from '@/components/guided-tour/overlay';
import { useGuidedTour } from '@/components/guided-tour/context';
import { GuidedTourTranscriptEvent } from '@/components/guided-tour/types';
import { track } from '@/lib/telemetry';
import { EVENTS } from '@hanzo/event';
import { useAnalytics } from '@hanzo/event/react';
import { FocusContextPayload } from '@/lib/preview/types';
import { DebugPanel, DebugEvent } from '@/components/debug-panel';
import { ChatPanel } from '@/components/chat-panel';
import { DeploymentSelector } from '@/components/workspace/deployment-selector';
import { CheckpointPanel } from '@/components/checkpoint-panel';
import { ProjectSettingsModal } from '@/components/project-backend';

interface WorkspaceProps {
  project: Project;
  onBack: () => void;
}

type FocusTarget = FocusContextPayload & { timestamp: number };

export function Workspace({ project, onBack }: WorkspaceProps) {
  // The ONE telemetry client (@hanzo/event → api.hanzo.ai/v1/event). `track()`
  // above is the LEGACY second pipe (lib/telemetry → an OTel traces endpoint on
  // a frontend host); the build funnel is only computable on the canonical one,
  // so generation outcomes are captured here.
  const analytics = useAnalytics();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentOrchestrator, setCurrentOrchestrator] = useState<MultiAgentOrchestrator | null>(null);
  const [persistedOrchestrator, setPersistedOrchestrator] = useState<MultiAgentOrchestrator | null>(null);
  const [activeMobilePanel, setActiveMobilePanel] = useState<'chat' | 'files' | 'editor' | 'preview'>('preview');
  const [isDirty, setIsDirty] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(project.lastSavedAt ?? null);
  const [entryPoint, setEntryPoint] = useState<string | undefined>(project.settings?.previewEntryPoint);
  const [focusContext, setFocusContext] = useState<FocusTarget | null>(null);
  const [chatMode, setChatMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hanzo-app-chat-mode');
      return stored ? stored === 'true' : false;
    }
    return false;
  });
  const lastFocusSignatureRef = useRef<{ signature: string; timestamp: number } | null>(null);
  const previewRef = useRef<MultipagePreviewHandle>(null);
  const retryTriggerRef = useRef<boolean>(false);
  const [initialCheckpointId, setInitialCheckpointId] = useState<string | null>(null);
  const [checkpointRefreshKey, setCheckpointRefreshKey] = useState(0);
  const [currentModel, setCurrentModel] = useState(configManager.getDefaultModel());
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [projectCost, setProjectCost] = useState(0);
  const { state: tourState, start: startTour, setWorkspaceHandler } = useGuidedTour();
  const tourStep = tourState.currentStep?.id;
  const tourRunning = tourState.status === 'running';
  const isTourLockingInput = tourRunning && tourStep !== 'wrap-up';

  // Get cost settings for conditional display
  const { shouldShowCosts } = useCostSettings();

  // Check if current model supports vision for image input
  const supportsVision = useMemo(() => {
    const currentProvider = configManager.getSelectedProvider();
    const modelId = currentModel || configManager.getDefaultModel();

    // Check cached discovered models first (has accurate modality data from API)
    const cached = configManager.getCachedModels(currentProvider);
    if (cached) {
      const model = (cached.models as import('@/lib/llm/providers/types').ProviderModel[])
        .find(m => m.id === modelId);
      if (model?.supportsVision !== undefined) {
        return model.supportsVision;
      }
    }

    // Fall back to name-based heuristics for hardcoded providers
    return modelSupportsVision(currentProvider, modelId);
  }, [currentModel]);

  // Check if current provider has credentials configured
  const providerReady = useMemo(() => {
    const provider = configManager.getSelectedProvider();
    const config = getProvider(provider);
    if (config.isLocal) return true;
    if (config.apiKeyRequired || config.usesOAuth) return !!configManager.getProviderApiKey(provider);
    return true;
  }, [currentModel]);
  
  const [showChat, setShowChat] = useState(true);    // Column 1: Chat v2 (event-driven)
  const [showFiles, setShowFiles] = useState(true);      // Column 2: File explorer
  const [showEditor, setShowEditor] = useState(false);   // Column 3: Monaco editor
  const [showPreview, setShowPreview] = useState(true);  // Column 4: Live preview
  const [showCheckpoints, setShowCheckpoints] = useState(false); // Column 5: Checkpoint history
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Column 6: Debug events
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false); // Project settings modal

  // Backend enabled state (persisted per-project in localStorage)
  const [backendEnabled, setBackendEnabled] = useState<boolean>(() => {
    return migrateBackendKey(project.id);
  });

  // Backend context state (deployment selection for backend features)
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
  const [selectedDeploymentName, setSelectedDeploymentName] = useState<string | null>(null);

  // Debug events state
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const debugIdCounter = useRef(0);
  const saveDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Maximum debug events to keep in memory to prevent unbounded growth
  const MAX_DEBUG_EVENTS = 500;

  // Debounced save function to persist events array to IndexedDB
  const debouncedSaveEvents = useCallback((events: DebugEvent[]) => {
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }
    saveDebounceTimer.current = setTimeout(() => {
      debugEventsState.saveEvents(project.id, events).catch(error => {
        logger.error('Failed to persist debug events:', error);
      });
    }, 500); // Save after 500ms of inactivity
  }, [project.id]);

  const addDebugEvent = useCallback(async (event: string, data: any) => {
    setDebugEvents(prev => {
      const shouldCoalesce = event === 'assistant_delta' || event === 'tool_param_delta' || event === 'reasoning_delta';

      let newEvents: DebugEvent[];

      // Check if we can coalesce with a recent event of the same type.
      // Search backward through the last few events to handle interleaved
      // streaming (e.g. tool_param_delta / toolCalls / tool_param_delta).
      if (shouldCoalesce && prev.length > 0) {
        const searchLimit = Math.max(0, prev.length - 4);
        for (let i = prev.length - 1; i >= searchLimit; i--) {
          if (prev[i].event === event) {
            const target = prev[i];
            const updatedEvent = {
              ...target,
              timestamp: Date.now(),
              version: (target.version || 1) + 1,
              count: (target.count || 1) + 1,
              data: {
                all: target.data.all
                  ? [...target.data.all, data]
                  : [target.data, data]
              }
            };

            newEvents = [...prev.slice(0, i), updatedEvent, ...prev.slice(i + 1)];
            debouncedSaveEvents(newEvents);
            return newEvents;
          }
        }
      }

      // Different event type or first event - add new
      const debugEvent = {
        id: `${Date.now()}-${debugIdCounter.current++}`,
        timestamp: Date.now(),
        event,
        data,
        count: 1,
        version: 1
      };

      newEvents = [...prev, debugEvent];

      // Prune old events if exceeding limit to prevent memory growth
      if (newEvents.length > MAX_DEBUG_EVENTS) {
        newEvents = newEvents.slice(-MAX_DEBUG_EVENTS);
      }

      debouncedSaveEvents(newEvents);
      return newEvents;
    });
  }, [project.id, debouncedSaveEvents, MAX_DEBUG_EVENTS]);

  const clearDebugEvents = useCallback(async () => {
    setDebugEvents([]);
    await debugEventsState.clearEvents(project.id);
    // Clear auto-checkpoints when conversation is cleared (keep manual saves)
    await checkpointManager.clearAutoCheckpoints(project.id);
    // Clear orchestrator to reset conversation history
    setPersistedOrchestrator(null);
  }, [project.id]);
  
  const getDefaultSizes = () => {
    const visiblePanels = [showChat, showFiles, showEditor, showPreview, showCheckpoints, showDebugPanel].filter(Boolean).length;

    if (visiblePanels >= 5) {
      return { chat: 18, files: 13, editor: 22, preview: 18, checkpoints: 14, debug: 15 };
    } else if (visiblePanels === 4) {
      return { chat: 25, files: 15, editor: 35, preview: 25, checkpoints: 15, debug: 15 };
    } else if (visiblePanels === 3) {
      return { chat: 33, files: 33, editor: 33, preview: 33, checkpoints: 33, debug: 33 };
    } else if (visiblePanels === 2) {
      return { chat: 50, files: 50, editor: 50, preview: 50, checkpoints: 50, debug: 50 };
    }
    return { chat: 100, files: 100, editor: 100, preview: 100, checkpoints: 100, debug: 100 };
  };
  
  const defaultSizes = getDefaultSizes();

  const getModelDisplayName = (modelId: string) => {
    if (!modelId) return 'Select Model';
    const parts = modelId.split('/');
    const modelName = parts[parts.length - 1];
    return modelName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const truncateHtmlSnippet = useCallback((html: string, maxLength: number = 1200) => {
    if (!html) {
      return '';
    }
    if (html.length <= maxLength) {
      return html;
    }
    const headLength = Math.max(0, Math.floor(maxLength * 0.6));
    const tailLength = Math.max(0, Math.floor(maxLength * 0.3));
    const head = html.slice(0, headLength);
    const tail = tailLength > 0 ? html.slice(-tailLength) : '';
    return `${head}\n  (...truncated...)\n${tail}`;
  }, []);

  const describeFocusTarget = useCallback((target: FocusTarget) => {
    const attributeEntries = Object.entries(target.attributes || {}).slice(0, 6);
    if (attributeEntries.length === 0) {
      return `<${target.tagName}>`;
    }
    const summary = attributeEntries
      .map(([key, value]) => {
        const trimmed = value.length > 40 ? `${value.slice(0, 37)}…` : value;
        return `${key}="${trimmed}"`;
      })
      .join(' ');
    return `<${target.tagName} ${summary}>`;
  }, []);

  const formatFocusContextBlock = useCallback((target: FocusTarget) => {
    const descriptor = describeFocusTarget(target);
    const snippet = truncateHtmlSnippet(target.outerHTML, 1200);
    const domPath = target.domPath || '(unknown path)';
    return [
      'Focus context:',
      `- Target: ${descriptor}`,
      `- DOM path: ${domPath}`,
      '- HTML snippet:',
      '```html',
      snippet,
      '```'
    ].join('\n');
  }, [describeFocusTarget, truncateHtmlSnippet]);

  const handleFocusSelection = useCallback((selection: FocusContextPayload | null) => {
    if (!selection) {
      setFocusContext(null);
      lastFocusSignatureRef.current = null;
      return;
    }
    const signature = `${selection.domPath || ''}::${selection.tagName || ''}::${selection.outerHTML ? selection.outerHTML.length : 0}`;
    const now = Date.now();
    if (lastFocusSignatureRef.current && lastFocusSignatureRef.current.signature === signature && (now - lastFocusSignatureRef.current.timestamp) < 400) {
      return;
    }
    const nextTarget: FocusTarget = {
      ...selection,
      timestamp: now
    };
    setFocusContext(nextTarget);
    toast.info('Focus context set', {
      description: describeFocusTarget(nextTarget)
    });
    lastFocusSignatureRef.current = { signature, timestamp: now };
  }, [describeFocusTarget]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  const handleSetEntryPoint = useCallback(async (path: string) => {
    try {
      const proj = await vfs.getProject(project.id);
      proj.settings = { ...proj.settings, previewEntryPoint: path };
      await vfs.updateProject(proj);
      setEntryPoint(path);
      setRefreshTrigger(prev => prev + 1);
      toast.success(`Entry point set to ${path}`);
    } catch (err) {
      logger.error('Failed to set entry point:', err);
      toast.error('Failed to set entry point');
    }
  }, [project.id]);

  const handleAddPromptFile = useCallback(async () => {
    try {
      const { getDomainPrompt } = await import('@/lib/llm/prompts');
      const runtime = project.settings?.runtime || 'static';
      await vfs.createFile(project.id, '/.PROMPT.md', getDomainPrompt(runtime));
      window.dispatchEvent(new CustomEvent('filesChanged', { detail: { projectId: project.id } }));
      toast.success('.PROMPT.md added to project');
    } catch (err) {
      logger.error('Failed to add .PROMPT.md:', err);
      toast.error('Failed to add .PROMPT.md');
    }
  }, [project.id, project.settings?.runtime]);

  const focusDescriptor = focusContext ? describeFocusTarget(focusContext) : '';
  const focusPreviewSnippet = focusContext ? truncateHtmlSnippet(focusContext.outerHTML, 240) : '';

  const trimmedSnippet = focusPreviewSnippet?.trim() ?? '';

  const focusContextHint = focusContext ? (
    <SizableText
      id="focus-context-hint"
      borderRadius="$3" borderWidth={1} borderStyle="dashed" borderColor="$color12" backgroundColor="$color12" paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" color="$color11" elevation={1} display="flex" flexDirection="column"
    >
        <SizableText flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$2" color="$color" display="flex" flexDirection="row">
          <XStack alignItems="center" gap="$2">
            <SizableText fontWeight="500" fontSize="$1" textTransform="uppercase" letterSpacing={0.4} color="$color12">context</SizableText>
            <SizableText fontSize={10} textTransform="uppercase" letterSpacing={0.4} color="$color11">included in next message</SizableText>
          </XStack>
          <Button
            size="sm"
            variant="ghost"
            paddingHorizontal="$2" fontSize="$1"
            onClick={() => setFocusContext(null)}
            title="Clear focus context"
          >
            Clear
          </Button>
        </SizableText>
        <YStack marginTop="$2" rowGap="$2">
        {focusContext.domPath && (
          <SizableText fontSize={11} fontFamily="$mono" color="$color11" wordBreak="break-all" lineHeight={1.375} display="flex" flexDirection="column">
            {focusContext.domPath}
          </SizableText>
        )}
        {trimmedSnippet && (
          <SizableText maxHeight="$12" overflow="scroll" borderRadius="$2" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$2" paddingVertical="$1" fontSize={11} color="$color" lineHeight={1.625} fontFamily="$mono" whiteSpace="pre">
            <code>{trimmedSnippet}</code>
          </SizableText>
        )}
      </YStack>
    </SizableText>
  ) : null;

  useEffect(() => {
    setIsDirty(saveManager.isDirty(project.id));
    const unsubscribe = saveManager.subscribe(({ projectId, dirty }) => {
      if (projectId === project.id) {
        setIsDirty(dirty);
      }
    });
    return () => unsubscribe();
  }, [project.id]);

  // Persist chat mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hanzo-app-chat-mode', String(chatMode));
    }
  }, [chatMode]);

  useEffect(() => {
    let isMounted = true;

    const initializeWorkspace = async () => {
      try {
        await saveManager.syncProjectSaveState(project.id);
        let savedCheckpointId = saveManager.getSavedCheckpointId(project.id);

        if (savedCheckpointId) {
          const restored = await saveManager.restoreLastSaved(project.id);
          if (!restored) {
            logger.warn('[Workspace] Saved checkpoint missing or failed to restore, creating new baseline');
            savedCheckpointId = null;
          }
        }

        // Create a "Starting point" system checkpoint (dedup handled inside createCheckpoint)
        if (!savedCheckpointId) {
          const checkpoint = await checkpointManager.createCheckpoint(project.id, 'Starting point', { kind: 'system' });
          savedCheckpointId = checkpoint.id;
        }

        if (!isMounted) return;

        if (savedCheckpointId) {
          setInitialCheckpointId(savedCheckpointId);
        }

        const latestProject = await vfs.getProject(project.id);
        if (!isMounted) return;
        setLastSavedAt(latestProject.lastSavedAt ?? null);
        setIsDirty(saveManager.isDirty(project.id));

        logger.debug(`[Workspace] Initializing workspace for project: ${project.id}`);

        // Load debug events from IndexedDB
        try {
          const savedEvents = await debugEventsState.loadEvents(project.id);
          if (!isMounted) return;
          if (savedEvents.length > 0) {
            setDebugEvents(savedEvents);
            logger.debug(`[Workspace] Restored ${savedEvents.length} debug events`);
          } else {
            logger.debug(`[Workspace] No saved debug events found`);
          }
        } catch (error) {
          if (!isMounted) return;
          logger.error('Failed to load debug events:', error);
        }
      } catch (error) {
        if (!isMounted) return;
        logger.error('Failed to initialize workspace:', error);
      }
    };

    initializeWorkspace();

    const updateProjectCost = async () => {
      try {
        const currentProject = await vfs.getProject(project.id);
        if (!isMounted) return;
        if (currentProject?.costTracking?.totalCost) {
          setProjectCost(currentProject.costTracking.totalCost);
        } else {
          setProjectCost(0);
        }
      } catch (error) {
        if (!isMounted) return;
        setProjectCost(0);
      }
    };

    updateProjectCost();
    const interval = setInterval(updateProjectCost, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [project.id]);

  useEffect(() => {
    if (!tourRunning) {
      setShowDesktopSettings(false);
      setShowMobileSettings(false);
      return;
    }

    if (tourStep === 'provider-settings') {
      // Open the provider settings popup in the chat panel
      // This will be controlled by the ChatPanel's showMobileSettings state
      // We trigger it by dispatching a custom event
      setShowDesktopSettings(true);
      setShowMobileSettings(true);

      // Trigger the ChatPanel to open its settings popover
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tour-open-provider-settings'));
      }
    } else {
      setShowDesktopSettings(false);
      setShowMobileSettings(false);
    }
  }, [tourRunning, tourStep]);

  useEffect(() => {
    if (!tourRunning) {
      setWorkspaceHandler(null);
      setGenerating(false);
      return;
    }

    // Set generating state based on tour busy state
    setGenerating(tourStep === 'workspace-edit' && tourState.isBusy);

    const handler = async (event: GuidedTourTranscriptEvent) => {
      // Convert tour events to debug events for ChatPanel display
      if (event.role === 'clear' && event.action === 'conversation') {
        await clearDebugEvents();
        return;
      }

      if (event.role === 'user') {
        // User message → conversation_message event
        await addDebugEvent('conversation_message', {
          message: {
            role: 'user',
            content: event.content
          }
        });
      } else if (event.role === 'assistant') {
        // Assistant message → conversation_message event
        const message: any = {
          role: 'assistant',
          content: event.content
        };

        // Store checkpoint ID in UI metadata if present
        if (event.checkpointId) {
          message.ui_metadata = {
            checkpointId: event.checkpointId
          };
        }

        await addDebugEvent('conversation_message', { message });

        // Emit checkpoint_created event if checkpoint ID is present
        if (event.checkpointId) {
          await addDebugEvent('checkpoint_created', {
            checkpointId: event.checkpointId,
            description: `Tour checkpoint: ${event.content.substring(0, 60)}`
          });
        }
      } else if (event.role === 'tool') {
        // Tool call → simulate tool execution sequence
        // 1. Tool call initiated
        const toolCall = {
          id: `tour-tool-${Date.now()}`,
          function: {
            name: event.name,
            arguments: JSON.stringify({ command: event.command })
          }
        };

        await addDebugEvent('toolCalls', {
          toolCalls: [toolCall]
        });

        // 2. Tool status (executing)
        await addDebugEvent('tool_status', {
          toolId: toolCall.id,
          name: event.name,
          status: 'executing'
        });

        // 3. Tool result
        await addDebugEvent('tool_result', {
          toolId: toolCall.id,
          name: event.name,
          result: event.output,
          status: 'completed'
        });

        // 4. Tool message in conversation
        await addDebugEvent('conversation_message', {
          message: {
            role: 'tool',
            content: event.output,
            tool_call_id: toolCall.id
          }
        });
      }
    };

    setWorkspaceHandler(handler);

    return () => {
      setWorkspaceHandler(null);
    };
  }, [tourRunning, tourStep, tourState.isBusy, setWorkspaceHandler, clearDebugEvents, addDebugEvent]);

  // Clear orchestrator when project or chat mode changes
  useEffect(() => {
    setPersistedOrchestrator(null);
  }, [project.id, chatMode]);

  // Auto-mount/unmount project backend context based on enabled toggle
  useEffect(() => {
    let cancelled = false;
    if (process.env.NEXT_PUBLIC_SERVER_MODE === 'true' && backendEnabled) {
      vfs.mountProjectBackendContext(project.id).then(() => {
        if (!cancelled) {
          setRefreshTrigger(prev => prev + 1);
        }
      });
    } else {
      vfs.unmountBackendContext();
      setRefreshTrigger(prev => prev + 1);
    }
    return () => { cancelled = true; };
  }, [project.id, backendEnabled]);

  // MEMORY CLEANUP: Unload project data from singletons when leaving the workspace
  // This prevents memory accumulation across project switches
  useEffect(() => {
    const projectId = project.id;

    return () => {
      // Unload checkpoint data from memory (they stay in IndexedDB)
      checkpointManager.unloadProject(projectId);

      // Clear debug events cache
      debugEventsState.unloadProject(projectId);

      // Clear any pending debounce timer for debug events
      if (saveDebounceTimer.current) {
        clearTimeout(saveDebounceTimer.current);
        saveDebounceTimer.current = null;
      }

      // Clear VFS sync timeout for this project
      vfs.clearSyncTimeout(projectId);

      // Unmount backend context when leaving workspace
      vfs.unmountBackendContext();

      logger.debug(`[Workspace] Cleaned up memory for project ${projectId}`);
    };
  }, [project.id]);

  // Handle deployment selection change - mount/unmount backend context
  const handleDeploymentChange = useCallback(async (deploymentId: string | null, deploymentName: string | null) => {
    setSelectedDeploymentId(deploymentId);
    setSelectedDeploymentName(deploymentName);

    // Reset orchestrator so it picks up new backend context on next message
    setPersistedOrchestrator(null);

    if (deploymentId && deploymentName) {
      await vfs.mountDeploymentRuntimeContext(deploymentId);
      logger.info(`[Workspace] Connected deployment runtime: ${deploymentName}`);
    } else {
      vfs.unmountDeploymentRuntimeContext();
      logger.info('[Workspace] Disconnected deployment runtime');
    }

    // Refresh file tree
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Handle backend toggle
  const handleBackendToggle = useCallback((enabled: boolean) => {
    setBackendEnabled(enabled);
    localStorage.setItem(`osw-backend-${project.id}`, String(enabled));
  }, [project.id]);

  // Handle project settings updates (runtime, entry point)
  const handleProjectSettingsUpdate = useCallback((updated: Project) => {
    // If entry point changed, update local state and refresh preview
    const newEntryPoint = updated.settings?.previewEntryPoint;
    if (newEntryPoint !== entryPoint) {
      setEntryPoint(newEntryPoint);
      setRefreshTrigger(prev => prev + 1);
    }
    // If runtime changed, refresh preview
    if (updated.settings?.runtime !== project.settings?.runtime) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [entryPoint, project.settings?.runtime]);

  const handleFileSelect = useCallback((file: VirtualFile) => {
    // Check if we're on mobile (matches Tailwind's md breakpoint)
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, switch to editor panel and open file
      setActiveMobilePanel('editor');
      setTimeout(() => {
        openFileInEditor(file);
      }, 0);
    } else {
      // Desktop behavior remains the same
      if (!showEditor) {
        setShowEditor(true);
        setTimeout(() => {
          openFileInEditor(file);
        }, 0);
      } else {
        openFileInEditor(file);
      }
    }
  }, [showEditor]);

  const handleFilesChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('filesChanged'));
  }, []);

  const handleSave = useCallback(async () => {
    if (saveInProgress) {
      return;
    }

    setSaveInProgress(true);
    try {
      const checkpoint = await saveManager.save(project.id);
      const latestProject = await vfs.getProject(project.id);

      setLastSavedAt(latestProject.lastSavedAt ?? new Date(checkpoint.timestamp));
      setCheckpointRefreshKey(prev => prev + 1);
      toast.success('Project saved');
    } catch (error) {
      logger.error('Failed to save project', error);
      toast.error('Failed to save project');
    } finally {
      setSaveInProgress(false);
    }

  }, [project.id, saveInProgress]);

  const handleCaptureScreenshot = useCallback(async (screenshot: string) => {
    try {
      const proj = await vfs.getProject(project.id);
      proj.previewImage = screenshot;
      proj.previewUpdatedAt = new Date();
      await vfs.updateProject(proj);
      toast.success('Thumbnail updated');
    } catch (err) {
      logger.error('Failed to save screenshot:', err);
      toast.error('Failed to save thumbnail');
    }
  }, [project.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform?.toLowerCase().includes('mac');
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
      if (!modifierPressed) return;

      if (event.key.toLowerCase() === 's') {
        // If the code editor has focus, let its own Cmd/Ctrl+S handler save the file
        const activeElement = document.activeElement;
        const isCodeEditorFocused = activeElement?.closest('.cm-editor') !== null;

        if (isCodeEditorFocused) {
          // The editor's keydown handler will save the open file
          return;
        }

        // Otherwise, save the project
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleRestoreCheckpoint = useCallback(async (checkpointId: string, description?: string) => {
    try {
      // First check if checkpoint exists
      const exists = await checkpointManager.checkpointExists(checkpointId);
      if (!exists) {
        toast.error('Checkpoint no longer exists - it may have been cleaned up');
        logger.warn(`[Workspace] Checkpoint ${checkpointId} no longer exists`);
        return;
      }

      const success = await saveManager.runWithSuppressedDirty(project.id, () =>
        checkpointManager.restoreCheckpoint(checkpointId)
      );
      if (success) {
        toast.success(`Restored to: ${description || 'checkpoint'}`);
        handleFilesChange();

        const savedId = saveManager.getSavedCheckpointId(project.id);
        if (savedId && savedId === checkpointId) {
          saveManager.markClean(project.id);
          const latestProject = await vfs.getProject(project.id);
          setLastSavedAt(latestProject.lastSavedAt ?? null);
        } else {
          saveManager.markDirty(project.id);
        }
      } else {
        toast.error('Failed to restore checkpoint');
      }
    } catch (error) {
      logger.error('Error restoring checkpoint:', error);
      toast.error('Failed to restore checkpoint');
    }
  }, [handleFilesChange, project.id]);

  const handleScrollToCheckpoint = useCallback((checkpointId: string) => {
    if (!showChat) setShowChat(true);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-checkpoint-id="${checkpointId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary/50');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50'), 2000);
      }
    });
  }, [showChat]);

  const handleRetry = useCallback(async (checkpointId: string) => {
    try {
      // First check if checkpoint exists
      const exists = await checkpointManager.checkpointExists(checkpointId);
      if (!exists) {
        toast.error('Checkpoint no longer exists - cannot retry');
        logger.warn(`[Workspace] Checkpoint ${checkpointId} no longer exists`);
        return;
      }

      // Find the user message associated with this checkpoint
      // Search backwards from the checkpoint to find the most recent user message
      let userMessageContent = null;
      const checkpointEventIndex = debugEvents.findIndex(
        e => e.event === 'checkpoint_created' && e.data?.checkpointId === checkpointId
      );

      if (checkpointEventIndex >= 0) {
        // Search backwards from checkpoint event to find user message (in conversation_message events)
        for (let i = checkpointEventIndex - 1; i >= 0; i--) {
          if (debugEvents[i].event === 'conversation_message' &&
              debugEvents[i].data?.message?.role === 'user') {
            userMessageContent = debugEvents[i].data.message.content;
            break;
          }
        }
      }

      if (!userMessageContent) {
        toast.error('Cannot find original user message to retry');
        logger.warn('[Workspace] No user message found before checkpoint');
        return;
      }

      // Find the user message event index to truncate debug events
      let userMessageIndex = -1;
      for (let i = checkpointEventIndex - 1; i >= 0; i--) {
        if (debugEvents[i].event === 'conversation_message' &&
            debugEvents[i].data?.message?.role === 'user' &&
            debugEvents[i].data.message.content === userMessageContent) {
          userMessageIndex = i;
          break;
        }
      }

      if (userMessageIndex === -1) {
        toast.error('Cannot find user message event to truncate');
        logger.warn('[Workspace] User message event not found in debug events');
        return;
      }

      // Restore the checkpoint
      const success = await saveManager.runWithSuppressedDirty(project.id, () =>
        checkpointManager.restoreCheckpoint(checkpointId)
      );
      if (!success) {
        toast.error('Failed to restore checkpoint');
        return;
      }

      const savedId = saveManager.getSavedCheckpointId(project.id);
      if (savedId && savedId === checkpointId) {
        saveManager.markClean(project.id);
        const latestProject = await vfs.getProject(project.id);
        setLastSavedAt(latestProject.lastSavedAt ?? null);
      } else {
        saveManager.markDirty(project.id);
      }

      // Truncate debug events to remove the user message and all subsequent events
      // The user message will be re-added by the orchestrator when generation runs
      const truncatedEvents = debugEvents.slice(0, userMessageIndex);
      setDebugEvents(truncatedEvents);
      await debugEventsState.truncateEvents(project.id, truncatedEvents);

      // Clear the persisted orchestrator to force fresh conversation rebuild
      setPersistedOrchestrator(null);

      toast.success('Restored checkpoint and retrying...');
      handleFilesChange();

      // Set the prompt to the original user message
      setPrompt(userMessageContent);

      // Set the retry trigger ref to initiate generation
      // This will be picked up by the useEffect watching the prompt
      retryTriggerRef.current = true;

    } catch (error) {
      logger.error('Error during retry:', error);
      toast.error('Failed to retry');
    }
  }, [handleFilesChange, project.id, debugEvents, setPrompt]);

  const handleGenerate = async (images?: PendingImage[]) => {
    if (isTourLockingInput) {
      return;
    }

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt && (!images || images.length === 0)) {
      toast.error('Please enter a prompt');
      return;
    }

    const currentProvider = configManager.getSelectedProvider();
    const providerConfig = getProvider(currentProvider);
    const apiKey = configManager.getApiKey();

    // Only require API key for providers that need it
    if (providerConfig.apiKeyRequired && !apiKey) {
      toast.error(`Please set your ${providerConfig.name} API key in settings`);
      return;
    }

    // For local providers, check if they have models available
    if (providerConfig.isLocal) {
      const currentModel = configManager.getProviderModel(currentProvider);
      if (!currentModel) {
        toast.error(`No model selected for ${providerConfig.name}. Please select a model in settings.`);
        return;
      }
    }

    // Determine which model to use based on chat mode
    let modelToUse = configManager.getProviderModel(currentProvider) || configManager.getDefaultModel();
    if (typeof window !== 'undefined') {
      const useSeparateChatModel = localStorage.getItem(`hanzo-app-use-separate-chat-model-${currentProvider}`) === 'true';
      if (useSeparateChatModel) {
        if (chatMode) {
          const chatModel = localStorage.getItem(`hanzo-app-chat-model-${currentProvider}`);
          if (chatModel) modelToUse = chatModel;
        } else {
          const codeModel = localStorage.getItem(`hanzo-app-code-model-${currentProvider}`);
          if (codeModel) modelToUse = codeModel;
        }
      }
    }

    // Validate that we have a model selected
    if (!modelToUse) {
      toast.error(`No model selected for ${chatMode ? 'chat' : 'code'} mode. Please select a model in settings.`);
      return;
    }

    setGenerating(true);
    track('task_started', { provider: currentProvider, model: modelToUse });
    const taskStartTime = Date.now();
    const messageContent = focusContext
      ? `${formatFocusContextBlock(focusContext)}\n\n${trimmedPrompt}`
      : trimmedPrompt;

    // Note: User message will be added by orchestrator via conversation_message event
    // No need to manually add user_message event here to avoid duplication

    try {
      // Reuse existing orchestrator or create new one
      let orchestrator = persistedOrchestrator;

      // Create new orchestrator if:
      // 1. No existing orchestrator
      // 2. Chat mode changed (not implemented yet - would need to store mode)
      // 3. Model changed (not implemented yet - would need to store model)
      if (!orchestrator) {
        orchestrator = new MultiAgentOrchestrator(
          project.id,
          'orchestrator',
          addDebugEvent,
          { chatMode, model: modelToUse }
        );

        // Extract and restore conversation history from debug events
        const conversationMessages = debugEvents
          .filter(event => event.event === 'conversation_message')
          .map(event => event.data.message);

        if (conversationMessages.length > 0) {
          orchestrator.importConversation(conversationMessages);
          logger.debug(`[Workspace] Restored ${conversationMessages.length} conversation messages from debug events`);
        }

        setPersistedOrchestrator(orchestrator);
      }

      // Store orchestrator reference for stop functionality
      setCurrentOrchestrator(orchestrator);

      // Build images array for orchestrator
      const imageData = images?.map(img => ({
        data: img.data,
        mediaType: img.mediaType
      }));

      // Execute - orchestrator handles conversation history internally
      const result = await orchestrator.execute(messageContent, imageData?.length ? { images: imageData } : undefined);

      logger.debug('[Workspace] Orchestrator result:', {
        success: result.success,
        summary: result.summary,
        totalCost: result.totalCost
      });

      if (result.success) {
        handleFilesChange();

        // Re-fetch backend context to ensure file explorer shows latest state
        if (vfs.hasServerContext()) {
          await vfs.refreshServerContext();
        }

        track('task_complete', {
          provider: currentProvider,
          model: modelToUse,
          duration_ms: Date.now() - taskStartTime,
        });
        // FUNNELS.appShip step 3 — "got a working build". Identifiers + duration
        // only; never the prompt or the generated code.
        analytics.capture(EVENTS.GENERATION_COMPLETED, {
          provider: currentProvider,
          model: modelToUse,
          mode: chatMode ? 'chat' : 'code',
          durationMs: Date.now() - taskStartTime,
        });
        toast.success('Task completed');
      } else {
        track('task_fail', {
          provider: currentProvider,
          model: modelToUse,
          reason: 'error',
          duration_ms: Date.now() - taskStartTime,
        });
        analytics.capture(EVENTS.GENERATION_FAILED, {
          provider: currentProvider,
          model: modelToUse,
          mode: chatMode ? 'chat' : 'code',
          reason: 'result_error',
          durationMs: Date.now() - taskStartTime,
        });
        toast.error(result.summary || 'Generation failed', {
          duration: 5000
        });
      }

      setPrompt('');
      if (focusContext) {
        setFocusContext(null);
      }
    } catch (error) {
      logger.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate';

      track('task_fail', {
        provider: currentProvider,
        model: modelToUse,
        reason: 'error',
        duration_ms: Date.now() - taskStartTime,
      });
      analytics.capture(EVENTS.GENERATION_FAILED, {
        provider: currentProvider,
        model: modelToUse,
        mode: chatMode ? 'chat' : 'code',
        reason: 'exception',
        durationMs: Date.now() - taskStartTime,
      });
      // The thrown error itself belongs in the error lens, joined to the drop.
      analytics.captureError(error, { properties: { where: 'workspace_generate' } });

      // Emit error event to clear thinking indicator in chat panel
      addDebugEvent('error', { message: errorMessage });

      toast.error(errorMessage, {
        duration: 5000
      });
    } finally {
      setGenerating(false);
      // Don't clear currentOrchestrator - only used for stop functionality
      // The persisted orchestrator maintains conversation history
      setCurrentOrchestrator(null);
    }
  };

  const handleStop = useCallback(() => {
    if (currentOrchestrator) {
      currentOrchestrator.stop();
      track('task_fail', {
        provider: configManager.getSelectedProvider(),
        model: configManager.getDefaultModel(),
        reason: 'stopped',
      });
      toast.info('Generation stopped');
    }
  }, [currentOrchestrator]);

  // Watch for retry trigger and execute generation
  useEffect(() => {
    if (retryTriggerRef.current && prompt.trim()) {
      // Use setTimeout to ensure the prompt state has fully updated
      setTimeout(() => {
        handleGenerate();
        // Reset the retry flag after generation starts
        retryTriggerRef.current = false;
      }, 50);
    }
  }, [prompt]);

  const headerActions: HeaderAction[] = [
    {
      id: 'back',
      label: 'Back to projects',
      icon: ArrowLeft,
      onClick: onBack,
      variant: 'outline'
    }
  ];

  headerActions.push({
    id: 'save',
    label: saveInProgress ? 'Saving…' : isDirty ? 'Save' : 'Saved',
    icon: Save,
    onClick: handleSave,
    variant: isDirty ? 'default' : 'outline',
    disabled: !isDirty || saveInProgress
  });

  if (initialCheckpointId) {
    headerActions.push({
      id: 'discard',
      label: 'Discard Changes',
      icon: RotateCcw,
      onClick: () => handleRestoreCheckpoint(initialCheckpointId, 'Last saved state'),
      variant: 'outline',
      disabled: saveInProgress || !isDirty,
      dataTourId: 'discard-changes-button'
    });
  }

  // Desktop header content: Deployment selector + Settings
  const desktopHeaderContent = (
    <XStack alignItems="center" gap="$3">
      {/* Deployment selector for backend context */}
      <DeploymentSelector
        projectId={project.id}
        selectedDeploymentId={selectedDeploymentId}
        onDeploymentChange={handleDeploymentChange}
  />

      {/* Project settings button */}
      <Button
        variant="outline"
        size="sm"
        height="$6" paddingHorizontal="$3" alignItems="center" gap="$2"
        onClick={() => setShowProjectSettingsModal(true)}
        title="Project Settings"
      >
        <Settings2 size={16} />
        <SizableText fontSize="$3" display="none">Project</SizableText>
      </Button>

      {/* Settings popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            height="$6" paddingHorizontal="$3" alignItems="center" gap="$2"
            title="Project cost and settings"
          >
            {shouldShowCosts && (
              <SizableText fontSize="$3" fontWeight="500">
                ${projectCost.toFixed(3)}
              </SizableText>
            )}
            <Settings size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent width={460} maxHeight="min(720px,calc(100vh-5rem))" overflow="hidden" flexDirection="column" align="end">
          <SettingsPanel />
        </PopoverContent>
      </Popover>
    </XStack>
  );

  const mobileMenuContent = (
    <YStack rowGap="$2">
      {shouldShowCosts && (
        <YStack paddingBottom="$2" borderBottomWidth={1} borderColor="$borderColor">
          <SizableText fontSize="$3" fontWeight="500">
            Project cost: ${projectCost.toFixed(projectCost >= 10 ? 2 : 3)}
          </SizableText>
        </YStack>
      )}
      <Button
        variant="outline"
        size="sm"
        width="100%" justifyContent="flex-start"
        onClick={() => setShowProjectSettingsModal(true)}
      >
        <Settings2 size={16} />
        Project Settings
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            width="100%" justifyContent="flex-start"
          >
            <Settings size={16} />
            Settings
          </Button>
        </PopoverTrigger>
        <PopoverContent width={460} maxWidth="calc(100vw-2rem)" maxHeight="min(720px,calc(100vh-5rem))" overflow="hidden" flexDirection="column" align="start">
          <SettingsPanel />
        </PopoverContent>
      </Popover>
    </YStack>
  );

  return (
    <>
      <YStack height="100%">
        {/* Header */}
        <AppHeader
          leftText={project.name}
          onLogoClick={onBack}
          actions={headerActions}
          mobileMenuContent={mobileMenuContent}
          desktopOnlyContent={desktopHeaderContent}
          mobileVisibleActions={isDirty ? ['save'] : []}
  />

        {/* Desktop Workspace */}
        <YStack display="none" flex={1} overflow="hidden" backgroundColor="$background">
          {/* Left sidebar for panel toggles */}
          <YStack width="$7" backgroundColor="$color3" borderRightWidth={1} borderColor="$borderColor" alignItems="center" paddingVertical="$3" gap="$1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  height="$4.5" width="$4.5" paddingHorizontal="$1" borderRadius="$1" alignItems="center" justifyContent="center" {...{ elevation: showChat ? 1 : undefined, backgroundColor: showChat ? undefined : "transparent", color: showChat ? undefined : "$color11", hoverStyle: showChat ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                  style={{
                    backgroundColor: showChat ? 'var(--brand-accent)' : undefined,
                    color: showChat ? 'white' : undefined
                  }}
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Chat</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  height="$4.5" width="$4.5" paddingHorizontal="$1" borderRadius="$1" alignItems="center" justifyContent="center" {...{ elevation: showFiles ? 1 : undefined, backgroundColor: showFiles ? undefined : "transparent", color: showFiles ? undefined : "$color11", hoverStyle: showFiles ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                  style={{
                    backgroundColor: showFiles ? 'var(--brand-accent)' : undefined,
                    color: showFiles ? 'white' : undefined
                  }}
                  onClick={() => setShowFiles(!showFiles)}
                >
                  <FolderTree size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>File Explorer</p>
              </TooltipContent>
            </Tooltip>
          
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  height="$4.5" width="$4.5" paddingHorizontal="$1" borderRadius="$1" alignItems="center" justifyContent="center" {...{ elevation: showEditor ? 1 : undefined, backgroundColor: showEditor ? undefined : "transparent", color: showEditor ? undefined : "$color11", hoverStyle: showEditor ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                  style={{
                    backgroundColor: showEditor ? 'var(--brand-accent)' : undefined,
                    color: showEditor ? 'white' : undefined
                  }}
                  onClick={() => setShowEditor(!showEditor)}
                >
                  <Code2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Code Editor</p>
              </TooltipContent>
            </Tooltip>
          
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  height="$4.5" width="$4.5" marginHorizontal="$1" borderRadius="$1" alignItems="center" justifyContent="center" {...{ elevation: showPreview ? 1 : undefined, backgroundColor: showPreview ? undefined : "transparent", color: showPreview ? undefined : "$color11", hoverStyle: showPreview ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                  style={{
                    backgroundColor: showPreview ? 'var(--brand-accent)' : undefined,
                    color: showPreview ? 'white' : undefined
                  }}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Preview</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  height="$4.5" width="$4.5" paddingHorizontal="$1" borderRadius="$1" alignItems="center" justifyContent="center" {...{ elevation: showCheckpoints ? 1 : undefined, backgroundColor: showCheckpoints ? undefined : "transparent", color: showCheckpoints ? undefined : "$color11", hoverStyle: showCheckpoints ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                  style={{
                    backgroundColor: showCheckpoints ? 'var(--brand-accent)' : undefined,
                    color: showCheckpoints ? 'white' : undefined
                  }}
                  onClick={() => setShowCheckpoints(!showCheckpoints)}
                >
                  <History size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Checkpoints</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  height="$4.5" width="$4.5" paddingHorizontal="$1" borderRadius="$1" alignItems="center" justifyContent="center" {...{ backgroundColor: showDebugPanel ? "$color" : "transparent", elevation: showDebugPanel ? 1 : undefined, color: showDebugPanel ? undefined : "$color11", hoverStyle: showDebugPanel ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                  style={{
                    color: showDebugPanel ? 'var(--background)' : undefined
                  }}
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                >
                  <Bug size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Debug Events</p>
              </TooltipContent>
            </Tooltip>

          </YStack>
        
          {/* Main content area */}
          <YStack flex={1} padding="$2" overflow="hidden" data-tour-id="workspace-panels">
          <ResizablePanelGroup direction="horizontal" autoSaveId="workspace-layout">
            {/* Column 1: Chat Panel */}
            {showChat && (
              <ResizablePanel
                id="chat"
                order={1}
                defaultSize={defaultSizes.chat}
                minSize={15}
              >
                <ChatPanel
                  events={debugEvents}
                  onRestore={handleRestoreCheckpoint}
                  onRetry={handleRetry}
                  prompt={prompt}
                  setPrompt={setPrompt}
                  generating={generating}
                  onGenerate={handleGenerate}
                  onStop={handleStop}
                  focusContext={focusContext}
                  setFocusContext={setFocusContext}
                  focusPreviewSnippet={focusPreviewSnippet}
                  chatMode={chatMode}
                  setChatMode={setChatMode}
                  currentModel={currentModel}
                  setCurrentModel={setCurrentModel}
                  getModelDisplayName={getModelDisplayName}
                  isTourLockingInput={isTourLockingInput}
                  onClearChat={clearDebugEvents}
                  onClose={() => setShowChat(false)}
                  supportsVision={supportsVision}
                  providerReady={providerReady}
  />
              </ResizablePanel>
            )}
            {showChat && (showFiles || showEditor || showPreview || showCheckpoints || showDebugPanel) && (
              <ResizableHandle withHandle />
            )}

            {/* Column 2: File Explorer */}
            {showFiles && (
              <ResizablePanel
                id="files"
                order={2}
                defaultSize={defaultSizes.files}
                minSize={14}
              >
                <YStack height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden" position="relative" style={{ background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)`, minWidth: '240px' }}>
                      <FileExplorer
                        projectId={project.id}
                        onFileSelect={handleFileSelect}
                        onClose={() => setShowFiles(false)}
                        entryPoint={entryPoint}
                        onSetEntryPoint={handleSetEntryPoint}
                        onAddPromptFile={handleAddPromptFile}
  />
                    </YStack>
                </ResizablePanel>
            )}
            {showFiles && (showEditor || showPreview || showCheckpoints || showDebugPanel) && (
              <ResizableHandle withHandle />
            )}

            {/* Column 3: Code Editor */}
            {showEditor && (
              <ResizablePanel
                id="editor"
                order={3}
                defaultSize={defaultSizes.editor}
                minSize={20}
              >
                <YStack height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden" position="relative" style={{ background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)`, minWidth: '240px' }}>
                      <MultiTabEditor
                        projectId={project.id}
                        runtime={project.settings?.runtime}
                        onFilesChange={handleFilesChange}
                        onClose={() => setShowEditor(false)}
  />
                    </YStack>
                </ResizablePanel>
            )}
            {showEditor && (showPreview || showCheckpoints || showDebugPanel) && (
              <ResizableHandle withHandle />
            )}

            {/* Column 4: Preview */}
            {showPreview && (
              <ResizablePanel
                id="preview"
                order={4}
                defaultSize={defaultSizes.preview}
                minSize={20}
              >
                <YStack height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden" position="relative" style={{ background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)`, minWidth: '240px' }}>
                      <MultipagePreview
                        ref={previewRef}
                        projectId={project.id}
                        refreshTrigger={refreshTrigger}
                        onFocusSelection={handleFocusSelection}
                        hasFocusTarget={Boolean(focusContext)}
                        onClose={handleClosePreview}
                        deploymentId={selectedDeploymentId}
                        onCaptureScreenshot={handleCaptureScreenshot}
                        entryPoint={entryPoint}
                        runtime={project.settings?.runtime}
  />
                    </YStack>
                </ResizablePanel>
            )}

            {showPreview && (showCheckpoints || showDebugPanel) && <ResizableHandle withHandle />}

            {/* Column 5: Checkpoint Panel */}
            {showCheckpoints && (
              <ResizablePanel
                id="checkpoints"
                order={5}
                defaultSize={defaultSizes.checkpoints}
                minSize={12}
              >
                <CheckpointPanel
                  projectId={project.id}
                  events={debugEvents}
                  currentCheckpointId={checkpointManager.getCurrentCheckpoint()?.id}
                  onRestore={handleRestoreCheckpoint}
                  onScrollToTurn={handleScrollToCheckpoint}
                  onClose={() => setShowCheckpoints(false)}
                  refreshKey={checkpointRefreshKey}
  />
              </ResizablePanel>
            )}

            {showCheckpoints && showDebugPanel && <ResizableHandle withHandle />}

            {/* Column 6: Debug Panel */}
            {showDebugPanel && (
              <ResizablePanel
                id="debug"
                order={6}
                defaultSize={defaultSizes.debug}
                minSize={15}
              >
                <DebugPanel events={debugEvents} onClear={clearDebugEvents} onClose={() => setShowDebugPanel(false)} projectId={project.id} />
              </ResizablePanel>
            )}

          </ResizablePanelGroup>
          </YStack>
        </YStack>

        {/* Mobile Workspace */}
        <YStack flex={1} overflow="hidden" backgroundColor="$background" $md={{ display: "none" }}>
          {/* Single active panel */}
          <YStack flex={1} padding="$2" paddingBottom="$10" overflow="hidden">
            {activeMobilePanel === 'chat' && (
              <ChatPanel
                events={debugEvents}
                onRestore={handleRestoreCheckpoint}
                onRetry={handleRetry}
                prompt={prompt}
                setPrompt={setPrompt}
                generating={generating}
                onGenerate={handleGenerate}
                onStop={handleStop}
                focusContext={focusContext}
                setFocusContext={setFocusContext}
                focusPreviewSnippet={focusPreviewSnippet}
                chatMode={chatMode}
                setChatMode={setChatMode}
                currentModel={currentModel}
                setCurrentModel={setCurrentModel}
                getModelDisplayName={getModelDisplayName}
                isTourLockingInput={isTourLockingInput}
                onClearChat={clearDebugEvents}
                supportsVision={supportsVision}
                providerReady={providerReady}
  />
            )}

            {activeMobilePanel === 'files' && (
              <YStack height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden" position="relative" style={{ background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)` }}>
                <FileExplorer
                  projectId={project.id}
                  onFileSelect={handleFileSelect}
                  onClose={() => setShowFiles(false)}
                  entryPoint={entryPoint}
                  onSetEntryPoint={handleSetEntryPoint}
                  onAddPromptFile={handleAddPromptFile}
  />
              </YStack>
            )}

            {activeMobilePanel === 'editor' && (
              <YStack height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden" position="relative" style={{ background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)` }}>
                <MultiTabEditor
                  projectId={project.id}
                  runtime={project.settings?.runtime}
                  onFilesChange={handleFilesChange}
                  onClose={() => setShowEditor(false)}
  />
              </YStack>
            )}

            {activeMobilePanel === 'preview' && (
              <YStack height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden" position="relative" style={{ background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)` }}>
                <MultipagePreview
                  ref={previewRef}
                  projectId={project.id}
                  refreshTrigger={refreshTrigger}
                  onFocusSelection={handleFocusSelection}
                  hasFocusTarget={Boolean(focusContext)}
                  onClose={handleClosePreview}
                  deploymentId={selectedDeploymentId}
                  onCaptureScreenshot={handleCaptureScreenshot}
                  entryPoint={entryPoint}
                  runtime={project.settings?.runtime}
  />
              </YStack>
            )}
          </YStack>

          {/* Bottom Navigation Bar */}
          <YStack position="fixed" bottom="$0" left="$0" right="$0" backgroundColor="$background" borderTopWidth={1} borderColor="$borderColor">
            <XStack justifyContent="center" alignItems="center" padding="$2" gap="$2">
              <Button
                alignItems="center" justifyContent="center" paddingVertical="$2" paddingHorizontal="$2" borderRadius="$5" elevation={1} {...{ color: activeMobilePanel === 'chat' ? "white" : "$color11", backgroundColor: activeMobilePanel === 'chat' ? undefined : "transparent", hoverStyle: activeMobilePanel === 'chat' ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                style={{
                  backgroundColor: activeMobilePanel === 'chat' ? 'var(--brand-accent)' : undefined,
                }}
                onClick={() => setActiveMobilePanel('chat')}
              >
                <MessageSquare size={16} />
              </Button>
            
              <Button
                alignItems="center" justifyContent="center" paddingVertical="$2" paddingHorizontal="$2" borderRadius="$5" elevation={1} {...{ color: activeMobilePanel === 'files' ? "white" : "$color11", backgroundColor: activeMobilePanel === 'files' ? undefined : "transparent", hoverStyle: activeMobilePanel === 'files' ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                style={{
                  backgroundColor: activeMobilePanel === 'files' ? 'var(--brand-accent)' : undefined,
                }}
                onClick={() => setActiveMobilePanel('files')}
              >
                <FolderTree size={16} />
              </Button>
            
              <Button
                alignItems="center" justifyContent="center" paddingVertical="$2" paddingHorizontal="$2" borderRadius="$5" elevation={1} {...{ color: activeMobilePanel === 'editor' ? "white" : "$color11", backgroundColor: activeMobilePanel === 'editor' ? undefined : "transparent", hoverStyle: activeMobilePanel === 'editor' ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                style={{
                  backgroundColor: activeMobilePanel === 'editor' ? 'var(--brand-accent)' : undefined,
                }}
                onClick={() => setActiveMobilePanel('editor')}
              >
                <Code2 size={16} />
              </Button>
            
              <Button
                alignItems="center" justifyContent="center" paddingVertical="$2" paddingHorizontal="$2" borderRadius="$5" elevation={1} {...{ color: activeMobilePanel === 'preview' ? "white" : "$color11", backgroundColor: activeMobilePanel === 'preview' ? undefined : "transparent", hoverStyle: activeMobilePanel === 'preview' ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                style={{
                  backgroundColor: activeMobilePanel === 'preview' ? 'var(--brand-accent)' : undefined,
                }}
                onClick={() => setActiveMobilePanel('preview')}
              >
                <Eye size={16} />
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>

      <GuidedTourOverlay location="workspace" />
      <GuidedTourOverlay location="settings" />

      <ProjectSettingsModal
        project={project}
        isOpen={showProjectSettingsModal}
        onClose={() => setShowProjectSettingsModal(false)}
        onProjectUpdate={handleProjectSettingsUpdate}
        enabled={backendEnabled}
        onToggleEnabled={handleBackendToggle}
  />
    </>
  );
}
