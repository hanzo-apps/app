'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { checkpointManager, Checkpoint } from '@/lib/vfs/checkpoint';

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
    <button
      onClick={handleRestore}
      disabled={isRestoring}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isRestoring
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      } ${className}`}
      title={description || 'Restore to this checkpoint'}
    >
      <RotateCcw className={`h-3.5 w-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
      {isRestoring ? 'Restoring...' : 'Rollback'}
    </button>
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
  const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>([]);
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
    return <div className={`text-sm text-muted-foreground ${className}`}>Loading checkpoints...</div>;
  }

  if (checkpoints.length === 0) {
    return <div className={`text-sm text-muted-foreground ${className}`}>No checkpoints available</div>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {checkpoints.map((checkpoint) => (
        <div
          key={checkpoint.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{checkpoint.description}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(checkpoint.timestamp).toLocaleString()}
              {' · '}
              <span className="capitalize">{checkpoint.kind}</span>
            </div>
          </div>
          <RollbackButton
            checkpointId={checkpoint.id}
            description={checkpoint.description}
            onRestore={(success) => handleRestore(checkpoint.id, success)}
            className="ml-2 flex-shrink-0"
          />
        </div>
      ))}
    </div>
  );
}
