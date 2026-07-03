/**
 * Tests for Virtual File System
 */

import { VirtualFileSystem } from '../index';
import { vfsShell } from '../cli-shell';

describe('VirtualFileSystem', () => {
  let vfs: VirtualFileSystem;
  let projectId: string;

  beforeEach(async () => {
    vfs = new VirtualFileSystem();
    await vfs.init();
    const project = await vfs.createProject('Test Project', 'Test description');
    projectId = project.id;
  });

  afterEach(async () => {
    if (projectId) {
      try {
        await vfs.deleteProject(projectId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('File Operations', () => {
    it('should create and read a file', async () => {
      const content = 'Hello, world!';
      await vfs.createFile(projectId, '/test.txt', content);

      const file = await vfs.readFile(projectId, '/test.txt');
      expect(file.content).toBe(content);
      expect(file.path).toBe('/test.txt');
    });

    it('should update a file', async () => {
      await vfs.createFile(projectId, '/test.txt', 'Original content');

      const newContent = 'Updated content';
      await vfs.updateFile(projectId, '/test.txt', newContent);

      const file = await vfs.readFile(projectId, '/test.txt');
      expect(file.content).toBe(newContent);
    });

    it('should delete a file', async () => {
      await vfs.createFile(projectId, '/test.txt', 'Content');
      await vfs.deleteFile(projectId, '/test.txt');

      await expect(vfs.readFile(projectId, '/test.txt')).rejects.toThrow('File not found');
    });

    it('should check if file exists', async () => {
      expect(await vfs.fileExists(projectId, '/test.txt')).toBe(false);

      await vfs.createFile(projectId, '/test.txt', 'Content');
      expect(await vfs.fileExists(projectId, '/test.txt')).toBe(true);
    });
  });

  describe('Directory Operations', () => {
    it('should create and list directory', async () => {
      await vfs.createDirectory(projectId, '/test-dir');
      await vfs.createFile(projectId, '/test-dir/file1.txt', 'File 1');
      await vfs.createFile(projectId, '/test-dir/file2.txt', 'File 2');

      const files = await vfs.listDirectory(projectId, '/test-dir');
      expect(files).toHaveLength(2);
      expect(files.map(f => f.path)).toContain('/test-dir/file1.txt');
      expect(files.map(f => f.path)).toContain('/test-dir/file2.txt');
    });

    it('should delete directory and its contents', async () => {
      await vfs.createDirectory(projectId, '/test-dir');
      await vfs.createFile(projectId, '/test-dir/file1.txt', 'File 1');
      await vfs.createFile(projectId, '/test-dir/file2.txt', 'File 2');

      await vfs.deleteDirectory(projectId, '/test-dir');

      const files = await vfs.listDirectory(projectId, '/test-dir');
      expect(files).toHaveLength(0);
    });
  });

  describe('Shell Operations', () => {
    it('should execute ls command', async () => {
      await vfs.createFile(projectId, '/file1.txt', 'Content 1');
      await vfs.createFile(projectId, '/file2.txt', 'Content 2');

      const result = await vfsShell.execute(projectId, ['ls', '/']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('/file1.txt');
      expect(result.stdout).toContain('/file2.txt');
    });

    it('should execute cat command', async () => {
      const content = 'Test content';
      await vfs.createFile(projectId, '/test.txt', content);

      const result = await vfsShell.execute(projectId, ['cat', '/test.txt']);
      expect(result.success).toBe(true);
      expect(result.stdout).toBe(content);
    });

    it('should execute mkdir command', async () => {
      const result = await vfsShell.execute(projectId, ['mkdir', '/new-dir']);
      expect(result.success).toBe(true);

      // Verify directory was created
      const entries = await vfs.getAllFilesAndDirectories(projectId);
      const hasDir = entries.some((e: any) => e.path === '/new-dir' && e.type === 'directory');
      expect(hasDir).toBe(true);
    });

    it('should execute grep command', async () => {
      await vfs.createFile(projectId, '/test.txt', 'Line 1: Hello\nLine 2: World\nLine 3: Hello again');

      const result = await vfsShell.execute(projectId, ['grep', 'Hello', '/test.txt']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello');
      expect(result.stdout).toContain('Hello again');
    });

    it('should execute rm command', async () => {
      await vfs.createFile(projectId, '/test.txt', 'Content');

      const result = await vfsShell.execute(projectId, ['rm', '/test.txt']);
      expect(result.success).toBe(true);

      // Verify file was deleted
      expect(await vfs.fileExists(projectId, '/test.txt')).toBe(false);
    });

    it('should execute mv command', async () => {
      await vfs.createFile(projectId, '/old.txt', 'Content');

      const result = await vfsShell.execute(projectId, ['mv', '/old.txt', '/new.txt']);
      expect(result.success).toBe(true);

      // Verify file was moved
      expect(await vfs.fileExists(projectId, '/old.txt')).toBe(false);
      expect(await vfs.fileExists(projectId, '/new.txt')).toBe(true);
    });

    it('should execute cp command', async () => {
      const content = 'Original content';
      await vfs.createFile(projectId, '/source.txt', content);

      const result = await vfsShell.execute(projectId, ['cp', '/source.txt', '/dest.txt']);
      expect(result.success).toBe(true);

      // Verify file was copied
      const sourceFile = await vfs.readFile(projectId, '/source.txt');
      const destFile = await vfs.readFile(projectId, '/dest.txt');
      expect(sourceFile.content).toBe(content);
      expect(destFile.content).toBe(content);
    });
  });

  describe('Project Operations', () => {
    it('should create and get project', async () => {
      const project = await vfs.getProject(projectId);
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test description');
    });

    it('should list projects', async () => {
      const projects = await vfs.listProjects();
      expect(projects.length).toBeGreaterThan(0);
      expect(projects.some(p => p.id === projectId)).toBe(true);
    });

    it('should duplicate project', async () => {
      await vfs.createFile(projectId, '/test.txt', 'Content');

      const duplicated = await vfs.duplicateProject(projectId);
      expect(duplicated.id).not.toBe(projectId);
      expect(duplicated.name).toContain('(Copy)');

      const files = await vfs.listDirectory(duplicated.id, '/');
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('/test.txt');

      // Cleanup
      await vfs.deleteProject(duplicated.id);
    });
  });
});
