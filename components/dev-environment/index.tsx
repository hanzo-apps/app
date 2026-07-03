'use client';

import { useState, useEffect, useCallback } from 'react';
import { MultiTabEditor, openFileInEditor } from '@/components/monaco-editor';
import { FileExplorer } from '@/components/file-explorer';
import { VirtualFile } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { Button } from '@hanzo/ui';
import { FolderTree, Code2, Columns2, PanelLeft, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevEnvironmentProps {
  projectId: string;
}

type Layout = 'full' | 'split' | 'explorer-only' | 'editor-only';

export function DevEnvironment({ projectId }: DevEnvironmentProps) {
  const [layout, setLayout] = useState<Layout>('split');
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showEditor, setShowEditor] = useState(true);

  useEffect(() => {
    // Initialize VFS
    vfs.init().catch(console.error);
  }, []);

  const handleFileSelect = useCallback((file: VirtualFile) => {
    setSelectedFile(file);
    openFileInEditor(file);
    // On mobile, switch to editor-only view when file is selected
    if (window.innerWidth < 768) {
      setLayout('editor-only');
    }
  }, []);

  const toggleLayout = () => {
    const layouts: Layout[] = ['full', 'split', 'explorer-only', 'editor-only'];
    const currentIndex = layouts.indexOf(layout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setLayout(layouts[nextIndex]);
  };

  useEffect(() => {
    switch (layout) {
      case 'full':
        setShowExplorer(true);
        setShowEditor(true);
        break;
      case 'split':
        setShowExplorer(true);
        setShowEditor(true);
        break;
      case 'explorer-only':
        setShowExplorer(true);
        setShowEditor(false);
        break;
      case 'editor-only':
        setShowExplorer(false);
        setShowEditor(true);
        break;
    }
  }, [layout]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Development Environment</h2>
          <span className="text-xs text-muted-foreground">Project: {projectId}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Layout Toggle Buttons */}
          <Button
            variant={layout === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('split')}
            title="Split View"
            className="h-8 w-8 p-0"
          >
            <Columns2 className="h-4 w-4" />
          </Button>

          <Button
            variant={layout === 'explorer-only' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('explorer-only')}
            title="Explorer Only"
            className="h-8 w-8 p-0"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={layout === 'editor-only' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('editor-only')}
            title="Editor Only"
            className="h-8 w-8 p-0"
          >
            <PanelRight className="h-4 w-4" />
          </Button>

          {/* Mobile Quick Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLayout}
            className="md:hidden h-8 px-2"
          >
            {showExplorer && !showEditor && <FolderTree className="h-4 w-4" />}
            {showEditor && !showExplorer && <Code2 className="h-4 w-4" />}
            {showExplorer && showEditor && <Columns2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Panel */}
        {showExplorer && (
          <div
            className={cn(
              'border-r bg-background',
              layout === 'split' && 'w-64 md:w-80',
              layout === 'explorer-only' && 'flex-1',
              layout === 'full' && 'w-64 md:w-80',
              !showEditor && 'w-full'
            )}
          >
            <FileExplorer
              projectId={projectId}
              onFileSelect={handleFileSelect}
              selectedPath={selectedFile?.path}
              onClose={() => {
                if (layout === 'split' || layout === 'full') {
                  setLayout('editor-only');
                }
              }}
            />
          </div>
        )}

        {/* Editor Panel */}
        {showEditor && (
          <div className="flex-1 overflow-hidden">
            <MultiTabEditor
              projectId={projectId}
              onClose={() => {
                if (layout === 'split' || layout === 'full') {
                  setLayout('explorer-only');
                }
              }}
            />
          </div>
        )}

        {/* Empty State - when both are hidden (shouldn't happen but just in case) */}
        {!showExplorer && !showEditor && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <Code2 className="h-12 w-12 mx-auto opacity-50" />
              <p>Select a view from the toolbar above</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
