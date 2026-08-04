'use client';

import { YStack, XStack, H3, SizableText, Paragraph, Image } from '@hanzo/gui';
import React, { useState, useEffect, useCallback } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { VirtualFile } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { X, Code2, Save, FileCode, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@hanzo/ui';
interface MultiTabEditorProps {
  projectId: string;
  onFilesChange?: () => void;
  onClose?: () => void;
}

interface OpenFile {
  file: VirtualFile;
  content: string;
  modified: boolean;
}

export function MultiTabEditor({ projectId, onFilesChange: _onFilesChange, onClose }: MultiTabEditorProps) {
  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  useEffect(() => {
    const handleFileOpen = (event: CustomEvent<VirtualFile>) => {
      openFile(event.detail);
    };

    window.addEventListener('openFile', handleFileOpen as EventListener);

    return () => {
      window.removeEventListener('openFile', handleFileOpen as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const handleFilesChanged = async (event: CustomEvent) => {
      if (event.detail?.fromEditor) return;

      setOpenFiles(prev => {
        const updateFiles = async () => {
          const updatedFiles = new Map<string, OpenFile>();

          for (const [path, openFile] of prev.entries()) {
            try {
              await vfs.init();
              const freshFile = await vfs.readFile(projectId, path);
              updatedFiles.set(path, {
                file: freshFile,
                content: openFile.modified ? openFile.content : freshFile.content as string,
                modified: openFile.modified
              });
            } catch {
            }
          }
          setOpenFiles(updatedFiles);
        };

        updateFiles();
        return prev;
      });
    };

    window.addEventListener('filesChanged', handleFilesChanged as unknown as EventListener);

    return () => {
      window.removeEventListener('filesChanged', handleFilesChanged as unknown as EventListener);
    };
  }, [projectId]);

  const openFile = async (file: VirtualFile) => {
    if (openFiles.has(file.path)) {
      setActiveFilePath(file.path);
      return;
    }

    const openFile: OpenFile = {
      file,
      content: file.content as string,
      modified: false
    };

    setOpenFiles(prev => new Map(prev).set(file.path, openFile));
    setActiveFilePath(file.path);
  };

  const closeFile = (path: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    const file = openFiles.get(path);
    if (file?.modified) {
      if (!confirm(`Close ${file.file.name} without saving?`)) {
        return;
      }
    }

    setOpenFiles(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });

    if (activeFilePath === path) {
      const remaining = Array.from(openFiles.keys()).filter(p => p !== path);
      setActiveFilePath(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  const handleContentChange = useCallback((value: string | undefined, path: string) => {
    if (value === undefined) return;

    const fileType = getFileType(path);
    if (fileType.type !== 'text') return;

    setOpenFiles(prev => {
      const next = new Map(prev);
      const file = next.get(path);
      if (file) {
        next.set(path, {
          ...file,
          content: value,
          modified: file.file.content !== value
        });
      }
      return next;
    });
  }, []);

  const saveFile = useCallback(async (path: string) => {
    const openFile = openFiles.get(path);
    if (!openFile || !openFile.modified) return;

    try {
      await vfs.init();
      const updatedFile = await vfs.updateFile(projectId, path, openFile.content);

      setOpenFiles(prev => {
        const next = new Map(prev);
        next.set(path, {
          file: updatedFile,
          content: openFile.content,
          modified: false
        });
        return next;
      });

      window.dispatchEvent(new CustomEvent('fileContentChanged', {
        detail: { path, projectId }
      }));
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [openFiles, projectId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (activeFilePath) {
        saveFile(activeFilePath);
      }
    }
  }, [activeFilePath, saveFile]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getFileType = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext || '')) {
      return { type: 'image', language: 'plaintext' };
    }

    const textExtensions: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'txt': 'plaintext',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml'
    };

    if (textExtensions[ext || '']) {
      return { type: 'text', language: textExtensions[ext || ''] };
    }

    const binaryExtensions = ['zip', 'tar', 'gz', 'exe', 'bin', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (binaryExtensions.includes(ext || '')) {
      return { type: 'unsupported', language: 'plaintext' };
    }

    return { type: 'text', language: 'plaintext' };
  };

  const getLanguageFromPath = (path: string): string => {
    return getFileType(path).language;
  };

  const activeFile = activeFilePath ? openFiles.get(activeFilePath) : null;

  return (
    <YStack height="100%">
      <XStack padding="$3" borderBottomWidth={1} backgroundColor="$color3" alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Code2
            size={16}
            style={{ color: 'var(--brand-accent)' }}
  />
          {onClose ? (
            <Button
              type="button"
              onClick={onClose}
              aria-label="Hide code editor"
              position="relative" display="none" height="$5" width="$5" alignItems="center" justifyContent="center" borderRadius="$1" group {...{ color: "$color11" }}
            >
              <Code2
                size={16}
                style={{ color: 'var(--brand-accent)' }}
  />
              <X size={12} />
            </Button>
          ) : (
            <Code2
              size={16}
              style={{ color: 'var(--brand-accent)' }}
  />
          )}
          <H3 fontSize="$3" fontWeight="500">Code Editor</H3>
        </XStack>
        {activeFile?.modified && getFileType(activeFile.file.path).type === 'text' && (
          <Button
            size="sm"
            variant="ghost"
            paddingHorizontal="$2" gap="$1.5"
            onClick={() => saveFile(activeFilePath!)}
          >
            <Save size={12} />
            <SizableText fontSize="$1">Save</SizableText>
          </Button>
        )}
      </XStack>

      {openFiles.size === 0 ? (
        <XStack flex={1} alignItems="center" justifyContent="center">
          <YStack rowGap="$3">
            <SizableText color="$color11"><FileCode size={48} /></SizableText>
            <YStack rowGap="$1">
              <Paragraph fontSize="$4" fontWeight="500" color="$color11" textAlign="center">No files open</Paragraph>
              <Paragraph fontSize="$3" color="$color11" textAlign="center">Select a file from the explorer to edit</Paragraph>
            </YStack>
          </YStack>
        </XStack>
      ) : (
        <>
      <YStack borderBottomWidth={1} backgroundColor="$color3">
        <XStack alignItems="center" overflow="scroll" className="thin-scrollbar">
          {Array.from(openFiles.entries()).map(([path, file]) => (
            <XStack
              key={path}
              alignItems="center" gap="$2" paddingHorizontal="$4" paddingVertical="$2.5" borderRightWidth={1} cursor="pointer" position="relative" group {...{ backgroundColor: activeFilePath === path ? "$background" : undefined, borderBottomWidth: activeFilePath === path ? 2 : 2, borderBottomColor: activeFilePath === path ? "$color12" : "transparent", elevation: activeFilePath === path ? 1 : undefined, hoverStyle: activeFilePath === path ? undefined : {"backgroundColor":"$color3"} }}
              onClick={() => setActiveFilePath(path)}
            >
              <SizableText fontSize="$3">
                {file.file.name}
                {file.modified && <SizableText color="$orange9" marginLeft="$1">●</SizableText>}
              </SizableText>
              <Button
                size="icon"
                variant="ghost"
                height="$4" width="$4" padding="$0" opacity={0} $group-hover={{ opacity: 1 }}
                onClick={(e) => closeFile(path, e)}
              >
                <X size={12} />
              </Button>
            </XStack>
          ))}
        </XStack>
      </YStack>

          {activeFile && (
            <YStack flex={1} borderTopWidth={1}>
              {(() => {
                const fileType = getFileType(activeFile.file.path);

                if (fileType.type === 'image') {
                  return (
                    <XStack height="100%" alignItems="center" justifyContent="center" backgroundColor="$background" padding="$6">
                      <YStack rowGap="$4" maxWidth={672}>
                        <ImageIcon size={48} />
                        <YStack rowGap="$2">
                          <H3 fontSize="$6" fontWeight="500" textAlign="center">Image Preview</H3>
                          <Paragraph fontSize="$3" color="$color11" textAlign="center">
                            {activeFile.file.name}
                          </Paragraph>
                        </YStack>
                        <YStack borderWidth={1} borderRadius="$5" padding="$4" backgroundColor="$color3" maxHeight={384} overflow="scroll">
                          <Image
                            src={`data:image/${activeFile.file.path.split('.').pop()};base64,${activeFile.content}`}
                            alt={activeFile.file.name}
                            maxWidth="100%" height="auto"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const errorMsg = target.parentElement?.querySelector('.error-msg');
                              if (!errorMsg) {
                                const div = document.createElement('div');
                                div.className = 'error-msg text-sm text-muted-foreground flex items-center gap-2';
                                div.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Unable to display image';
                                target.parentElement?.appendChild(div);
                              }
                            }}
  />
                        </YStack>
                        <Paragraph fontSize="$1" color="$color11" textAlign="center">
                          Image files cannot be edited in the text editor
                        </Paragraph>
                      </YStack>
                    </XStack>
                  );
                }

                if (fileType.type === 'unsupported') {
                  return (
                    <XStack height="100%" alignItems="center" justifyContent="center" backgroundColor="$background" padding="$6">
                      <YStack rowGap="$4">
                        <AlertCircle size={48} />
                        <YStack rowGap="$2">
                          <H3 fontSize="$6" fontWeight="500" textAlign="center">Unsupported File Type</H3>
                          <Paragraph fontSize="$3" color="$color11" textAlign="center">
                            {activeFile.file.name}
                          </Paragraph>
                          <Paragraph fontSize="$3" color="$color11" maxWidth={448} textAlign="center">
                            This file type is not supported for editing in the text editor.
                            Binary files and certain document formats cannot be displayed here.
                          </Paragraph>
                        </YStack>
                      </YStack>
                    </XStack>
                  );
                }

                return (
                  <CodeEditor
                    key={activeFile.file.path}
                    height="100%"
                    language={getLanguageFromPath(activeFile.file.path)}
                    value={activeFile.content}
                    onChange={(value) => handleContentChange(value, activeFile.file.path)}
  />
                );
              })()}
            </YStack>
          )}
        </>
      )}
    </YStack>
  );
}

export function openFileInEditor(file: VirtualFile) {
  window.dispatchEvent(new CustomEvent('openFile', { detail: file }));
}
