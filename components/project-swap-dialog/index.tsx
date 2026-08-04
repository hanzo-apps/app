'use client';

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, Button } from '@hanzo/ui';
import {
  Loader2, AlertTriangle, Plus, Minus, RefreshCw, Key,
  Code2, Wrench, Clock,
} from 'lucide-react';

interface SwapDiff {
  edgeFunctions: { added: string[]; removed: string[]; changed: string[] };
  serverFunctions: { added: string[]; removed: string[]; changed: string[] };
  secrets: { added: string[]; removed: string[]; overlapping: string[] };
  scheduledFunctions: { added: string[]; removed: string[]; changed: string[] };
  hasConflicts: boolean;
}

interface ProjectSwapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentId: string;
  deploymentName: string;
  currentProjectId: string;
  newProjectId: string;
  newProjectName: string;
  onSwapComplete: () => void;
}

export function ProjectSwapDialog({
  isOpen,
  onClose,
  deploymentId,
  deploymentName,
  currentProjectId,
  newProjectId,
  newProjectName,
  onSwapComplete,
}: ProjectSwapDialogProps) {
  const [diff, setDiff] = useState<SwapDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    if (isOpen && newProjectId !== currentProjectId) {
      loadDiff();
    }
  }, [isOpen, deploymentId, newProjectId]);

  const loadDiff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/v1/deployments/${deploymentId}/swap-project?projectId=${encodeURIComponent(newProjectId)}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze swap');
      }
      const data = await res.json();
      setDiff(data.diff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze swap');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    try {
      setSwapping(true);
      setError(null);
      const res = await fetch(`/v1/deployments/${deploymentId}/swap-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to swap project');
      }
      onSwapComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to swap project');
    } finally {
      setSwapping(false);
    }
  };

  const isEmpty = diff && !diff.hasConflicts &&
    diff.edgeFunctions.added.length === 0 &&
    diff.serverFunctions.added.length === 0 &&
    diff.secrets.added.length === 0 &&
    diff.scheduledFunctions.added.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent $sm={{ maxWidth: 512 }}>
        <DialogHeader>
          <DialogTitle>Swap Source Project</DialogTitle>
          <DialogDescription>
            Change &ldquo;{deploymentName}&rdquo; to use &ldquo;{newProjectName}&rdquo; as its source project.
            This will rebuild the deployment with the new project&apos;s files and backend features.
          </DialogDescription>
        </DialogHeader>

        <YStack paddingVertical="$4">
          {loading && (
            <XStack alignItems="center" justifyContent="center" paddingVertical="$6">
              <Loader2 size={24} color="$color11" />
              <SizableText marginLeft="$2" fontSize="$3" color="$color11">Analyzing changes...</SizableText>
            </XStack>
          )}

          {error && (
            <XStack alignItems="flex-start" gap="$2" padding="$3" backgroundColor="$red9" borderWidth={1} borderColor="$red9" borderRadius="$5">
              <AlertTriangle size={16} color="$red9" />
              <Paragraph fontSize="$3" color="$red9">{error}</Paragraph>
            </XStack>
          )}

          {diff && !loading && (
            <YStack rowGap="$4">
              {isEmpty && (
                <Paragraph fontSize="$3" color="$color11">
                  No backend feature changes detected. The deployment will be rebuilt with the new project&apos;s files.
                </Paragraph>
              )}

              {/* Edge Functions diff */}
              <DiffSection
                icon={<Code2 size={16} />}
                title="Edge Functions"
                added={diff.edgeFunctions.added}
                removed={diff.edgeFunctions.removed}
                changed={diff.edgeFunctions.changed}
  />

              {/* Server Functions diff */}
              <DiffSection
                icon={<Wrench size={16} />}
                title="Server Functions"
                added={diff.serverFunctions.added}
                removed={diff.serverFunctions.removed}
                changed={diff.serverFunctions.changed}
  />

              {/* Secrets diff */}
              {(diff.secrets.added.length > 0 || diff.secrets.removed.length > 0 || diff.secrets.overlapping.length > 0) && (
                <YStack rowGap="$2">
                  <XStack alignItems="center" gap="$2">
                    <Key size={16} />
                    <SizableText fontSize="$3" fontWeight="500">Secrets</SizableText>
                  </XStack>
                  <YStack paddingLeft="$5" rowGap="$1">
                    {diff.secrets.added.map(name => (
                      <XStack key={name} alignItems="center" gap="$1">
                        <Plus size={12} />
                        <SizableText fontSize="$3" color="$green10">{name}</SizableText>
                      </XStack>
                    ))}
                    {diff.secrets.removed.map(name => (
                      <XStack key={name} alignItems="center" gap="$1">
                        <Minus size={12} />
                        <SizableText fontSize="$3" color="$red10">{name}</SizableText>
                      </XStack>
                    ))}
                    {diff.secrets.overlapping.map(name => (
                      <XStack key={name} alignItems="center" gap="$1">
                        <RefreshCw size={12} />
                        <SizableText fontSize="$3" color="$yellow10">{name} (values will be replaced)</SizableText>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}

              {/* Scheduled Functions diff */}
              <DiffSection
                icon={<Clock size={16} />}
                title="Scheduled Functions"
                added={diff.scheduledFunctions.added}
                removed={diff.scheduledFunctions.removed}
                changed={diff.scheduledFunctions.changed}
  />

              {diff.hasConflicts && (
                <XStack alignItems="flex-start" gap="$2" padding="$3" backgroundColor="$yellow1" borderWidth={1} borderColor="$yellow3" borderRadius="$5" $theme-dark={{ backgroundColor: "$yellow12", borderColor: "$yellow11" }}>
                  <AlertTriangle size={16} color="$yellow10" />
                  <Paragraph fontSize="$3" color="$yellow11" $theme-dark={{ color: "$yellow3" }}>
                    Some backend features will be removed or replaced. Analytics data will be preserved.
                  </Paragraph>
                </XStack>
              )}
            </YStack>
          )}
        </YStack>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={swapping}>
            Cancel
          </Button>
          <Button
            onClick={handleSwap}
            disabled={loading || swapping || !!error}
            variant={diff?.hasConflicts ? 'destructive' : 'default'}
          >
            {swapping ? (
              <>
                <Loader2 size={16} />
                Swapping...
              </>
            ) : (
              'Swap & Republish'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiffSection({
  icon,
  title,
  added,
  removed,
  changed,
}: {
  icon: React.ReactNode;
  title: string;
  added: string[];
  removed: string[];
  changed: string[];
}) {
  if (added.length === 0 && removed.length === 0 && changed.length === 0) return null;

  return (
    <YStack rowGap="$2">
      <XStack alignItems="center" gap="$2">
        {icon}
        <SizableText fontSize="$3" fontWeight="500">{title}</SizableText>
      </XStack>
      <YStack paddingLeft="$5" rowGap="$1">
        {added.map(name => (
          <XStack key={name} alignItems="center" gap="$1">
            <Plus size={12} />
            <SizableText fontSize="$3" color="$green10">{name}</SizableText>
          </XStack>
        ))}
        {removed.map(name => (
          <XStack key={name} alignItems="center" gap="$1">
            <Minus size={12} />
            <SizableText fontSize="$3" color="$red10">{name}</SizableText>
          </XStack>
        ))}
        {changed.map(name => (
          <XStack key={name} alignItems="center" gap="$1">
            <RefreshCw size={12} />
            <SizableText fontSize="$3" color="$yellow10">{name}</SizableText>
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
