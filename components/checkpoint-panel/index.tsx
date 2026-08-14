'use client';

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/ui';
import { useState, useEffect, useMemo } from 'react';
import { Button, Badge, Tooltip, TooltipContent, TooltipTrigger } from '@hanzo/ui';
import { History, RotateCcw, ArrowRight, X, Inbox } from 'lucide-react';
import { checkpointManager, CheckpointMetadata } from '@/lib/vfs/checkpoint';
import { formatDistanceToNow } from 'date-fns';
import { DebugEvent } from '@/components/debug-panel';

interface CheckpointPanelProps {
  projectId: string;
  events: DebugEvent[];
  currentCheckpointId?: string;
  onRestore: (checkpointId: string, description?: string) => void;
  onScrollToTurn: (checkpointId: string) => void;
  onClose?: () => void;
  refreshKey?: number;
}

export function CheckpointPanel({
  projectId,
  events,
  currentCheckpointId,
  onRestore,
  onScrollToTurn,
  onClose,
  refreshKey
}: CheckpointPanelProps) {
  const [checkpoints, setCheckpoints] = useState<CheckpointMetadata[]>([]);

  // Build set of checkpoint IDs that have linked turns in the current session
  const linkedCheckpointIds = useMemo(() => {
    const ids = new Set<string>();
    for (const event of events) {
      if (event.event === 'checkpoint_created' && event.data?.checkpointId) {
        ids.add(event.data.checkpointId);
      }
    }
    return ids;
  }, [events]);

  // Load checkpoints on mount and when events change (new checkpoints may have been created)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cps = await checkpointManager.getCheckpoints(projectId);
      if (!cancelled) {
        setCheckpoints(cps);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectId, events.length, refreshKey]);

  return (
    <YStack
      height="100%" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={1} overflow="hidden"
      style={{
        background: `linear-gradient(0deg, rgb(var(--tint) / 0.01), rgb(var(--tint) / 0.01)), var(--card)`,
        minWidth: '240px'
      }}
    >
      {/* Header */}
      <XStack
        alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingVertical="$2" borderBottomWidth={1} borderColor="$borderColor" flexShrink={0}
        style={{
          background: `linear-gradient(0deg, rgb(var(--tint) / 0.03), rgb(var(--tint) / 0.05))`
        }}
      >
        <XStack alignItems="center" gap="$2">
          <History size={14} style={{ color: 'var(--brand-accent)' }} />
          <SizableText fontSize="$1" fontWeight="500">Checkpoints</SizableText>
          {checkpoints.length > 0 && (
            <SizableText fontSize={10} color="$color11">({checkpoints.length})</SizableText>
          )}
        </XStack>
        {onClose && (
          <Button variant="ghost" size="icon" padding="$0" onClick={onClose}>
            <X size={14} />
          </Button>
        )}
      </XStack>

      {/* Checkpoint list */}
      <YStack flex={1} overflow="scroll">
        {checkpoints.length === 0 ? (
          <YStack alignItems="center" justifyContent="center" height="100%" gap="$2" padding="$4">
            <Inbox size={32} />
            <SizableText fontSize="$1" textAlign="center" color="$color11">No checkpoints yet. Hanzo saves one every time it changes your files, so you can go back to any earlier version from here.</SizableText>
          </YStack>
        ) : (
          <YStack padding="$2" rowGap="$1.5">
            {checkpoints.map((cp) => {
              const isCurrent = cp.id === currentCheckpointId;
              const hasLinkedTurn = linkedCheckpointIds.has(cp.id);

              return (
                <YStack
                  key={cp.id}
                  borderRadius="$3" borderWidth={1} paddingHorizontal="$2.5" paddingVertical="$2" {...{ borderColor: isCurrent ? "$color12" : "$borderColor", backgroundColor: isCurrent ? "$color3" : "$background", hoverStyle: isCurrent ? undefined : {"backgroundColor":"$color3"} }}
                >
                  {/* Top row: badge + timestamp */}
                  <XStack alignItems="center" gap="$1.5" marginBottom="$1">
                    <Badge
                      variant={cp.kind === 'manual' ? 'default' : 'secondary'}
                      className="h-4 px-1.5 text-[9px] leading-none"
                    >
                      {cp.kind === 'manual' ? 'save' : cp.kind}
                    </Badge>
                    <SizableText fontSize={10} color="$color11" marginLeft="auto" whiteSpace="nowrap">
                      {formatDistanceToNow(new Date(cp.timestamp), { addSuffix: true })}
                    </SizableText>
                  </XStack>

                  {/* Description */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Paragraph fontSize={11} color="$color" numberOfLines={1} lineHeight="1.375" marginBottom="$1.5">
                        {cp.description}
                      </Paragraph>
                    </TooltipTrigger>
                    <TooltipContent maxWidth={300}>
                      <Paragraph fontSize="$1">{cp.description}</Paragraph>
                    </TooltipContent>
                  </Tooltip>

                  {/* Actions */}
                  <XStack alignItems="center" gap="$1">
                    {hasLinkedTurn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        paddingHorizontal="$1.5"
                        onClick={() => onScrollToTurn(cp.id)}
                      >
                        <ArrowRight size={12} />
                        <SizableText fontSize={10} color="$color11">Jump</SizableText>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      paddingHorizontal="$1.5" marginLeft="auto"
                      onClick={() => onRestore(cp.id, cp.description)}
                    >
                      <RotateCcw size={12} />
                      <SizableText fontSize={10} color="$color11">Restore</SizableText>
                    </Button>
                  </XStack>
                </YStack>
              );
            })}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
