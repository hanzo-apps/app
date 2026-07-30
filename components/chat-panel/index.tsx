'use client';

import { SizableText, YStack, XStack, Image } from '@hanzo/gui';
import { useState, useEffect, useRef, useMemo, useCallback, DragEvent, ClipboardEvent } from 'react';
import { MessageSquare, Loader2, CheckCircle, XCircle, ChevronRight, FileCode, ClipboardList, Bot, RotateCcw, RefreshCw, Send, ChevronUp, ChevronDown, Code, Trash2, X, Brain, Image as ImageIcon } from 'lucide-react';
import { DebugEvent } from '@/components/debug-panel';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button, Textarea, Popover, PopoverContent, PopoverTrigger, Tabs, TabsList, TabsTrigger } from '@hanzo/ui';
import { ModelSettingsPanel } from '@/components/settings/model-settings';
import { FocusContextPayload } from '@/lib/preview/types';
import { PendingImage } from '@/lib/llm/multi-agent-orchestrator';
import { ContentBlock } from '@/lib/llm/types';
import { EVENTS } from '@hanzo/event';
import { useAnalytics } from '@hanzo/event/react';

type FocusTarget = FocusContextPayload & { timestamp: number };

// Helper to render user message content (string or ContentBlock[])
function UserMessageContent({ content }: { content: string | ContentBlock[] }) {
  if (typeof content === 'string') {
    return <SizableText whiteSpace="pre-wrap" display="flex" flexDirection="column">{content}</SizableText>;
  }

  // Separate text and image blocks
  const textBlocks = content.filter(b => b.type === 'text');
  const imageBlocks = content.filter(b => b.type === 'image_url');

  return (
    <YStack rowGap="$2">
      {/* Render text blocks */}
      {textBlocks.map((block, index) => (
        <SizableText key={`text-${index}`} whiteSpace="pre-wrap" display="flex" flexDirection="column">
          {block.type === 'text' && block.text}
        </SizableText>
      ))}

      {/* Render images in a flex container */}
      {imageBlocks.length > 0 && (
        <XStack flexWrap="wrap" gap="$2" padding="$1" borderRadius="$3" backgroundColor="$color3">
          {imageBlocks.map((block, index) => (
            block.type === 'image_url' && (
              <Image
                key={`img-${index}`}
                src={block.image_url.url}
                alt="Attached image"
                height={60} width="auto" borderRadius="$2" borderWidth={1} borderColor="$borderColor" objectFit="cover"
  />
            )
          ))}
        </XStack>
      )}
    </YStack>
  );
}

interface ChatPanelProps {
  events: DebugEvent[];
  onRestore?: (checkpointId: string) => void;
  onRetry?: (checkpointId: string) => void;
  // Input functionality
  prompt: string;
  setPrompt: (value: string) => void;
  generating: boolean;
  onGenerate: (images?: PendingImage[]) => void;
  onStop: () => void;
  // Focus context
  focusContext: FocusTarget | null;
  setFocusContext: (context: FocusTarget | null) => void;
  focusPreviewSnippet?: string;
  // Settings
  chatMode: boolean;
  setChatMode: (mode: boolean) => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  getModelDisplayName: (modelId: string) => string;
  // Tour/lock state
  isTourLockingInput?: boolean;
  // Clear chat
  onClearChat?: () => void;
  // Close panel
  onClose?: () => void;
  // Vision support
  supportsVision?: boolean;
  // Provider has credentials configured
  providerReady?: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  parameters?: any;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface TurnItem {
  id: string;
  type: 'waiting' | 'reasoning' | 'plan' | 'agent' | 'progress' | 'tool' | 'text' | 'error' | 'user' | 'synthetic_error' | 'project_context';
  timestamp: number;
  data: any;
  eventId?: string;  // Links item to its source debug event (for coalesced updates)
}

interface Turn {
  id: string;
  items: TurnItem[];
  usage?: any;
  iteration?: number;
  checkpointId?: string;
}

const toolIcons: Record<string, React.ReactNode> = {
  shell: <ChevronRight size={12} color="$blue9" />,
  write: <FileCode size={12} color="$orange9" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Loader2 size={12} color="$color8" />,
  executing: <Loader2 size={12} color="$blue9" />,
  completed: <CheckCircle size={12} color="$green9" />,
  failed: <XCircle size={12} color="$red9" />,
};

export function ChatPanel({
  events,
  onRestore,
  onRetry,
  prompt,
  setPrompt,
  generating,
  onGenerate,
  onStop,
  focusContext,
  setFocusContext,
  focusPreviewSnippet,
  chatMode,
  setChatMode,
  currentModel,
  setCurrentModel,
  getModelDisplayName,
  isTourLockingInput = false,
  onClearChat,
  onClose,
  supportsVision = false,
  providerReady = true,
}: ChatPanelProps) {
  const analytics = useAnalytics();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const isScrollingProgrammatically = useRef(false);

  // Image handling state
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Handle image drop
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (!supportsVision) return;

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    );

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const [header, data] = dataUrl.split(',');
        const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png';

