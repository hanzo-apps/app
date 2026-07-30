'use client';

import { YStack, XStack, H2, SizableText } from '@hanzo/gui';
import { useState, useEffect, useCallback } from 'react';
import { MultiTabEditor, openFileInEditor } from '@/components/code-tabs';
import { FileExplorer } from '@/components/file-explorer';
import { VirtualFile } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { Button } from '@hanzo/ui';
import { FolderTree, Code2, Columns2, PanelLeft, PanelRight } from 'lucide-react';
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
    <YStack height="100%">
      {/* Toolbar */}
      <XStack borderBottomWidth={1} backgroundColor="$background" backdropFilter="blur(8px)" padding="$2" alignItems="center" justifyContent="space-between" className="frosted">
        <XStack alignItems="center" gap="$2">
          <H2 fontSize="$3" fontWeight="500">Development Environment</H2>
          <SizableText fontSize="$1" color="$color11">Project: {projectId}</SizableText>
        </XStack>

        <XStack alignItems="center" gap="$1">
          {/* Layout Toggle Buttons */}
          <Button
            variant={layout === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('split')}
            title="Split View"
            height="$6" width="$6" padding="$0"
          >
            <Columns2 size={16} />
          </Button>

          <Button
            variant={layout === 'explorer-only' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('explorer-only')}
            title="Explorer Only"
            height="$6" width="$6" padding="$0"
          >
            <PanelLeft size={16} />
          </Button>

          <Button
            variant={layout === 'editor-only' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('editor-only')}
            title="Editor Only"
            height="$6" width="$6" padding="$0"
          >
            <PanelRight size={16} />
          </Button>

          {/* Mobile Quick Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLayout}
            height="$6" paddingHorizontal="$2" $md={{ display: "none" }}
          >
            {showExplorer && !showEditor && <FolderTree size={16} />}
            {showEditor && !showExplorer && <Code2 size={16} />}
            {showExplorer && showEditor && <Columns2 size={16} />}
          </Button>
        </XStack>
      </XStack>

      {/* Main Content Area */}
      <XStack flex={1} overflow="hidden">
        {/* File Explorer Panel */}
        {showExplorer && (
          <YStack
            borderRightWidth={1} backgroundColor="$background" {...{ width: !showEditor ? "100%" : layout === 'full' ? 256 : layout === 'split' ? 256 : undefined, $md: layout === 'full' ? {"width":320} : layout === 'split' ? {"width":320} : undefined, flex: layout === 'explorer-only' ? 1 : undefined }}
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
          </YStack>
        )}

        {/* Editor Panel */}
        {showEditor && (
          <YStack flex={1} overflow="hidden">
            <MultiTabEditor
              projectId={projectId}
              onClose={() => {
                if (layout === 'split' || layout === 'full') {
                  setLayout('explorer-only');
                }
              }}
  />
          </YStack>
        )}

        {/* Empty State - when both are hidden (shouldn't happen but just in case) */}
        {!showExplorer && !showEditor && (
          <SizableText flex={1} alignItems="center" justifyContent="center" color="$color11" display="flex" flexDirection="row">
            <SizableText textAlign="center" rowGap="$4" display="flex" flexDirection="column">
              <Code2 size={48} />
              <p>Select a view from the toolbar above</p>
            </SizableText>
          </SizableText>
        )}
      </XStack>
    </YStack>
  );
}
