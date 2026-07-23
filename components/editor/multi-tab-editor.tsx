'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { VirtualFile, ProjectRuntime } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { X, Code2, Save, FileCode, Image as ImageIcon, AlertCircle, Search, Folder } from 'lucide-react';
import { Button } from '@hanzo/ui';
import { cn, logger } from '@/lib/utils';

// index.html floats to the top of its folder; everything else alphabetical.
function fileIndexRank(name: string): number {
  return /^index\.html?$/i.test(name) ? 0 : 1;
}

// Group VFS files by their containing folder for the browse list.
function groupFiles(files: VirtualFile[]): { folder: string; items: VirtualFile[] }[] {
  const map = new Map<string, VirtualFile[]>();
  for (const file of files) {
    const norm = file.path.replace(/^\/+/, '');
    const folder = norm.split('/').slice(0, -1).join('/');
    const arr = map.get(folder) ?? [];
    arr.push(file);
    map.set(folder, arr);
  }
  const folders = Array.from(map.keys()).sort((a, b) =>
    a === b ? 0 : a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)
  );
  return folders.map((folder) => ({
    folder,
    items: (map.get(folder) ?? []).sort(
      (a, b) => fileIndexRank(a.name) - fileIndexRank(b.name) || a.name.localeCompare(b.name)
    ),
  }));
}

interface MultiTabEditorProps {
  projectId: string;
  runtime?: ProjectRuntime;
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
  const savingPathsRef = React.useRef<Set<string>>(new Set());
  // All project files, for the browse list shown when no tab is open.
  const [allFiles, setAllFiles] = useState<VirtualFile[]>([]);
  const [browseQuery, setBrowseQuery] = useState('');

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