        setPendingImages(prev => [...prev, {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          data,
          mediaType,
          preview: dataUrl
        }]);
      };
      reader.readAsDataURL(file);
    }
  }, [supportsVision]);

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (supportsVision) {
      setIsDragging(true);
    }
  }, [supportsVision]);

  // Handle drag leave
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!supportsVision) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const [header, data] = dataUrl.split(',');
            const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png';

            setPendingImages(prev => [...prev, {
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              data,
              mediaType,
              preview: dataUrl
            }]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, [supportsVision]);

  // Remove a pending image
  const removeImage = useCallback((imageId: string) => {
    setPendingImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  // Handle send with images
  const handleSend = useCallback(() => {
    // Core builder engagement loop — enumerated props only, never the message text.
    analytics.capture(EVENTS.CHAT_MESSAGE_SENT, { hasImages: pendingImages.length > 0 });
    if (pendingImages.length > 0) {
      onGenerate(pendingImages);
      setPendingImages([]);
    } else {
      onGenerate();
    }
  }, [onGenerate, pendingImages, analytics]);

  // Listen for tour event to open provider settings
  useEffect(() => {
    const handleTourOpenSettings = () => {
      setShowMobileSettings(true);
    };

    window.addEventListener('tour-open-provider-settings', handleTourOpenSettings);
    return () => {
      window.removeEventListener('tour-open-provider-settings', handleTourOpenSettings);
    };
  }, []);

  // Track state for incremental processing
  const lastProcessedIndexRef = useRef(0);
  const lastEventVersionsRef = useRef<Map<string, number>>(new Map());
  const turnsStateRef = useRef<{
    result: Turn[];
    currentTurn: Turn;
    currentIterationTools: ToolCall[];
    itemIdCounter: number;
  }>({
    result: [],
    currentTurn: { id: `turn-${Date.now()}`, items: [] },
    currentIterationTools: [],
    itemIdCounter: 0,
  });

  // Transform events into turns with chronologically ordered items (incremental)
  const turns = useMemo(() => {
    const state = turnsStateRef.current;
    const newEventsCount = events.length - lastProcessedIndexRef.current;

    // If events array was cleared/reset (new conversation), reset state
    if (events.length === 0 || lastProcessedIndexRef.current > events.length) {
      lastProcessedIndexRef.current = 0;
      lastEventVersionsRef.current = new Map();
      turnsStateRef.current = {
        result: [],
        currentTurn: { id: `turn-${Date.now()}`, items: [] },
        currentIterationTools: [],
        itemIdCounter: 0,
      };
      return [];
    }

    // Check if last event is a streaming event that was updated
    const lastEvent = events[events.length - 1];
    const isStreamingEvent = lastEvent && (lastEvent.event === 'assistant_delta' || lastEvent.event === 'tool_param_delta' || lastEvent.event === 'reasoning_delta');
    const lastEventVersion = lastEventVersionsRef.current.get(lastEvent?.id || '');
    const eventWasUpdated = isStreamingEvent && lastEvent.version && lastEventVersion !== lastEvent.version;

    // Skip processing if no new events AND last event wasn't updated
    if (newEventsCount === 0 && !eventWasUpdated) {
      return [...state.result, ...(state.currentTurn.items.length > 0 ? [state.currentTurn] : [])];
    }

    // Determine which events to process
    let eventsToProcess: typeof events;
    if (eventWasUpdated) {
      // Re-process the last event (it was updated/coalesced)
      eventsToProcess = [lastEvent];
      lastEventVersionsRef.current.set(lastEvent.id, lastEvent.version!);
    } else {
      // Process only new events
      eventsToProcess = events.slice(lastProcessedIndexRef.current);
    }

    for (const event of eventsToProcess) {
      switch (event.event) {
        case 'waiting':
          // Waiting for first token from LLM
          state.currentTurn.items.push({
            id: `item-${state.itemIdCounter++}`,
            type: 'waiting',
            timestamp: event.timestamp,
            data: null
          });
          break;

        case 'reasoning_start':
          // Reasoning/thinking has started - remove waiting indicator
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'reasoning_delta':
          // Handle reasoning tokens (from Anthropic extended thinking, DeepSeek, Gemini, etc.)
          // When coalesced, data.all contains array of {text} objects (snapshots removed for memory efficiency)
          // The coalesced event contains ALL text accumulated so far, so we REPLACE (not append)
          const reasoningDeltaItems = event.data?.all || [event.data];

          // Concatenate all text fields from the coalesced deltas
          // This gives us the complete reasoning content from this coalesced event
          const allReasoningText = reasoningDeltaItems.map((d: any) => d?.text || '').join('');

          // Skip whitespace-only reasoning (often happens between tool calls)
          const trimmedReasoningText = allReasoningText.trim();
          if (!trimmedReasoningText) {
            // Remove waiting indicator even for whitespace-only reasoning
            state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
            break;
          }

          // Find the reasoning item that corresponds to THIS event (by matching eventId)
          // This ensures multiple reasoning sessions (separated by tool calls) each get their own item
          let matchingReasoningItem = state.currentTurn.items.find(
            item => item.type === 'reasoning' && item.eventId === event.id
          ) as TurnItem | undefined;

          if (matchingReasoningItem) {
            // Update the existing reasoning item for this event
            matchingReasoningItem.data = allReasoningText;
          } else {
            // Create new reasoning item and link it to this event's ID
            const newReasoningItem: TurnItem = {
              id: `item-${state.itemIdCounter++}`,
              type: 'reasoning',
              timestamp: event.timestamp,
              data: allReasoningText,
              eventId: event.id  // Track which event this item belongs to
            };
            state.currentTurn.items.push(newReasoningItem);
          }

          // Remove waiting indicator when reasoning arrives
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'reasoning_complete':
          // Reasoning is complete - nothing special to do, just ensure waiting is removed
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'toolCalls':
          // New tool calls - push onto flat per-iteration array
          const calls = event.data?.toolCalls || [];

          for (let toolIndex = 0; toolIndex < calls.length; toolIndex++) {
            const call = calls[toolIndex];
            let parameters = {};
            try {
              parameters = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
            } catch {
              // If JSON parsing fails (streaming/partial), use raw string
              parameters = { _raw: call.function?.arguments || '' };
            }

            const tool: ToolCall = {
              id: call.id || `tool-${state.currentIterationTools.length}`,
              name: call.function?.name || 'unknown',
              parameters,
              status: 'pending',
            };

            const toolItem: TurnItem = {
              id: `item-${state.itemIdCounter++}`,
              type: 'tool',
              timestamp: event.timestamp,
              data: tool
            };

            state.currentTurn.items.push(toolItem);
            state.currentIterationTools.push(tool);
          }

          // Remove waiting indicator when tools arrive
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'tool_status':
          // Update tool status (mutate the tool object in the item)
          // toolIndex is the position in the flat per-iteration array
          const { toolIndex, status, result: toolStatusResult, error } = event.data || {};
          const tool = state.currentIterationTools[toolIndex];
          if (tool) {
            tool.status = status;
            if (toolStatusResult) tool.result = toolStatusResult;
            if (error) tool.error = error;
            // Re-parse _raw when streaming is complete (tool starts executing)
            if (status === 'executing' && tool.parameters?._raw && typeof tool.parameters._raw === 'string') {
              try {
                tool.parameters = JSON.parse(tool.parameters._raw);
              } catch { /* leave _raw if still invalid */ }
            }
          }
          break;

        case 'tool_result':
          // Update tool result
          const toolResult = state.currentIterationTools[event.data?.toolIndex];
          if (toolResult && event.data?.result) {
            toolResult.result = event.data.result;
          }
          break;

        case 'tool_param_delta':
          // Handle both coalesced (data.all) and individual delta formats for tool parameters
          const paramDeltaItems = event.data?.all || [event.data];

          // Process all parameter deltas in the event
          for (const paramDelta of paramDeltaItems) {
            const { toolId, partialArguments } = paramDelta || {};
            if (!toolId) continue;

            // Find the tool item with this ID
            const toolItem = state.currentTurn.items.find(
              item => item.type === 'tool' && (item.data as ToolCall)?.id === toolId
            );

            if (toolItem) {
              const tool = toolItem.data as ToolCall;
              // Try to parse as JSON, otherwise show as _raw
              try {
                tool.parameters = JSON.parse(partialArguments);
              } catch {
                tool.parameters = { _raw: partialArguments };
              }
            }
          }
          break;

        case 'assistant_delta':
          // Handle both coalesced (data.all) and individual delta formats
          // When coalesced, data.all contains array of {text} objects (snapshots removed for memory efficiency)
          const deltaItems = event.data?.all || [event.data];

          // Find the text item that corresponds to THIS event (by matching eventId)
          // This ensures multiple text blocks (separated by tool calls) each get their own item
          let matchingTextItem = state.currentTurn.items.find(
            item => item.type === 'text' && item.eventId === event.id
          ) as TurnItem | undefined;

          // Concatenate all text fields from the coalesced deltas
          // This gives us the complete content from this coalesced event
          const allText = deltaItems.map((d: any) => d?.text || '').join('');

          if (allText) {
            if (matchingTextItem) {
              // Update the existing text item for this event
              matchingTextItem.data = allText;
            } else {
              // Create new text item and link it to this event's ID
              const newTextItem: TurnItem = {
                id: `item-${state.itemIdCounter++}`,
                type: 'text',
                timestamp: event.timestamp,
                data: allText,
                eventId: event.id  // Track which event this item belongs to
              };
              state.currentTurn.items.push(newTextItem);
            }
          }

          // Remove thinking indicator when text arrives
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'plan_message':
          state.currentTurn.items.push({
            id: `item-${state.itemIdCounter++}`,
            type: 'plan',
            timestamp: event.timestamp,
            data: event.data?.content || ''
          });
          break;

        case 'agent_message':
          state.currentTurn.items.push({
            id: `item-${state.itemIdCounter++}`,
            type: 'agent',
            timestamp: event.timestamp,
            data: event.data?.content || ''
          });
          break;

        case 'task_progress':
          state.currentTurn.items.push({
            id: `item-${state.itemIdCounter++}`,
            type: 'progress',
            timestamp: event.timestamp,
            data: event.data?.content || ''
          });
          break;

        case 'conversation_message':
          // Handle conversation messages (user and system)
          const message = event.data?.message;
          if (message?.role === 'user') {
            // Skip internal evaluation prompts (orchestration internals)
            if (message.content?.includes('Before finishing, you must call the evaluation tool')) {
              break;
            }

            // Check if this is a synthetic error message (auto-injected by orchestrator)
            const isSyntheticError = message.ui_metadata?.isSyntheticError === true;

            // Add project context as a separate collapsible item (collapsed by default)
            const projectContext = message.ui_metadata?.projectContext;
            if (projectContext && !isSyntheticError) {
              state.currentTurn.items.push({
                id: `item-${state.itemIdCounter++}`,
                type: 'project_context',
                timestamp: event.timestamp,
                data: projectContext
              });
            }

            // Use clean display content (without injected context/hints) if available
            const displayContent = message.ui_metadata?.displayContent || message.content || '';

            state.currentTurn.items.push({
              id: `item-${state.itemIdCounter++}`,
              type: isSyntheticError ? 'synthetic_error' : 'user',
              timestamp: event.timestamp,
              data: displayContent
            });
          }
          // Skip system messages (don't display in chat UI)
          break;

        case 'user_message':
          // Backward compatibility with old user_message event
          state.currentTurn.items.push({
            id: `item-${state.itemIdCounter++}`,
            type: 'user',
            timestamp: event.timestamp,
            data: event.data?.content || ''
          });
          break;

        case 'error':
          state.currentTurn.items.push({
            id: `item-${state.itemIdCounter++}`,
            type: 'error',
            timestamp: event.timestamp,
            data: event.data
          });
          // Remove thinking indicator when error arrives
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'usage':
          state.currentTurn.usage = event.data;
          // Remove thinking indicator when usage arrives (marks end of LLM response)
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;

        case 'checkpoint_created':
          // Store checkpoint ID in current turn
          state.currentTurn.checkpointId = event.data?.checkpointId;
          break;

        case 'iteration':
          state.currentTurn.iteration = event.data?.iteration;
          // Start a new turn for next iteration
          if (state.currentTurn.items.length > 0) {
            state.result.push(state.currentTurn);
            state.currentTurn = {
              id: `turn-${Date.now()}-${state.result.length}`,
              items: [],
            };
          }
          // Reset tool tracking for the new iteration
          state.currentIterationTools = [];
          break;

        case 'stopped':
          // Remove thinking indicator when generation is stopped
          state.currentTurn.items = state.currentTurn.items.filter(item => item.type !== 'waiting');
          break;
      }
    }

    // Update last processed index (only when processing new events, not re-processing updated ones)
    if (!eventWasUpdated) {
      lastProcessedIndexRef.current = events.length;
    }

    // Return combined result (completed turns + current turn if it has items)
    return [...state.result, ...(state.currentTurn.items.length > 0 ? [state.currentTurn] : [])];
  }, [events]);

  // Auto-scroll when turns change (throttled with requestAnimationFrame)
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;

    // Use requestAnimationFrame to batch scroll updates and avoid layout thrashing
    const rafId = requestAnimationFrame(() => {
      if (scrollRef.current) {
        isScrollingProgrammatically.current = true;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        // Reset flag after scroll completes
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 50);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [turns, autoScroll]);

  // Enable auto-scroll when new turns arrive (user sent a message)
  useEffect(() => {
    if (turns.length > 0) {
      setAutoScroll(true);
    }
  }, [turns.length]);

  // Scroll position detection
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      // Ignore programmatic scrolls
      if (isScrollingProgrammatically.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setAutoScroll(isAtBottom);
    };

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle expanded state for an item
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Focus context hint
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
          height="$5" paddingHorizontal="$2" fontSize="$1"
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

  return (
    <YStack height="100%" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$5" overflow="hidden" data-tour-id="assistant-panel">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" padding="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color3" flexShrink={0}>
        <XStack alignItems="center" gap="$2">
          <MessageSquare size={16} style={{ color: 'var(--brand-accent)' }} />
          {onClose ? (
            <Button
              type="button"
              onClick={onClose}
              aria-label="Hide chat panel"
              position="relative" display="none" height="$5" width="$5" alignItems="center" justifyContent="center" borderRadius="$1" color="$color11" group hoverStyle={{ color: "$red9" }}
            >
              <MessageSquare
                size={16}
                style={{ color: 'var(--brand-accent)' }}
  />
              <X size={12} />
            </Button>
          ) : (
            <MessageSquare
              size={16}
              style={{ color: 'var(--brand-accent)' }}
  />
          )}
          <SizableText fontWeight="500" fontSize="$3">Chat</SizableText>
        </XStack>
        <XStack alignItems="center" gap="$1">
          {onClearChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              height={28} paddingHorizontal="$2" hoverStyle={{ backgroundColor: "$color3" }}
              title="Clear chat"
              data-tour-id="clear-chat-button"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </XStack>
      </XStack>

      {/* Messages */}
      <YStack ref={scrollRef} flex={1} padding="$4" rowGap="$4" overflow="scroll">
        {turns.length === 0 ? (
          <SizableText fontSize="$1" color="$color11" textAlign="center" padding="$4" display="flex" flexDirection="column">
            No messages yet. Start a conversation to see it here.
          </SizableText>
        ) : (
          turns.map((turn) => (
            <TurnDisplay
              key={turn.id}
              turn={turn}
              onRestore={onRestore}
              onRetry={onRetry}
              expandedItems={expandedItems}
              onToggleExpanded={toggleExpanded}
  />
          ))
        )}
      </YStack>

      {/* Input */}
      <YStack padding="$3" rowGap="$2">
        {focusContextHint}
        <YStack
          borderRadius="$5" elevation={1} overflow="hidden" {...{ borderColor: isDragging ? "$color12" : "$borderColor", borderWidth: isDragging ? 2 : 1, backgroundColor: isDragging ? "$color12" : "$background" }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Image previews */}
          {pendingImages.length > 0 && (
            <XStack paddingHorizontal="$3" paddingTop="$2" flexWrap="wrap" gap="$2">
              {pendingImages.map((img) => (
                <YStack
                  key={img.id}
                  position="relative" group
                >
                  <Image
                    src={img.preview}
                    alt="Pending upload"
                    height="$8" width="$8" objectFit="cover" borderRadius="$2" borderWidth={1} borderColor="$borderColor"
  />
                  <Button
                    onClick={() => removeImage(img.id)}
                    position="absolute" top="-1" right="-1" height="$4" width="$4" backgroundColor="$red9" color="$background" borderRadius="$10" alignItems="center" justifyContent="center" opacity={0} $group-hover={{ opacity: 1 }}
                    title="Remove image"
                  >
                    <X size={12} />
                  </Button>
                </YStack>
              ))}
              <SizableText fontSize="$1" color="$color11" alignSelf="flex-end" paddingBottom="$1">
                {pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''} attached
              </SizableText>
            </XStack>
          )}

          {/* Drop overlay */}
          {isDragging && supportsVision && (
            <XStack position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center" justifyContent="center" backgroundColor="$color12" zIndex={10} pointerEvents="none">
              <SizableText color="$color12" fontWeight="500" alignItems="center" gap="$2" display="flex" flexDirection="row">
                <ImageIcon size={20} />
                Drop image here
              </SizableText>
            </XStack>
          )}

          <XStack position="relative" backgroundColor="$background" borderRadius="$5">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (isTourLockingInput) {
                  return;
                }
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onPaste={handlePaste}
              placeholder={!providerReady ? "Select a provider to start..." : supportsVision ? "Describe what you want to build... (paste or drop images)" : "Describe what you want to build..."}
              flex={1} paddingHorizontal="$3" paddingVertical="$2" backgroundColor="transparent" borderWidth={0} resize="none" fontSize="$3" placeholderTextColor="$color11" color="$color" focusStyle={{ outlineWidth: 0 }}
              rows={3}
              disabled={generating || isTourLockingInput || !providerReady}
  />
            <YStack padding="$2" gap="$2">
              <Button
                onClick={generating ? onStop : handleSend}
                disabled={isTourLockingInput ? !generating : (!generating && (!prompt.trim() && pendingImages.length === 0 || !providerReady))}
                size="sm"
                alignItems="center" gap="$2"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} />
                    Stop
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send
                  </>
                )}
              </Button>
            </YStack>
          </XStack>

          {/* Footer */}
          <YStack borderTopWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2" paddingVertical="$2">
            <XStack alignItems="center" justifyContent="space-between" gap="$2">
              <Popover open={showMobileSettings} onOpenChange={setShowMobileSettings}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    height={28} fontSize="$1" {...{ borderColor: !providerReady ? "$color12" : undefined }}
                    data-tour-id="provider-settings-trigger"
                  >
                    <span>{providerReady ? getModelDisplayName(currentModel) : 'Select provider'}</span>
                    {showMobileSettings ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronUp size={12} />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent width={460} maxWidth="calc(100vw-2rem)" maxHeight="min(680px,calc(100vh-5rem))" overflow="hidden" flexDirection="column" align="start" data-tour-id="provider-settings-popup">
                  <ModelSettingsPanel
                    onClose={() => setShowMobileSettings(false)}
                    onModelChange={(modelId) => setCurrentModel(modelId)}
  />
                </PopoverContent>
              </Popover>

              <Tabs
                value={chatMode ? 'chat' : 'code'}
                onValueChange={(value) => setChatMode(value === 'chat')}
              >
                <TabsList gap="$1">
                  <TabsTrigger value="chat" h={28} px="$2" gap="$1">
                    <MessageSquare size={12} />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="code" h={28} px="$2" gap="$1">
                    <Code size={12} />
                    Code
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}

interface TurnDisplayProps {
  turn: Turn;
  onRestore?: (checkpointId: string) => void;
  onRetry?: (checkpointId: string) => void;
  expandedItems: Set<string>;
  onToggleExpanded: (itemId: string) => void;
}

function TurnDisplay({ turn, onRestore, onRetry, expandedItems, onToggleExpanded }: TurnDisplayProps) {
  return (
    <YStack rowGap="$2" {...(turn.checkpointId ? { 'data-checkpoint-id': turn.checkpointId } : {})}>
      {/* Render items in chronological order */}
      {turn.items.map((item) => {
        switch (item.type) {
          case 'waiting':
            return (
              <YStack key={item.id} backgroundColor="$color3" borderRadius="$3" padding="$2" opacity={0.7}>
                <XStack alignItems="center" gap="$2" paddingHorizontal="$1">
                  <Loader2 size={12} color="$blue8" />
                  <SizableText fontSize="$1" color="$color11">Waiting for response...</SizableText>
                </XStack>
              </YStack>
            );

          case 'reasoning':
            return (
              <ReasoningDisplay
                key={item.id}
                itemId={item.id}
                content={item.data}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => onToggleExpanded(item.id)}
  />
            );

          case 'plan':
            return (
              <PlanDisplay
                key={item.id}
                itemId={item.id}
                content={item.data}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => onToggleExpanded(item.id)}
  />
            );

          case 'agent':
            return (
              <AgentDisplay
                key={item.id}
                itemId={item.id}
                content={item.data}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => onToggleExpanded(item.id)}
  />
            );

          case 'progress':
            return (
              <ProgressDisplay
                key={item.id}
                itemId={item.id}
                content={item.data}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => onToggleExpanded(item.id)}
  />
            );

          case 'tool':
            return (
              <ToolDisplay
                key={item.id}
                itemId={item.id}
                tool={item.data as ToolCall}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => onToggleExpanded(item.id)}
  />
            );

          case 'text':
            return (
              <SizableText key={item.id} fontSize="$3" color="$color" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" display="flex" flexDirection="column">
                <MarkdownRenderer content={item.data} />
              </SizableText>
            );

          case 'project_context':
            return (
              <YStack key={item.id} borderRadius="$3" {...{ backgroundColor: expandedItems.has(item.id) ? "$color3" : undefined, padding: expandedItems.has(item.id) ? "$2" : "$1.5" }}>
                <Button
                  onClick={() => onToggleExpanded(item.id)}
                  alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <ChevronRight size={12} color="$color11" />
                  <FileCode size={12} color="$color11" />
                  <SizableText fontSize="$1" color="$color11">Project context</SizableText>
                </Button>
                {expandedItems.has(item.id) && (
                  <YStack marginTop="$2" paddingHorizontal="$2">
                    <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" whiteSpace="pre" color="$color11" overflow="scroll" fontFamily="$mono">
                      {item.data}
                    </SizableText>
                  </YStack>
                )}
              </YStack>
            );

          case 'user':
            return (
              <SizableText key={item.id} fontSize="$3" color="$color" backgroundColor="$color12" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" borderWidth={1} borderColor="$color12" display="flex" flexDirection="column">
                <SizableText fontWeight="500" color="$color12" marginBottom="$1" fontSize="$1" display="flex" flexDirection="column">User</SizableText>
                <UserMessageContent content={item.data} />
              </SizableText>
            );

          case 'synthetic_error':
            // Auto-injected error message (e.g., malformed tool call correction)
            // Style it like a collapsible tool call
            return (
              <SyntheticErrorDisplay
                key={item.id}
                itemId={item.id}
                content={item.data}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => onToggleExpanded(item.id)}
  />
            );

          case 'error':
            return (
              <SizableText key={item.id} fontSize="$3" backgroundColor="$red9" borderWidth={1} borderColor="$red9" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" display="flex" flexDirection="column">
                <XStack alignItems="flex-start" gap="$2">
                  <XCircle size={16} color="$red9" />
                  <YStack flex={1}>
                    <SizableText fontWeight="500" color="$red9" marginBottom="$1" display="flex" flexDirection="column">Error</SizableText>
                    <SizableText color="$red9" whiteSpace="pre-wrap" fontFamily="$mono" fontSize="$1" display="flex" flexDirection="column">
                      {item.data?.message || JSON.stringify(item.data, null, 2)}
                    </SizableText>
                    {item.data?.stack && (
                      <details className="error-disclosure">
                        <summary>
                          Stack trace
                        </summary>
                        <SizableText fontSize={10} color="$red9" marginTop="$1" overflow="scroll" fontFamily="$mono" whiteSpace="pre">
                          {item.data.stack}
                        </SizableText>
                      </details>
                    )}
                  </YStack>
                </XStack>
              </SizableText>
            );

          default:
            return null;
        }
      })}

      {/* Usage info and checkpoint actions */}
      {(turn.usage || turn.checkpointId) && (
        <XStack alignItems="center" justifyContent="space-between" gap="$2">
          {/* Usage info */}
          {turn.usage && (
            <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
              Tokens: {(turn.usage.usage?.totalTokens || turn.usage.totalTokens)?.toLocaleString() || 'N/A'}
              {(turn.usage.totalCost !== undefined || turn.usage.cost !== undefined) &&
                ` • Cost: $${((turn.usage.totalCost ?? turn.usage.cost) || 0).toFixed(4)}`}
            </SizableText>
          )}

          {/* Checkpoint actions */}
          {turn.checkpointId && (
            <XStack alignItems="center" gap="$1">
              {onRestore && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRestore(turn.checkpointId!)}
                  height="$5" paddingHorizontal="$2" fontSize="$1"
                  title="Restore to this checkpoint"
                >
                  <RotateCcw size={12} />
                  Restore
                </Button>
              )}
              {onRetry && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRetry(turn.checkpointId!)}
                  height="$5" paddingHorizontal="$2" fontSize="$1"
                  title="Restore files and retry from this checkpoint"
                >
                  <RefreshCw size={12} />
                  Retry
                </Button>
              )}
            </XStack>
          )}
        </XStack>
      )}
    </YStack>
  );
}

