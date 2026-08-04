'use client';

import { YStack, XStack, SizableText, type GuiElement } from '@hanzo/gui';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, Label } from '@hanzo/ui';
import { ChevronDown, ChevronUp, Bug, X, Trash2, Terminal } from 'lucide-react';
import { vfsShell } from '@/lib/vfs/cli-shell';
import { MemoryMonitor } from './memory-monitor';

export interface DebugEvent {
  id: string;
  timestamp: number;
  event: string;
  data: any;
  count?: number; // For compressed events
  version?: number; // Increments when event is updated (for coalesced streaming)
}

interface DebugPanelProps {
  events: DebugEvent[];
  onClear?: () => void;
  onClose?: () => void;
  projectId?: string;
}

export function DebugPanel({ events, onClear, onClose, projectId }: DebugPanelProps) {
  const [filter, setFilter] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Mini terminal state
  const [command, setCommand] = useState('');
  const [shellOutput, setShellOutput] = useState<{cmd: string, output: string, isError?: boolean}[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const shellOutputRef = useRef<GuiElement>(null);

  // Compress consecutive assistant_delta, tool_param_delta, and reasoning_delta events
  // Only store count, not individual events - prevents O(N²) memory growth
  const compressedEvents = useMemo(() => {
    const result: DebugEvent[] = [];
    let currentDeltaGroup: DebugEvent | null = null;

    const COMPRESSIBLE_EVENTS = new Set(['assistant_delta', 'tool_param_delta', 'reasoning_delta']);

    for (const event of events) {
      const shouldCompress = COMPRESSIBLE_EVENTS.has(event.event);

      if (shouldCompress) {
        // If we're already in a group of the same type, just increment count
        if (currentDeltaGroup && currentDeltaGroup.event === event.event) {
          currentDeltaGroup.count = (currentDeltaGroup.count || 1) + 1;
          // Don't accumulate data.all - that causes O(N²) memory usage
          // The count is sufficient for debugging purposes
        } else {
          // Start a new group
          if (currentDeltaGroup) {
            result.push(currentDeltaGroup);
          }
          currentDeltaGroup = { ...event, count: 1 };
        }
      } else {
        // Non-compressible event, flush any current group and add this event
        if (currentDeltaGroup) {
          result.push(currentDeltaGroup);
          currentDeltaGroup = null;
        }
        result.push(event);
      }
    }

    // Flush any remaining group
    if (currentDeltaGroup) {
      result.push(currentDeltaGroup);
    }

    return result;
  }, [events]);

  // Scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [compressedEvents, autoScroll]);

  // Clear all events
  const handleClear = () => {
    onClear?.();
  };

  // Export events as JSON
  const handleExport = () => {
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run shell command
  const handleRunCommand = async () => {
    if (!command.trim() || !projectId || isRunning) return;

    const cmd = command.trim();
    setCommand('');
    setIsRunning(true);

    try {
      // Parse command string into argv array
      const argv = cmd.split(/\s+/);
      const result = await vfsShell.execute(projectId, argv);

      const output = result.success
        ? result.stdout || '(no output)'
        : result.stderr || 'Command failed';

      setShellOutput(prev => [...prev, { cmd, output, isError: !result.success }]);
    } catch (err) {
      setShellOutput(prev => [...prev, {
        cmd,
        output: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        isError: true
      }]);
    } finally {
      setIsRunning(false);
      // Scroll to bottom of shell output
      setTimeout(() => {
        const el = shellOutputRef.current;
        if (!el || !('scrollTo' in el)) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  };

  // Filter events
  const filteredEvents = filter
    ? compressedEvents.filter(e => e.event.toLowerCase().includes(filter.toLowerCase()))
    : compressedEvents;

  // Group events by type (use original events for accurate counts)
  const eventCounts = events.reduce((acc, e) => {
    acc[e.event] = (acc[e.event] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <YStack height="100%" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$5" overflow="hidden">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" padding="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color3" flexShrink={0}>
        <XStack alignItems="center" gap="$2">
          <Bug size={16} />
          {onClose ? (
            <Button
              type="button"
              onClick={onClose}
              aria-label="Hide debug panel"
              position="relative" display="none" height="$5" width="$5" alignItems="center" justifyContent="center" borderRadius="$1" group
            >
              <Bug
                size={16}
  />
              <X size={12} />
            </Button>
          ) : (
            <Bug size={16} />
          )}
          <SizableText fontWeight="500" fontSize="$3">Debug Events</SizableText>
          <SizableText fontSize="$1" color="$color11">
            ({filteredEvents.length}/{events.length})
          </SizableText>
          <MemoryMonitor />
        </XStack>
        <XStack alignItems="center" gap="$1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            paddingHorizontal="$2" hoverStyle={{ backgroundColor: "$color3" }}
            title="Clear all events"
          >
            <Trash2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            paddingHorizontal="$2" hoverStyle={{ backgroundColor: "$color3" }}
            title="Export to JSON"
          >
            <SizableText fontSize="$1">Export</SizableText>
          </Button>
        </XStack>
      </XStack>

      {/* Event Counts */}
      <YStack padding="$2" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color3">
        <XStack flexWrap="wrap" gap="$2">
          {Object.entries(eventCounts).map(([event, count]) => (
            <Button
              key={event}
              onClick={() => setFilter(filter === event ? '' : event)}
              paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2" {...{ backgroundColor: filter === event ? "$color12" : "$color3", color: filter === event ? "$background" : undefined, hoverStyle: filter === event ? undefined : {"backgroundColor":"$color3"} }}
            >
              {event} ({count})
            </Button>
          ))}
        </XStack>
      </YStack>

      {/* Filter Input */}
      <YStack padding="$2" borderBottomWidth={1} borderColor="$borderColor">
        <Input
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          width="100%" paddingHorizontal="$2" paddingVertical="$1" fontSize="$1" borderRadius="$2" backgroundColor="$background" borderWidth={1} borderColor="$borderColor"
  />
      </YStack>

      {/* Auto-scroll toggle */}
      <XStack padding="$2" borderBottomWidth={1} borderColor="$borderColor" alignItems="center" gap="$2">
        <Label fontSize="$1" alignItems="center" gap="$1" cursor="pointer">
          <Input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            borderRadius="$2"
  />
          Auto-scroll
        </Label>
      </XStack>

      {/* Events List */}
      <YStack flex={1} padding="$2" rowGap="$1" overflow="scroll">
        {filteredEvents.length === 0 ? (
          <YStack padding="$4">
            <SizableText fontSize="$1" color="$color11" textAlign="center">
              No events yet. Events will appear here as they occur.
            </SizableText>
          </YStack>
        ) : (
          filteredEvents.map((event) => (
            <EventItem key={event.id} event={event} />
          ))
        )}
        <div ref={eventsEndRef} />
      </YStack>

      {/* Mini Terminal */}
      {projectId && (
        <YStack borderTopWidth={1} borderColor="$borderColor" flexShrink={0}>
          {/* Terminal Header */}
          <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" backgroundColor="$color3" borderBottomWidth={1} borderColor="$borderColor">
            <Terminal size={12} />
            <SizableText fontSize="$1" fontWeight="500">VFS Shell</SizableText>
            {shellOutput.length > 0 && (
              <Button
                onClick={() => setShellOutput([])}
                marginLeft="auto"
              >
                <SizableText fontSize="$1" color="$color11">Clear</SizableText>
              </Button>
            )}
          </XStack>

          {/* Output history */}
          {shellOutput.length > 0 && (
            <YStack
              ref={shellOutputRef}
              maxHeight="$14" padding="$2" backgroundColor="$color12" overflow="scroll"
            >
              {shellOutput.map((entry, i) => (
                <YStack key={i} marginBottom="$2">
                  <YStack><SizableText color="$green8">$ {entry.cmd}</SizableText></YStack>
                  <SizableText whiteSpace="pre" fontFamily="$mono" {...{ color: entry.isError ? "$red8" : "$color4" }}>
                    {entry.output}
                  </SizableText>
                </YStack>
              ))}
            </YStack>
          )}

          {/* Command input */}
          <XStack alignItems="center" gap="$2" padding="$2" backgroundColor="$color12">
            <SizableText color="$green8" fontFamily="$mono" fontSize="$1">$</SizableText>
            <Input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
              placeholder="ls -la /.skills/"
              disabled={isRunning}
              flex={1} backgroundColor="transparent" borderWidth={0} outlineWidth={0} fontSize="$1" fontFamily="$mono" color="$color2" placeholderTextColor="$color10"
  />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRunCommand}
              disabled={isRunning || !command.trim()}
              paddingHorizontal="$2" hoverStyle={{ backgroundColor: "$color11" }}
            >
              <SizableText fontSize="$1" color="$color8">{isRunning ? '...' : 'Run'}</SizableText>
            </Button>
          </XStack>
        </YStack>
      )}
    </YStack>
  );
}

function EventItem({ event }: { event: DebugEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const time = new Date(event.timestamp).toLocaleTimeString();

  // Color code by event type
  const getEventColor = (eventType: string) => {
    if (eventType.includes('error') || eventType.includes('failed')) return 'text-red-500';
    if (eventType.includes('retry')) return 'text-yellow-500';
    if (eventType.includes('completed') || eventType.includes('success')) return 'text-green-500';
    if (eventType.includes('tool')) return 'text-blue-500';
    if (eventType.includes('agent')) return 'text-purple-500';
    if (eventType.includes('plan')) return 'text-orange-500';
    return 'text-foreground';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger width="100%">
        <XStack alignItems="center" gap="$2" padding="$1.5" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}>
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <SizableText color="$color11" fontFamily="$mono">{time}</SizableText>
          <SizableText fontWeight="500" className={`${getEventColor(event.event)}`}>
            {event.event}
          </SizableText>
          {event.count && event.count > 1 && (
            <SizableText color="$color11" fontFamily="$mono">
              ({event.count})
            </SizableText>
          )}
        </XStack>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <YStack marginLeft="$5" padding="$2" backgroundColor="$color3" borderRadius="$2" overflow="scroll">
          <pre>{JSON.stringify(event.data, null, 2)}</pre>
        </YStack>
      </CollapsibleContent>
    </Collapsible>
  );
}