  // Keep the browse list (shown when no tab is open) in sync with the VFS.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await vfs.init();
        const files = await vfs.listFiles(projectId);
        if (!cancelled) setAllFiles(files);
      } catch (error) {
        logger.error('Failed to list project files:', error);
      }
    };
    load();
    const onChanged = () => load();
    window.addEventListener('filesChanged', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('filesChanged', onChanged);
    };
  }, [projectId]);

  useEffect(() => {
    const handleFilesChanged = async (event: CustomEvent) => {
      if (event.detail?.fromEditor) return;

      // Process updates asynchronously
      const updateFiles = async () => {
        // Capture current state
        setOpenFiles(prev => {
          const processingSnapshot = prev;

          // Run async updates
          (async () => {
            const updatedFiles = new Map<string, OpenFile>();

            for (const [path, openFile] of processingSnapshot.entries()) {
              // If this file is currently being saved, keep it unchanged
              if (savingPathsRef.current.has(path)) {
                updatedFiles.set(path, openFile);
                continue;
              }

              // If file is modified in editor, keep editor content
              if (openFile.modified) {
                try {
                  await vfs.init();
                  const freshFile = await vfs.readFile(projectId, path);
                  updatedFiles.set(path, {
                    file: freshFile,
                    content: openFile.content,
                    modified: true
                  });
                } catch {
                  updatedFiles.set(path, openFile);
                }
                continue;
              }

              // File not modified, update from VFS
              try {
                await vfs.init();
                const freshFile = await vfs.readFile(projectId, path);
                updatedFiles.set(path, {
                  file: freshFile,
                  content: freshFile.content as string,
                  modified: false
                });
              } catch {
                updatedFiles.set(path, openFile);
              }
            }

            // Only apply updates if no files are being saved
            const hasFilesBeingSaved = Array.from(updatedFiles.keys()).some(path =>
              savingPathsRef.current.has(path)
            );

            if (!hasFilesBeingSaved) {
              setOpenFiles(updatedFiles);
            }
          })();

          return prev;
        });
      };

      updateFiles();
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
        const isModified = file.content !== value;
        next.set(path, {
          ...file,
          content: value,
          modified: isModified
        });
      }
      return next;
    });
  }, []);

  const saveFile = useCallback(async (path: string) => {
    const openFile = openFiles.get(path);
    if (!openFile || !openFile.modified) return;

    // Mark this path as being saved
    savingPathsRef.current.add(path);

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
    } catch (error) {
      logger.error('Failed to save file:', error);
    } finally {
      // Remove from saving paths after a short delay to ensure all handlers have processed
      setTimeout(() => {
        savingPathsRef.current.delete(path);
      }, 100);
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

  // Browse list: every project file except hidden/transient (dot) paths,
  // filtered by the search box and grouped by folder.
  const browseFiltered = useMemo(() => {
    const visible = allFiles.filter((f) => !f.path.startsWith('/.'));
    const q = browseQuery.trim().toLowerCase();
    return q ? visible.filter((f) => f.path.toLowerCase().includes(q)) : visible;
  }, [allFiles, browseQuery]);
  const browseGroups = useMemo(() => groupFiles(browseFiltered), [browseFiltered]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-muted/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 
            className="h-4 w-4 md:hidden" 
            style={{ color: 'var(--button-editor-active)' }} 
          />
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide code editor"
              className="relative hidden h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-destructive md:flex group"
            >
              <Code2 
                className="h-4 w-4 transition-opacity group-hover:opacity-0" 
                style={{ color: 'var(--button-editor-active)' }} 
              />
              <X className="absolute h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ) : (
            <Code2 
              className="hidden h-4 w-4 md:inline-flex" 
              style={{ color: 'var(--button-editor-active)' }} 
            />
          )}
          <h3 className="text-sm font-medium">Code Editor</h3>
        </div>
        {activeFile?.modified && getFileType(activeFile.file.path).type === 'text' && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-2 gap-1.5"
            onClick={() => saveFile(activeFilePath!)}
          >
            <Save className="h-3 w-3" />
            <span className="text-xs">Save</span>
          </Button>
        )}
      </div>
      
      {openFiles.size === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={browseQuery}
              onChange={(e) => setBrowseQuery(e.target.value)}
              placeholder="Search files…"
              aria-label="Search files"
              className="w-full bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {browseFiltered.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {browseGroups.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                <FileCode className="h-10 w-10 opacity-40" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {allFiles.length === 0
                      ? 'No files in this project yet'
                      : 'No files match your search'}
                  </p>
                  <p className="text-xs">Pick a file to open it in the editor.</p>
                </div>
              </div>
            ) : (
              browseGroups.map((group) => (
                <div key={group.folder || '/'} className="py-0.5">
                  {group.folder && (
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                      <Folder className="h-3 w-3 shrink-0" />
                      <span className="truncate">{group.folder}</span>
                    </div>
                  )}
                  {group.items.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => openFile(file)}
                      title={file.path}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none',
                        group.folder ? 'pl-7' : ''
                      )}
                    >
                      {getFileType(file.path).type === 'image' ? (
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate font-mono text-xs">{file.name}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
      <div className="border-b bg-muted/70">
        <div className="flex items-center overflow-x-auto scrollbar-thin">
          {Array.from(openFiles.entries()).map(([path, file]) => (
            <div
              key={path}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 border-r cursor-pointer transition-all relative group',
                activeFilePath === path 
                  ? 'bg-background border-b-2 border-b-primary shadow-sm' 
                  : 'hover:bg-muted/50 border-b-2 border-b-transparent'
              )}
              onClick={() => setActiveFilePath(path)}
            >
              <span className="text-sm">
                {file.file.name}
                {file.modified && <span className="text-orange-500 ml-1">●</span>}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => closeFile(path, e)}
              >
                <X className="h-3 w-3 hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

          {activeFile && (
            <div className="flex-1 border-t">
              {(() => {
                const fileType = getFileType(activeFile.file.path);
                
                if (fileType.type === 'image') {
                  return (
                    <div className="h-full flex items-center justify-center bg-background p-8">
                      <div className="text-center space-y-4 max-w-2xl">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Image Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            {activeFile.file.name}
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-auto">
                          <img 
                            src={`data:image/${activeFile.file.path.split('.').pop()};base64,${activeFile.content}`}
                            alt={activeFile.file.name}
                            className="max-w-full h-auto rounded shadow-sm"
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
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Image files cannot be edited in the text editor
                        </p>
                      </div>
                    </div>
                  );
                }
                
                if (fileType.type === 'unsupported') {
                  return (
                    <div className="h-full flex items-center justify-center bg-background p-8">
                      <div className="text-center space-y-4">
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Unsupported File Type</h3>
                          <p className="text-sm text-muted-foreground">
                            {activeFile.file.name}
                          </p>
                          <p className="text-sm text-muted-foreground max-w-md">
                            This file type is not supported for editing in the text editor.
                            Binary files and certain document formats cannot be displayed here.
                          </p>
                        </div>
                      </div>
                    </div>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function openFileInEditor(file: VirtualFile) {
  window.dispatchEvent(new CustomEvent('openFile', { detail: file }));
}
