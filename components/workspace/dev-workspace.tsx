'use client';

/**
 * Dev Workspace Component
 *
 * This component demonstrates the integration of:
 * - Checkpoint/rollback system
 * - Live preview with hot reload
 * - Split-pane layout
 * - Save/auto-save functionality
 */

import { Button } from '@hanzo/ui';
import { YStack, XStack, H1, SizableText, Paragraph, H2 } from '@hanzo/gui';
import { useState, useCallback } from 'react';
import { WorkspaceLayout } from './split-layout';
import { LivePreview } from '../preview/live-preview';
import { CheckpointList } from '../ui/rollback-button';
import { SaveButton, AutoSaveIndicator } from '../ui/save-button';
import { checkpointManager } from '@/lib/vfs/checkpoint';
import { saveManager } from '@/lib/vfs/save-manager';
import { Settings, History, Eye, EyeOff } from 'lucide-react';

interface DevWorkspaceProps {
  projectId: string;
}

export function DevWorkspace({ projectId }: DevWorkspaceProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Example: Auto-checkpoint after AI operation
  const handleAIOperation = useCallback(async (operation: string) => {
    try {
      // Create checkpoint after AI operation
      await checkpointManager.createCheckpoint(
        projectId,
        `After ${operation}`,
        { kind: 'auto' }
      );

      // Mark project as dirty
      saveManager.markDirty(projectId);

      // Trigger preview refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('AI operation failed:', error);
    }
  }, [projectId]);

  const handleSave = useCallback(async () => {
    try {
      await saveManager.save(projectId, 'Manual save');
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [projectId]);

  const handleCheckpointRestore = useCallback((_checkpointId: string, success: boolean) => {
    if (success) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, []);

  return (
    <YStack height="100%">
      {/* Toolbar */}
      <YStack borderBottomWidth={1} backgroundColor="$background" backdropFilter="blur(8px)" className="frosted">
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4" paddingVertical="$2">
          <XStack alignItems="center" gap="$4">
            <H1 fontSize="$6" fontWeight="500">Hanzo Build</H1>
            <AutoSaveIndicator projectId={projectId} />
          </XStack>

          <XStack alignItems="center" gap="$2">
            <Button
              onClick={() => setShowHistory(!showHistory)}
              alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$3" fontSize="$3" fontWeight="500" {...{ backgroundColor: showHistory ? "$color12" : "$color4", color: showHistory ? "$background" : "$color", hoverStyle: showHistory ? undefined : {"backgroundColor":"$color4"} }}
            >
              <History size={16} />
              History
            </Button>

            <Button
              onClick={() => setShowPreview(!showPreview)}
              alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$3" fontSize="$3" fontWeight="500" backgroundColor="$color4" color="$color" hoverStyle={{ backgroundColor: "$color4" }}
            >
              {showPreview ? (
                <>
                  <EyeOff size={16} />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Show Preview
                </>
              )}
            </Button>

            <SaveButton projectId={projectId} onSave={handleSave} />

            <Button
              alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$3" fontSize="$3" fontWeight="500" backgroundColor="$color4" color="$color" hoverStyle={{ backgroundColor: "$color4" }}
            >
              <Settings size={16} />
            </Button>
          </XStack>
        </XStack>
      </YStack>

      {/* Main content area */}
      <YStack flex={1} minHeight={0} position="relative">
        <WorkspaceLayout
          showPreview={showPreview}
          editor={
            <YStack height="100%" backgroundColor="$color3">
              {/* Editor placeholder */}
              <YStack flex={1} padding="$4">
                <XStack height="100%" borderWidth={2} borderStyle="dashed" borderColor="$borderColor" borderRadius="$5" alignItems="center" justifyContent="center">
                  <SizableText textAlign="center" rowGap="$4" display="flex" flexDirection="column">
                    <Paragraph fontSize="$6" fontWeight="500">Code Editor</Paragraph>
                    <Paragraph fontSize="$3" color="$color11">
                      Integrate your editor component here
                    </Paragraph>

                    {/* Demo buttons */}
                    <YStack columnGap="$2" paddingTop="$4">
                      <Button
                        onClick={() => handleAIOperation('Generate component')}
                        paddingHorizontal="$4" paddingVertical="$2" backgroundColor="$color12" color="$background" borderRadius="$3" hoverStyle={{ backgroundColor: "$color12" }}
                      >
                        Simulate AI Operation
                      </Button>
                    </YStack>
                  </SizableText>
                </XStack>
              </YStack>
            </YStack>
          }
          preview={
            <LivePreview
              projectId={projectId}
              refreshTrigger={refreshTrigger}
              onClose={() => setShowPreview(false)}
  />
          }
  />

        {/* History sidebar */}
        {showHistory && (
          <YStack position="absolute" right="$0" top="$0" bottom="$0" width={320} borderLeftWidth={1} backgroundColor="$background" elevation={4} overflow="hidden" zIndex={10}>
            <YStack height="100%">
              <XStack borderBottomWidth={1} padding="$4" alignItems="center" justifyContent="space-between">
                <H2 fontWeight="500">Checkpoint History</H2>
                <Button
                  onClick={() => setShowHistory(false)}
                  color="$color11" hoverStyle={{ color: "$color" }}
                >
                  ×
                </Button>
              </XStack>
              <YStack flex={1} overflow="scroll" padding="$4">
                <CheckpointList
                  projectId={projectId}
                  onRestore={handleCheckpointRestore}
  />
              </YStack>
            </YStack>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
