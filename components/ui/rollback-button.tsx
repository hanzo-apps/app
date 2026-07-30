'use client';

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack } from '@hanzo/gui';
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { checkpointManager, CheckpointMetadata } from '@/lib/vfs/checkpoint';

interface RollbackButtonProps {
  checkpointId: string;
  description?: string;
  onRestore?: (success: boolean) => void;
  className?: string;
}

export function RollbackButton({
  checkpointId,
  description,
  onRestore,
  className = ''
}: RollbackButtonProps) {
  const [isRestoring, setIsRestoring] = React.useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await checkpointManager.restoreCheckpoint(checkpointId);
      onRestore?.(success);

      if (success) {
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('checkpointRestored', {
          detail: { checkpointId }
        }));
      }
    } catch (error) {
      console.error('Failed to restore checkpoint:', error);
      onRestore?.(false);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button
      onClick={handleRestore}
      disabled={isRestoring}
      alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$3" fontSize="$3" fontWeight="500" {...{ backgroundColor: isRestoring ? "$color3" : "$color4", color: isRestoring ? "$color11" : "$color", cursor: isRestoring ? "not-allowed" : undefined, hoverStyle: isRestoring ? undefined : {"backgroundColor":"$color4"} }} className={`${className}`}
      title={description || 'Restore to this checkpoint'}
    >
      <RotateCcw size={14} />
      {isRestoring ? 'Restoring...' : 'Rollback'}
    </Button>
  );
}

interface CheckpointListProps {
  projectId: string;
  onRestore?: (checkpointId: string, success: boolean) => void;
  className?: string;
}

export function CheckpointList({
  projectId,
  onRestore,
  className = ''
}: CheckpointListProps) {
  // getCheckpoints returns the lightweight listing metadata (no file payloads).
  const [checkpoints, setCheckpoints] = React.useState<CheckpointMetadata[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCheckpoints();
  }, [projectId]);

  const loadCheckpoints = async () => {
    setLoading(true);
    try {
      const cps = await checkpointManager.getCheckpoints(projectId);
      setCheckpoints(cps);
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (checkpointId: string, success: boolean) => {
    onRestore?.(checkpointId, success);
    if (success) {
      loadCheckpoints();
    }
  };

  if (loading) {
    return <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column" className={`${className}`}>Loading checkpoints...</SizableText>;
  }

  if (checkpoints.length === 0) {
    return <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column" className={`${className}`}>No checkpoints available</SizableText>;
  }

  return (
    <YStack rowGap="$2" className={`${className}`}>
      {checkpoints.map((checkpoint) => (
        <XStack
          key={checkpoint.id}
          alignItems="center" justifyContent="space-between" padding="$3" borderRadius="$5" borderWidth={1} backgroundColor="$background"
        >
          <YStack flex={1} minWidth={0}>
            <SizableText fontSize="$3" fontWeight="500" numberOfLines={1} display="flex" flexDirection="column">{checkpoint.description}</SizableText>
            <SizableText fontSize="$1" color="$color11" marginTop="$0.5" display="flex" flexDirection="column">
              {new Date(checkpoint.timestamp).toLocaleString()}
              {' · '}
              <SizableText textTransform="capitalize">{checkpoint.kind}</SizableText>
            </SizableText>
          </YStack>
          <RollbackButton
            checkpointId={checkpoint.id}
            description={checkpoint.description}
            onRestore={(success) => handleRestore(checkpoint.id, success)}
            marginLeft="$2"
  />
        </XStack>
      ))}
    </YStack>
  );
}
