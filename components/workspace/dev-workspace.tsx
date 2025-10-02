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

import React, { useState, useCallback } from 'react';
import { WorkspaceLayout } from './split-layout';
import { LivePreview } from '../preview/live-preview';
import { CheckpointList } from '../ui/rollback-button';
import { SaveButton, AutoSaveIndicator } from '../ui/save-button';
import { checkpointManager } from '@/lib/vfs/checkpoint';
import { saveManager } from '@/lib/vfs/save-manager';
import { vfs } from '@/lib/vfs';
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
      // Perform AI operation here
      console.log('Performing AI operation:', operation);

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
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [projectId]);

  const handleCheckpointRestore = useCallback((checkpointId: string, success: boolean) => {
    if (success) {
      console.log('Checkpoint restored:', checkpointId);
      setRefreshTrigger(prev => prev + 1);
    } else {
      console.error('Failed to restore checkpoint:', checkpointId);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Hanzo Build</h1>
            <AutoSaveIndicator projectId={projectId} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showHistory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </button>

            <SaveButton projectId={projectId} onSave={handleSave} />

            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 relative">
        <WorkspaceLayout
          showPreview={showPreview}
          editor={
            <div className="h-full flex flex-col bg-muted/30">
              {/* Editor placeholder */}
              <div className="flex-1 p-4">
                <div className="h-full border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <p className="text-lg font-medium">Code Editor</p>
                    <p className="text-sm text-muted-foreground">
                      Integrate your editor component here
                    </p>

                    {/* Demo buttons */}
                    <div className="space-x-2 pt-4">
                      <button
                        onClick={() => handleAIOperation('Generate component')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Simulate AI Operation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          <div className="absolute right-0 top-0 bottom-0 w-80 border-l bg-background shadow-lg overflow-hidden z-10">
            <div className="h-full flex flex-col">
              <div className="border-b p-4 flex items-center justify-between">
                <h2 className="font-semibold">Checkpoint History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <CheckpointList
                  projectId={projectId}
                  onRestore={handleCheckpointRestore}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