interface ToolDisplayProps {
  itemId: string;
  tool: ToolCall;
  isExpanded: boolean;
  onToggle: () => void;
}

function ToolDisplay({ itemId, tool, isExpanded, onToggle }: ToolDisplayProps) {
  return (
    <YStack
      backgroundColor="$color3" borderRadius="$3" {...{ padding: isExpanded ? "$2" : "$1.5" }}
    >
      <Button
        onClick={onToggle}
        alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$color3" }}
      >
        <XStack alignItems="center" gap="$1.5">
          {toolIcons[tool.name] || <ChevronRight size={12} />}
          <SizableText fontSize="$1" fontFamily="$mono">{tool.name}</SizableText>
        </XStack>

        {/* Tool-specific preview */}
        {tool.name === 'shell' && tool.parameters?.cmd && (
          <SizableText fontSize="$1" color="$color11">
            {Array.isArray(tool.parameters.cmd)
              ? tool.parameters.cmd.slice(1).join(' ').substring(0, 50)
              : String(tool.parameters.cmd).substring(0, 50)}
          </SizableText>
        )}
        {(tool.parameters?.path || tool.parameters?.file_path) && (
          <SizableText fontSize="$1" color="$color11">
            {tool.parameters.path || tool.parameters.file_path}
          </SizableText>
        )}

        <YStack marginLeft="auto">
          {statusIcons[tool.status || 'completed']}
        </YStack>
      </Button>

      {/* Expanded view */}
      {isExpanded && (
        <YStack marginTop="$2" rowGap="$2">
          {/* Parameters */}
          {tool.parameters && Object.keys(tool.parameters).length > 0 && (
            <YStack paddingHorizontal="$2">
              <SizableText fontSize={10} textTransform="uppercase" letterSpacing={0.8} color="$color11" marginBottom="$1" display="flex" flexDirection="column">
                Parameters
              </SizableText>
              <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" overflow="scroll" fontFamily="$mono" whiteSpace="pre">
                {JSON.stringify(tool.parameters, null, 2)}
              </SizableText>
            </YStack>
          )}

          {/* Result */}
          {tool.result && (
            <YStack paddingHorizontal="$2">
              <SizableText fontSize={10} textTransform="uppercase" letterSpacing={0.8} color="$color11" marginBottom="$1" display="flex" flexDirection="column">
                Result
              </SizableText>
              <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" maxHeight="$17" overflow="scroll" fontFamily="$mono" whiteSpace="pre">
                {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
              </SizableText>
            </YStack>
          )}

          {/* Error */}
          {tool.error && (
            <YStack paddingHorizontal="$2">
              <SizableText fontSize={10} textTransform="uppercase" letterSpacing={0.8} color="$red9" marginBottom="$1" display="flex" flexDirection="column">
                Error
              </SizableText>
              <SizableText fontSize="$1" backgroundColor="$red9" color="$red9" padding="$2" borderRadius="$2" overflow="scroll" fontFamily="$mono" whiteSpace="pre">
                {tool.error}
              </SizableText>
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  );
}

interface SyntheticErrorDisplayProps {
  itemId: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function SyntheticErrorDisplay({ itemId, content, isExpanded, onToggle }: SyntheticErrorDisplayProps) {
  return (
    <YStack backgroundColor="$yellow9" borderRadius="$3" {...{ padding: isExpanded ? "$2" : "$1.5" }}>
      <Button
        onClick={onToggle}
        alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$yellow9" }}
      >
        <XStack alignItems="center" gap="$1.5">
          <RefreshCw size={12} color="$yellow10" />
          <SizableText fontSize="$1" fontFamily="$mono">Auto-correction</SizableText>
        </XStack>
        <YStack marginLeft="auto">
          <CheckCircle size={12} color="$yellow10" />
        </YStack>
      </Button>

      {/* Expanded view */}
      {isExpanded && (
        <YStack marginTop="$2" paddingHorizontal="$2">
          <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" whiteSpace="pre" overflow="scroll" fontFamily="$mono">
            {content}
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}

interface ReasoningDisplayProps {
  itemId: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function ReasoningDisplay({ itemId, content, isExpanded, onToggle }: ReasoningDisplayProps) {
  // Extract first line for preview, clean up common prefixes
  const lines = (content || '').split('\n').filter(l => l.trim());
  const preview = lines[0]?.substring(0, 60) || 'Reasoning...';
  const isStreaming = !content || content.length < 20; // Short content might still be streaming

  return (
    <YStack backgroundColor="$purple9" borderRadius="$3" padding="$1.5" borderWidth={1} borderColor="$purple9">
      <Button
        onClick={onToggle}
        alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$purple9" }}
      >
        <XStack alignItems="center" gap="$1.5">
          {isStreaming ? (
            <Loader2 size={12} color="$purple9" />
          ) : (
            <Brain size={12} color="$purple9" />
          )}
          <SizableText fontSize="$1" fontFamily="$mono">reasoning</SizableText>
        </XStack>
        <SizableText fontSize="$1" color="$color11" numberOfLines={1} flex={1}>
          {isStreaming ? 'Thinking...' : preview}
        </SizableText>
        <YStack marginLeft="auto">
          <ChevronRight size={12} />
        </YStack>
      </Button>

      {isExpanded && (
        <YStack marginTop="$2" paddingHorizontal="$2">
          <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" maxHeight={256} overflow="scroll" display="flex" flexDirection="column">
            <MarkdownRenderer content={content || 'Thinking...'} />
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}

interface PlanDisplayProps {
  itemId: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function PlanDisplay({ itemId, content, isExpanded, onToggle }: PlanDisplayProps) {
  // Extract first line for preview
  const lines = content.split('\n');
  const preview = lines[0]?.replace(/^\*\*|\*\*$/g, '').substring(0, 50) || 'Plan';

  return (
    <YStack backgroundColor="$color3" borderRadius="$3" padding="$1.5">
      <Button
        onClick={onToggle}
        alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$color3" }}
      >
        <XStack alignItems="center" gap="$1.5">
          <ClipboardList size={12} color="$orange9" />
          <SizableText fontSize="$1" fontFamily="$mono">plan</SizableText>
        </XStack>
        <SizableText fontSize="$1" color="$color11" numberOfLines={1} flex={1}>
          {preview}
        </SizableText>
        <YStack marginLeft="auto">
          <ChevronRight size={12} />
        </YStack>
      </Button>

      {isExpanded && (
        <YStack marginTop="$2" paddingHorizontal="$2">
          <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" whiteSpace="pre" overflow="scroll" fontFamily="$mono">
            {content}
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}

interface AgentDisplayProps {
  itemId: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function AgentDisplay({ itemId, content, isExpanded, onToggle }: AgentDisplayProps) {
  // Extract first line for preview
  const lines = content.split('\n');
  const preview = lines[0]?.replace(/^\*\*|\*\*$/g, '').replace(/^🤖\s*/, '').substring(0, 50) || 'Agent';

  return (
    <YStack backgroundColor="$color3" borderRadius="$3" padding="$1.5">
      <Button
        onClick={onToggle}
        alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$color3" }}
      >
        <XStack alignItems="center" gap="$1.5">
          <Bot size={12} color="$purple9" />
          <SizableText fontSize="$1" fontFamily="$mono">agent</SizableText>
        </XStack>
        <SizableText fontSize="$1" color="$color11" numberOfLines={1} flex={1}>
          {preview}
        </SizableText>
        <YStack marginLeft="auto">
          <ChevronRight size={12} />
        </YStack>
      </Button>

      {isExpanded && (
        <YStack marginTop="$2" paddingHorizontal="$2">
          <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" whiteSpace="pre" overflow="scroll" fontFamily="$mono">
            {content}
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}

interface ProgressDisplayProps {
  itemId: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProgressDisplay({ itemId, content, isExpanded, onToggle }: ProgressDisplayProps) {
  // Detect if this is a completion (✅) or in progress (🔄)
  const isCompleted = content.includes('✅');
  const preview = content.replace(/^[✅🔄]\s*/, '').substring(0, 50);

  return (
    <YStack backgroundColor="$color3" borderRadius="$3" padding="$1.5">
      <Button
        onClick={onToggle}
        alignItems="center" gap="$2" width="100%" textAlign="left" borderRadius="$2" paddingHorizontal="$1" hoverStyle={{ backgroundColor: "$color3" }}
      >
        <XStack alignItems="center" gap="$1.5">
          {isCompleted ? (
            <CheckCircle size={12} color="$green9" />
          ) : (
            <Loader2 size={12} color="$blue9" />
          )}
          <SizableText fontSize="$1" fontFamily="$mono">progress</SizableText>
        </XStack>
        <SizableText fontSize="$1" color="$color11" numberOfLines={1} flex={1}>
          {preview}
        </SizableText>
        <YStack marginLeft="auto">
          <ChevronRight size={12} />
        </YStack>
      </Button>

      {isExpanded && (
        <YStack marginTop="$2" paddingHorizontal="$2">
          <SizableText fontSize="$1" backgroundColor="$color3" padding="$2" borderRadius="$2" whiteSpace="pre" overflow="scroll" fontFamily="$mono">
            {content}
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}
