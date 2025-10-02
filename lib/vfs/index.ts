/**
 * Virtual File System (VFS) for Hanzo Build
 * Complete VFS implementation with full DeepStudio features
 * Manages project files in IndexedDB with CRUD operations, shell integration, and file tree
 */

import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { VFSDatabase } from './database';
import {
  Project,
  VirtualFile,
  FileTreeNode,
  getFileTypeFromPath,
  getSpecificMimeType,
  FILE_SIZE_LIMITS,
  isFileSupported,
  PatchOperation
} from './types';

// Logger utility
export const logger = {
  info: (...args: any[]) => console.log('[VFS]', ...args),
  warn: (...args: any[]) => console.warn('[VFS]', ...args),
  error: (...args: any[]) => console.error('[VFS]', ...args),
  debug: (...args: any[]) => console.debug('[VFS]', ...args),
};

export class VirtualFileSystem {
  private db: VFSDatabase;
  private initialized = false;

  constructor() {
    this.db = new VFSDatabase();
  }

  async init(): Promise<void> {
    if (!this.initialized) {
      await this.db.init();
      this.initialized = true;
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error('VirtualFileSystem not initialized. Call init() first.');
    }
  }

  async createFile(projectId: string, path: string, content: string | ArrayBuffer): Promise<VirtualFile> {
    this.ensureInitialized();

    try {
      const cleanPath = path.replace(/\\n$|\\r$|\n$|\r$/, '').trim();
      path = cleanPath;

      const existing = await this.db.getFile(projectId, path);
      if (existing) {
        logger.error('VFS: File already exists', { projectId, path });
        throw new Error(`File already exists: ${path}`);
      }

      if (!isFileSupported(path)) {
        throw new Error(`Unsupported file type: ${path}`);
      }

      const type = getFileTypeFromPath(path);

      const size = content instanceof ArrayBuffer ? content.byteLength : new Blob([content]).size;
      const sizeLimit = FILE_SIZE_LIMITS[type];
      if (size > sizeLimit) {
        throw new Error(`File too large. Maximum size for ${type} files is ${Math.round(sizeLimit / 1024 / 1024)}MB`);
      }

      const file: VirtualFile = {
        id: uuidv4(),
        projectId,
        path,
        name: path.split('/').pop() || '',
        type,
        content,
        mimeType: getSpecificMimeType(path),
        size,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          isEntry: path === '/index.html'
        }
      };

      await this.db.createFile(file);
      await this.updateFileTree(projectId, path, 'create');

      return file;
    } catch (error) {
      throw error;
    }
  }

  async readFile(projectId: string, path: string): Promise<VirtualFile> {
    this.ensureInitialized();

    if (!projectId || typeof projectId !== 'string') {
      logger.error('VFS: Invalid projectId for readFile', { projectId, path });
      throw new Error('Invalid projectId provided');
    }

    if (!path || typeof path !== 'string') {
      logger.error('VFS: Invalid path for readFile', { projectId, path });
      throw new Error('Invalid file path provided');
    }

    const cleanPath = path.replace(/\\n$|\\r$|\n$|\r$/, '').trim();

    if (!cleanPath) {
      logger.error('VFS: Empty path after cleaning for readFile', { projectId, originalPath: path, cleanPath });
      throw new Error('Empty file path after cleaning');
    }

    const file = await this.db.getFile(projectId, cleanPath);
    if (!file) {
      logger.error('VFS: File not found for read', { projectId, path: cleanPath, originalPath: path });
      throw new Error(`File not found: ${cleanPath}`);
    }

    return file;
  }

  async fileExists(projectId: string, path: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const file = await this.db.getFile(projectId, path);
      return !!file;
    } catch {
      return false;
    }
  }

  async updateFile(projectId: string, path: string, content: string | ArrayBuffer): Promise<VirtualFile> {
    this.ensureInitialized();

    try {
      const cleanPath = path.replace(/\\n$|\\r$|\n$|\r$/, '').trim();
      if (cleanPath.includes('\n') || cleanPath.includes('@@') || cleanPath.includes('\\n') || cleanPath.length > 200) {
        logger.error('VFS: Invalid path detected', { projectId, path: path.slice(0, 100) + '...' });
        throw new Error(`Invalid file path: ${path.slice(0, 50)}...`);
      }

      path = cleanPath;

      const file = await this.db.getFile(projectId, path);
      if (!file) {
        logger.error('VFS: File not found for update', { projectId, path });
        throw new Error(`File not found: ${path}`);
      }

      file.content = content;
      file.size = content instanceof ArrayBuffer ? content.byteLength : new Blob([content]).size;
      file.updatedAt = new Date();

      await this.db.updateFile(file);

      if (typeof window !== 'undefined') {
        const detail = { projectId, path };
        window.dispatchEvent(new CustomEvent('fileContentChanged', { detail }));
      }

      return file;
    } catch (error) {
      throw error;
    }
  }

  async patchFile(projectId: string, path: string, patches: PatchOperation[]): Promise<VirtualFile> {
    this.ensureInitialized();

    const file = await this.readFile(projectId, path);
    let content = file.content as string;

    for (const patch of patches) {
      if (!content.includes(patch.search)) {
        logger.error('VFS: Pattern not found in file', {
          path,
          searchPattern: patch.search.substring(0, 100),
          contentSnippet: content.substring(0, 300)
        });
        throw new Error(`Pattern not found in file: ${patch.search.substring(0, 50)}...`);
      }
      content = content.replace(patch.search, patch.replace);
    }

    return await this.updateFile(projectId, path, content);
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.db.deleteFile(projectId, path);
      await this.updateFileTree(projectId, path, 'delete');
    } catch (error) {
      throw error;
    }
  }

  async renameFile(projectId: string, oldPath: string, newPath: string): Promise<VirtualFile> {
    this.ensureInitialized();

    const file = await this.readFile(projectId, oldPath);
    await this.deleteFile(projectId, oldPath);
    return await this.createFile(projectId, newPath, file.content as string);
  }

  async createDirectory(projectId: string, path: string): Promise<void> {
    this.ensureInitialized();

    const existing = await this.db.getTreeNode(projectId, path);
    if (existing) {
      return;
    }

    const node: FileTreeNode = {
      id: uuidv4(),
      projectId,
      path,
      type: 'directory',
      parentPath: this.getParentPath(path),
      children: []
    };

    await this.db.createTreeNode(node);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('filesChanged'));
    }
  }

  async listDirectory(projectId: string, path: string): Promise<VirtualFile[]> {
    this.ensureInitialized();

    const allFiles = await this.db.listFiles(projectId);

    if (path === '/') {
      return allFiles;
    }

    return allFiles.filter(file => {
      const filePath = file.path;
      const dirPath = path.endsWith('/') ? path : path + '/';
      return filePath.startsWith(dirPath) &&
        filePath.slice(dirPath.length).indexOf('/') === -1;
    });
  }

  async getAllFilesAndDirectories(projectId: string): Promise<Array<VirtualFile | { path: string; name: string; type: 'directory' }>> {
    this.ensureInitialized();

    const allFiles = await this.db.listFiles(projectId);
    const treeNodes = await this.db.getAllTreeNodes(projectId);

    const directories = treeNodes
      .filter(node => node.type === 'directory')
      .map(node => ({
        path: node.path,
        name: node.path.split('/').filter(Boolean).pop() || node.path,
        type: 'directory' as const
      }));

    return [...allFiles, ...directories];
  }

  async deleteDirectory(projectId: string, path: string): Promise<void> {
    this.ensureInitialized();

    const allFiles = await this.db.listFiles(projectId);
    const dirPath = path.endsWith('/') ? path : path + '/';

    for (const file of allFiles) {
      if (file.path.startsWith(dirPath)) {
        await this.deleteFile(projectId, file.path);
      }
    }

    await this.db.deleteTreeNode(projectId, path);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('filesChanged'));
    }
  }

  async renameDirectory(projectId: string, oldPath: string, newPath: string): Promise<void> {
    this.ensureInitialized();

    const oldNode = await this.db.getTreeNode(projectId, oldPath);
    if (oldNode) {
      await this.db.deleteTreeNode(projectId, oldPath);

      const newNode: FileTreeNode = {
        id: uuidv4(),
        projectId,
        path: newPath,
        type: 'directory',
        parentPath: this.getParentPath(newPath),
        children: oldNode.children
      };
      await this.db.createTreeNode(newNode);
    }

    const oldDirPath = oldPath.endsWith('/') ? oldPath : oldPath + '/';
    const newDirPath = newPath.endsWith('/') ? newPath : newPath + '/';

    const allFiles = await this.db.listFiles(projectId);
    const filesToMove = allFiles.filter(file => file.path.startsWith(oldDirPath));

    for (const file of filesToMove) {
      const relativePath = file.path.substring(oldDirPath.length);
      const newFilePath = newDirPath + relativePath;
      await this.renameFile(projectId, file.path, newFilePath);
    }

    const allTreeNodes = await this.db.getAllTreeNodes(projectId);
    const subdirNodes = allTreeNodes.filter(node =>
      node.type === 'directory' &&
      node.path.startsWith(oldDirPath) &&
      node.path !== oldPath
    );

    for (const node of subdirNodes) {
      const relativePath = node.path.substring(oldDirPath.length);
      const newSubdirPath = newDirPath + relativePath;

      await this.db.deleteTreeNode(projectId, node.path);
      const newNode: FileTreeNode = {
        id: uuidv4(),
        projectId,
        path: newSubdirPath,
        type: 'directory',
        parentPath: this.getParentPath(newSubdirPath),
        children: node.children
      };
      await this.db.createTreeNode(newNode);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('filesChanged'));
    }
  }

  async moveFile(projectId: string, oldPath: string, newPath: string): Promise<VirtualFile> {
    this.ensureInitialized();

    const existing = await this.db.getFile(projectId, newPath);
    if (existing) {
      throw new Error(`File already exists at destination: ${newPath}`);
    }

    const file = await this.readFile(projectId, oldPath);
    const movedFile = await this.createFile(projectId, newPath, file.content);
    await this.deleteFile(projectId, oldPath);

    return movedFile;
  }

  async createProject(name: string, description?: string): Promise<Project> {
    this.ensureInitialized();

    try {
      const project: Project = {
        id: uuidv4(),
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {},
        lastSavedCheckpointId: null,
        lastSavedAt: null,
        costTracking: {
          totalCost: 0,
          providerBreakdown: {},
          sessionHistory: []
        }
      };

      await this.db.createProject(project);

      const rootNode: FileTreeNode = {
        id: uuidv4(),
        projectId: project.id,
        path: '/',
        type: 'directory',
        parentPath: null,
        children: []
      };

      await this.db.createTreeNode(rootNode);

      return project;
    } catch (error) {
      throw error;
    }
  }

  async getProject(id: string): Promise<Project> {
    this.ensureInitialized();

    const project = await this.db.getProject(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return project;
  }

  async updateProject(project: Project): Promise<void> {
    this.ensureInitialized();

    project.updatedAt = new Date();
    await this.db.updateProject(project);
  }

  async deleteProject(id: string): Promise<void> {
    this.ensureInitialized();

    await this.db.deleteProject(id);
  }

  async listProjects(): Promise<Project[]> {
    this.ensureInitialized();

    return await this.db.listProjects();
  }

  async getFileTree(projectId: string): Promise<FileTreeNode | null> {
    this.ensureInitialized();

    return await this.db.getTreeNode(projectId, '/');
  }

  async exportProjectAsZip(projectId: string): Promise<Blob> {
    this.ensureInitialized();

    const zip = new JSZip();
    const files = await this.db.listFiles(projectId);

    for (const file of files) {
      const zipPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;

      if (typeof file.content === 'string') {
        zip.file(zipPath, file.content);
      } else {
        zip.file(zipPath, file.content);
      }
    }

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });

    return blob;
  }

  async importProject(data: { project: Project; files: VirtualFile[] }): Promise<Project> {
    this.ensureInitialized();

    const newProject = await this.createProject(data.project.name, data.project.description);

    for (const file of data.files) {
      try {
        await this.createFile(newProject.id, file.path, file.content);
      } catch (error) {
        logger.error('Failed to import file:', file.path, error);
      }
    }

    return newProject;
  }

  async importProjectFromZip(zipFile: File, projectName?: string): Promise<Project> {
    this.ensureInitialized();

    const zip = await JSZip.loadAsync(zipFile);
    const name = projectName || zipFile.name.replace('.zip', '');
    const newProject = await this.createProject(name);

    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const promise = (async () => {
          try {
            const content = await zipEntry.async('string');
            const path = '/' + relativePath;
            await this.createFile(newProject.id, path, content);
          } catch (error) {
            logger.error('Failed to import file from ZIP:', relativePath, error);
          }
        })();
        filePromises.push(promise);
      }
    });

    await Promise.all(filePromises);

    return newProject;
  }

  async duplicateProject(projectId: string): Promise<Project> {
    this.ensureInitialized();

    const originalProject = await this.getProject(projectId);
    const files = await this.db.listFiles(projectId);

    const newName = `${originalProject.name} (Copy)`.slice(0, 50);
    const newProject = await this.createProject(newName, originalProject.description);

    for (const file of files) {
      await this.createFile(newProject.id, file.path, file.content);
    }

    return newProject;
  }

  private getParentPath(path: string): string | null {
    if (path === '/') return null;

    const parts = path.split('/').filter(Boolean);
    if (parts.length === 1) return '/';

    parts.pop();
    return '/' + parts.join('/');
  }

  private async updateFileTree(projectId: string, path: string, operation: 'create' | 'delete'): Promise<void> {
    const parentPath = this.getParentPath(path);
    if (parentPath === null) return;

    let parentNode = await this.db.getTreeNode(projectId, parentPath);

    if (!parentNode && operation === 'create') {
      await this.createDirectory(projectId, parentPath);
      parentNode = await this.db.getTreeNode(projectId, parentPath);
    }

    if (parentNode) {
      const children = parentNode.children || [];

      if (operation === 'create' && !children.includes(path)) {
        children.push(path);
      } else if (operation === 'delete') {
        const index = children.indexOf(path);
        if (index > -1) {
          children.splice(index, 1);
        }
      }

      parentNode.children = children;
      await this.db.updateTreeNode(parentNode);
    }
  }
}

export const vfs = new VirtualFileSystem();

export * from './types';
