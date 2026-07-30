'use client';

import { SizableText, YStack, XStack, H3, Paragraph } from '@hanzo/gui';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualFile, isFileSupported, FILE_SIZE_LIMITS, getFileTypeFromPath } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { logger } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FolderTree,
  Upload,
  Image,
  Video,
  X,
  Eye,
  EyeOff,
  Server,
  BookOpen,
  Home,
  ScrollText
} from 'lucide-react';
import { Button, Input, toast } from '@hanzo/ui';

interface FileExplorerProps {
  projectId: string;
  onFileSelect?: (file: VirtualFile) => void;
  selectedPath?: string;
  onClose?: () => void;
  entryPoint?: string;
  onSetEntryPoint?: (path: string) => void;
  onAddPromptFile?: () => void;
}

interface FileTreeItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

export function FileExplorer({ projectId, onFileSelect, selectedPath, onClose, entryPoint, onSetEntryPoint, onAddPromptFile }: FileExplorerProps) {
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FileTreeItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`osw-prompt-dismissed-${projectId}`) === 'true';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadFilesVersionRef = useRef(0);

  // Check if a path is a transient/read-only path (skills or server context)
  const isTransientPath = (path: string): boolean => {
    return path.startsWith('/.skills/') || path.startsWith('/.server/') ||
           path === '/.skills' || path === '/.server';
  };

  // Check if a path is a server context path
  const isServerContextPath = (path: string): boolean => {
    return path.startsWith('/.server/') || path === '/.server';
  };

  // Check if a path is a skills path
  const isSkillsPath = (path: string): boolean => {
    return path.startsWith('/.skills/') || path === '/.skills';
  };

  const loadFiles = useCallback(async () => {
    const version = ++loadFilesVersionRef.current;
    try {
      await vfs.init();
      // Get regular files and directories
      const allItems = await vfs.getAllFilesAndDirectories(projectId);

      // Add truly transient files (/.server/, /.skills/) if showHidden is true
      // Adapter-stored dot files (/.PROMPT.md, /.renderer/) are already in allItems
      if (showHidden) {
        const transientFiles = await vfs.listDirectory(projectId, '/', { includeTransient: true });
        const existingPaths = new Set(allItems.map(item => item.path));
        const transientOnly = transientFiles.filter(f =>
          f.path.startsWith('/.') && !existingPaths.has(f.path)
        );

        // Get enabled skills to filter /.skills/ folder
        const { skillsService } = await import('@/lib/vfs/skills');
        const enabledSkills = await skillsService.getEnabledSkills();
        const enabledSkillPaths = new Set(enabledSkills.map(s => `/.skills/${s.id}.md`));

        // Filter transient files: include all non-skill files, but only enabled skills
        const filteredTransient = transientOnly.filter(file => {
          // If it's in /.skills/, only include if it's enabled
          if (file.path.startsWith('/.skills/')) {
            return enabledSkillPaths.has(file.path);
          }
          // Include all other transient files
          return true;
        });

        allItems.push(...filteredTransient);
      }

      // Only update state if this is still the latest call
      if (version !== loadFilesVersionRef.current) return;

      const projectFiles = allItems.filter(item => item.type !== 'directory') as VirtualFile[];
      setFiles(projectFiles);
      setFileTree(buildFileTree(allItems, showHidden));
    } catch (error) {
      logger.error('Failed to load files:', error);
    }
  }, [projectId, showHidden]);

  useEffect(() => {
    loadFiles();
    
    const handleFilesChanged = () => {
      loadFiles();
    };
    
    window.addEventListener('filesChanged', handleFilesChanged);
    
    return () => {
      window.removeEventListener('filesChanged', handleFilesChanged);
    };
  }, [projectId, loadFiles]);

  const buildFileTree = (items: Array<VirtualFile | { path: string; name: string; type: 'directory' }>, includeHidden: boolean): FileTreeItem[] => {
    // Filter out hidden files/directories unless includeHidden is true
    const filteredItems = includeHidden ? items : items.filter(item => !item.path.startsWith('/.'));

    const tree: FileTreeItem[] = [];
    const dirMap = new Map<string, FileTreeItem>();

    filteredItems.forEach(item => {
      if (item.type === 'directory') {
        const parts = item.path.split('/').filter(Boolean);
        const dirItem: FileTreeItem = {
          path: item.path,
          name: item.name || parts[parts.length - 1] || 'unnamed',
          type: 'directory',
          children: []
        };
        dirMap.set(item.path, dirItem);
      }
    });

    filteredItems.forEach(item => {
      if (item.type !== 'directory') {
        const parts = item.path.split('/').filter(Boolean);
        let currentPath = '';
        
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath + '/' + parts[i];
          
          if (!dirMap.has(currentPath)) {
            const dir: FileTreeItem = {
              path: currentPath,
              name: parts[i],
              type: 'directory',
              children: []
            };
            dirMap.set(currentPath, dir);
          }
        }
      }
    });

    dirMap.forEach((dir, path) => {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 1) {
        tree.push(dir);
      } else {
        const parentPath = '/' + parts.slice(0, -1).join('/');
        const parent = dirMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(dir);
        }
      }
    });

    filteredItems.forEach(item => {
      if (item.type !== 'directory') {
        const file = item as VirtualFile;
        const parts = file.path.split('/').filter(Boolean);
        const fileItem: FileTreeItem = {
          path: file.path,
          name: file.name,
          type: 'file'
        };

        if (parts.length === 1) {
          tree.push(fileItem);
        } else {
          const dirPath = '/' + parts.slice(0, -1).join('/');
          const dir = dirMap.get(dirPath);
          if (dir) {
            dir.children?.push(fileItem);
          }
        }
      }
    });

    const sortItems = (items: FileTreeItem[]) => {
      items.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });
      items.forEach(item => {
        if (item.children) {
          sortItems(item.children);
        }
      });
    };

    sortItems(tree);
    return tree;
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (item: FileTreeItem) => {
    if (item.type === 'directory') {
      toggleDirectory(item.path);
    } else {
      const file = files.find(f => f.path === item.path);
      if (file && onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleCreateFile = async (dirPath: string = '/') => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    const filePath = dirPath === '/' ? `/${fileName}` : `${dirPath}/${fileName}`;
    
    try {
      await vfs.createFile(projectId, filePath, '');
      await loadFiles();
    } catch (error) {
      logger.error('Failed to create file:', error);
    }
  };

  const handleCreateDirectory = async (parentPath: string = '/') => {
    const dirName = prompt('Enter directory name:');
    if (!dirName) return;

    const dirPath = parentPath === '/' ? `/${dirName}` : `${parentPath}/${dirName}`;
    
    try {
      await vfs.createDirectory(projectId, dirPath);
      await loadFiles();
    } catch (error) {
      logger.error('Failed to create directory:', error);
    }
  };

  const handleDelete = async (path: string, type: 'file' | 'directory') => {
    if (!confirm(`Delete ${type} "${path}"?`)) return;

    try {
      if (type === 'file') {
        await vfs.deleteFile(projectId, path);
      } else {
        await vfs.deleteDirectory(projectId, path);
      }
      await loadFiles();
    } catch (error) {
      logger.error(`Failed to delete ${type}:`, error);
    }
  };

  const handleRename = async (oldPath: string, itemType: 'file' | 'directory') => {
    if (!newName) return;

    const parts = oldPath.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');

    try {
      if (itemType === 'directory') {
        await vfs.renameDirectory(projectId, oldPath, newPath);
      } else {
        await vfs.renameFile(projectId, oldPath, newPath);
      }
      await loadFiles();
      setRenamingPath(null);
      setNewName('');
    } catch (error) {
      logger.error(`Failed to rename ${itemType}:`, error);
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const items = Array.from(e.dataTransfer.items);
    
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file, '/');
        }
      }
    }
  };

  const uploadFile = async (file: File, targetDir: string) => {
    if (!isFileSupported(file.name)) {
      toast.error(`File type not supported: ${file.name}`);
      return;
    }

    const fileType = getFileTypeFromPath(file.name);
    const sizeLimit = FILE_SIZE_LIMITS[fileType];
    if (file.size > sizeLimit) {
      toast.error(`File too large: ${file.name}. Maximum size is ${Math.round(sizeLimit / 1024 / 1024)}MB`);
      return;
    }

    const filePath = targetDir === '/' ? `/${file.name}` : `${targetDir}/${file.name}`;

    try {
      let content: string | ArrayBuffer;
      
      if (fileType === 'image' || fileType === 'video' || fileType === 'binary') {
        content = await file.arrayBuffer();
      } else {
        content = await file.text();
      }

      await vfs.createFile(projectId, filePath, content);
      await loadFiles();
      toast.success(`Uploaded ${file.name}`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        if (confirm(`File "${file.name}" already exists. Overwrite?`)) {
          try {
            await vfs.deleteFile(projectId, filePath);
            await uploadFile(file, targetDir); // Retry
          } catch (deleteError) {
            logger.error('Failed to overwrite file:', deleteError);
            toast.error('Failed to overwrite file');
          }
        }
      } else {
        logger.error('Failed to upload file:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleItemDragStart = (e: React.DragEvent, item: FileTreeItem) => {
    e.stopPropagation();
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleItemDragOver = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem && targetPath !== draggedItem.path) {
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(targetPath);
    }
  };

  const handleItemDrop = async (e: React.DragEvent, targetItem: FileTreeItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) {
      setDropTarget(null);
      return;
    }

    if (targetItem && draggedItem.path === targetItem.path) {
      setDropTarget(null);
      return;
    }

    const targetDir = targetItem ? (targetItem.type === 'directory' ? targetItem.path : '/') : '/';
    
    if (draggedItem.type === 'directory') {
      const draggedDirPath = draggedItem.path.endsWith('/') ? draggedItem.path : draggedItem.path + '/';
      const targetDirPath = targetDir.endsWith('/') ? targetDir : targetDir + '/';
      
      if (targetDirPath.startsWith(draggedDirPath)) {
        toast.error('Cannot move a folder into itself');
        setDropTarget(null);
        return;
      }
    }

    const fileName = draggedItem.name;
    const newPath = targetDir === '/' ? `/${fileName}` : `${targetDir}/${fileName}`;

    try {
      if (draggedItem.type === 'directory') {
        await vfs.moveDirectory(projectId, draggedItem.path, newPath);
      } else {
        await vfs.moveFile(projectId, draggedItem.path, newPath);
      }
      await loadFiles();
      toast.success(`Moved ${draggedItem.name} to ${targetDir === '/' ? 'root' : targetDir}`);
    } catch (error: any) {
      logger.error('Failed to move item:', error);
      toast.error(`Failed to move: ${error.message}`);
    }
    
    setDropTarget(null);
  };

  const renderTreeItem = (item: FileTreeItem, level: number = 0) => {
    const isExpanded = expandedDirs.has(item.path);
    const isSelected = selectedPath === item.path;
    const isRenaming = renamingPath === item.path;
    const isDropTarget = dropTarget === item.path;
    const isTransient = isTransientPath(item.path);
    const isServerContext = isServerContextPath(item.path);
    const isSkills = isSkillsPath(item.path);
    const isHiddenDotFile = !isTransient && (item.name.startsWith('.') || item.path.startsWith('/.'));

    // Get the appropriate folder icon for special directories
    const getFolderIcon = (expanded: boolean) => {
      if (isServerContext) {
        return <Server size={16} color="$orange9" />;
      }
      if (isSkills) {
        return <BookOpen size={16} color="$purple9" />;
      }
      return expanded ? (
        <FolderOpen size={16} color="$blue9" />
      ) : (
        <Folder size={16} color="$blue9" />
      );
    };

    return (
      <div
        key={item.path}
        draggable={!isRenaming && !isTransient}
        onDragStart={(e) => !isTransient && handleItemDragStart(e, item)}
        onDragEnd={handleItemDragEnd}
        onDragOver={(e) => item.type === 'directory' && !isTransient && handleItemDragOver(e, item.path)}
        onDrop={(e) => item.type === 'directory' && !isTransient && handleItemDrop(e, item)}
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <SizableText
            alignItems="center" gap="$2" paddingHorizontal="$2" paddingVertical="$1.5" cursor="pointer" borderRadius="$3" group display="flex" flexDirection="row" hoverStyle={{ backgroundColor: "$color3", color: "$color" }} {...{ backgroundColor: isDropTarget && item.type === 'directory' ? "$blue9" : isSelected ? "$color3" : undefined, color: isSelected ? "$color" : undefined, borderWidth: isDropTarget && item.type === 'directory' ? 1 : undefined, borderColor: isDropTarget && item.type === 'directory' ? "$blue9" : undefined, opacity: (isTransient || isHiddenDotFile) ? 0.75 : draggedItem?.path === item.path ? 0.5 : undefined }}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => handleFileClick(item)}
          >
            {item.type === 'directory' ? (
              <>
                {isExpanded ? (
                  <ChevronDown size={16} color="$color11" />
                ) : (
                  <ChevronRight size={16} color="$color11" />
                )}
                {getFolderIcon(isExpanded)}
              </>
            ) : (
              <>
                <SizableText width="$4" />
                {(() => {
                  const effectiveEntryPoint = entryPoint || '/index.html';
                  if (item.path === effectiveEntryPoint) {
                    return <Home size={16} color="$green9" />;
                  }
                  if (item.name === '.PROMPT.md') {
                    return <ScrollText size={16} color="$yellow9" />;
                  }
                  const fileType = getFileTypeFromPath(item.path);
                  if (fileType === 'image') {
                    return <Image size={16} color="$green9" />;
                  } else if (fileType === 'video') {
                    return <Video size={16} color="$purple9" />;
                  } else {
                    return <File size={16} color="$color11" />;
                  }
                })()}
              </>
            )}
            {isRenaming ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleRename(item.path, item.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename(item.path, item.type);
                  } else if (e.key === 'Escape') {
                    setRenamingPath(null);
                    setNewName('');
                  }
                }}
                height="$4.5" fontSize="$3"
                autoFocus
                onClick={(e) => e.stopPropagation()}
  />
            ) : (
              <SizableText fontSize="$3" flex={1} {...{ fontStyle: (isTransient || isHiddenDotFile) ? "italic" : undefined, color: (isTransient || isHiddenDotFile) ? "$color11" : undefined }}>
                {item.name}
                {isTransient && <SizableText fontSize="$1" color="$color11" marginLeft="$1">(read-only)</SizableText>}
                {item.path === (entryPoint || '/index.html') && <SizableText fontSize="$1" color="$green9" marginLeft="$1">(entry)</SizableText>}
                {item.name === '.PROMPT.md' && <SizableText fontSize="$1" color="$yellow9" marginLeft="$1">(AI prompt)</SizableText>}
              </SizableText>
            )}
            </SizableText>
          </ContextMenuTrigger>
          <ContextMenuContent>
          {/* Only show edit options for non-transient paths */}
          {!isTransient && (
            <>
              {item.type === 'directory' && (
                <>
                  <ContextMenuItem onClick={() => handleCreateFile(item.path)}>
                    <File size={16} />
                    New File
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCreateDirectory(item.path)}>
                    <Folder size={16} />
                    New Folder
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} />
                    Upload Files
                  </ContextMenuItem>
                </>
              )}
              {item.type === 'file' && onSetEntryPoint && item.path !== (entryPoint || '/index.html') && (
                <ContextMenuItem onClick={() => onSetEntryPoint(item.path)}>
                  <Home size={16} />
                  Set as Entry Point
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={() => {
                setRenamingPath(item.path);
                setNewName(item.name);
              }}>
                Rename
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleDelete(item.path, item.type)}
                color="var(--destructive)"
              >
                Delete
              </ContextMenuItem>
            </>
          )}
          {/* For transient files, just show a read-only indicator */}
          {isTransient && (
            <ContextMenuItem disabled>
              <Eye size={16} />
              Read-only {isServerContext ? 'server context' : 'skill'}
            </ContextMenuItem>
          )}
          </ContextMenuContent>
        </ContextMenu>
        {item.type === 'directory' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <YStack 
      height="100%"
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        display="none"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            await uploadFile(file, '/');
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
  />
      <XStack padding="$3" borderBottomWidth={1} backgroundColor="$color3" alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <FolderTree 
            size={16} 
            style={{ color: 'var(--brand-accent)' }} 
  />
          {onClose ? (
            <Button
              type="button"
              onClick={onClose}
              aria-label="Hide file explorer"
              position="relative" display="none" height="$5" width="$5" alignItems="center" justifyContent="center" borderRadius="$1" color="$color11" group hoverStyle={{ color: "$red9" }}
            >
              <FolderTree 
                size={16} 
                style={{ color: 'var(--brand-accent)' }} 
  />
              <X size={12} />
            </Button>
          ) : (
            <FolderTree 
              size={16} 
              style={{ color: 'var(--brand-accent)' }} 
  />
          )}
          <H3 fontSize="$3" fontWeight="500">File Explorer</H3>
        </XStack>
        <XStack gap="$1">
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={() => fileInputRef.current?.click()}
            title="Upload files"
          >
            <Upload size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={() => handleCreateFile('/')}
            title="New file"
          >
            <File size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={() => handleCreateDirectory('/')}
            title="New folder"
          >
            <Folder size={12} />
          </Button>
        </XStack>
      </XStack>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <YStack 
            flex={1} padding="$3" rowGap="$0.5" position="relative" overflow="scroll" {...{ backgroundColor: isDraggingOver ? "$blue9" : undefined }}
            onDragOver={(e) => {
              if (draggedItem) {
                e.preventDefault();
                e.stopPropagation();
                setDropTarget('/');
              }
            }}
            onDrop={(e) => {
              if (draggedItem) {
                handleItemDrop(e, null);
              }
            }}
          >
            {isDraggingOver && (
              <XStack position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center" justifyContent="center" pointerEvents="none">
                <YStack backgroundColor="$blue9" borderWidth={2} borderStyle="dashed" borderColor="$blue9" borderRadius="$5" padding="$6">
                  <Upload size={48} color="$blue9" />
                  <Paragraph fontSize="$3" color="$blue10">Drop files here to upload</Paragraph>
                </YStack>
              </XStack>
            )}
            {fileTree.length === 0 ? (
              <XStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$6">
                <SizableText textAlign="center" rowGap="$3" display="flex" flexDirection="column">
                  <Folder size={48} color="$color11" />
                  <YStack rowGap="$1">
                    <Paragraph fontSize="$4" fontWeight="500" color="$color">No files yet</Paragraph>
                    <Paragraph fontSize="$3" color="$color11">Create your first file to get started</Paragraph>
                  </YStack>
                </SizableText>
              </XStack>
            ) : (
              <YStack>
                {fileTree.map(item => renderTreeItem(item))}
              </YStack>
            )}
          </YStack>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleCreateFile('/')}>
            <File size={16} />
            New File
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCreateDirectory('/')}>
            <Folder size={16} />
            New Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Upload Files
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            {showHidden ? 'Hide Hidden Files' : 'Show Hidden Files'}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {/* Missing .PROMPT.md notification */}
      {onAddPromptFile && !promptDismissed && files.length > 0 && !files.some(f => f.path === '/.PROMPT.md') && (
        <SizableText marginHorizontal="$2" marginBottom="$2" padding="$2" borderRadius="$3" borderWidth={1} borderColor="$yellow9" backgroundColor="$yellow9" fontSize="$1" display="flex" flexDirection="column">
          <Paragraph color="$yellow10" marginBottom="$1.5" $theme-dark={{ color: "$yellow8" }}>No .PROMPT.md found</Paragraph>
          <Paragraph color="$color11" marginBottom="$2">Add the default website prompt?</Paragraph>
          <XStack gap="$2">
            <Button
              size="sm"
              variant="outline"
              height="$5" fontSize="$1" paddingHorizontal="$2"
              onClick={onAddPromptFile}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              height="$5" fontSize="$1" paddingHorizontal="$2"
              onClick={() => {
                setPromptDismissed(true);
                localStorage.setItem(`osw-prompt-dismissed-${projectId}`, 'true');
              }}
            >
              Dismiss
            </Button>
          </XStack>
        </SizableText>
      )}
    </YStack>
  );
}
