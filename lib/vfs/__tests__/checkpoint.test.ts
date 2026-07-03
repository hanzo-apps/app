/**
 * Checkpoint System Tests
 *
 * Run these tests to verify the checkpoint and save management system.
 * Note: These tests require a browser environment with IndexedDB.
 */

import { checkpointManager, Checkpoint } from '../checkpoint';
import { saveManager } from '../save-manager';
import { vfs } from '../index';

describe('Checkpoint System', () => {
  let projectId: string;

  beforeEach(async () => {
    // Create a test project
    const project = await vfs.createProject('Test Project', 'Test Description');
    projectId = project.id;
  });

  afterEach(async () => {
    // Cleanup
    await checkpointManager.clearCheckpoints(projectId);
  });

  test('should create a checkpoint', async () => {
    await vfs.createFile(projectId, '/test.txt', 'Hello World');

    const checkpoint = await checkpointManager.createCheckpoint(
      projectId,
      'Test checkpoint',
      { kind: 'manual' }
    );

    expect(checkpoint).toBeDefined();
    expect(checkpoint.description).toBe('Test checkpoint');
    expect(checkpoint.kind).toBe('manual');
    expect(checkpoint.files.size).toBeGreaterThan(0);
  });

  test('should restore checkpoint', async () => {
    // Create initial file
    await vfs.createFile(projectId, '/test.txt', 'original content');

    // Create checkpoint
    const checkpoint = await checkpointManager.createCheckpoint(
      projectId,
      'Before modification'
    );

    // Modify file
    await vfs.updateFile(projectId, '/test.txt', 'modified content');

    // Restore checkpoint
    const success = await checkpointManager.restoreCheckpoint(checkpoint.id);
    expect(success).toBe(true);

    // Verify content restored
    const file = await vfs.readFile(projectId, '/test.txt');
    expect(file.content).toBe('original content');
  });

  test('should track multiple checkpoints', async () => {
    await vfs.createFile(projectId, '/test.txt', 'v1');
    const cp1 = await checkpointManager.createCheckpoint(projectId, 'Version 1');

    await vfs.updateFile(projectId, '/test.txt', 'v2');
    const cp2 = await checkpointManager.createCheckpoint(projectId, 'Version 2');

    await vfs.updateFile(projectId, '/test.txt', 'v3');
    const cp3 = await checkpointManager.createCheckpoint(projectId, 'Version 3');

    const checkpoints = await checkpointManager.getCheckpoints(projectId);
    expect(checkpoints.length).toBe(3);
  });

  test('should cleanup old auto checkpoints', async () => {
    // Create 15 auto checkpoints
    for (let i = 0; i < 15; i++) {
      await vfs.createFile(projectId, `/file${i}.txt`, `content ${i}`);
      await checkpointManager.createCheckpoint(
        projectId,
        `Auto checkpoint ${i}`,
        { kind: 'auto' }
      );
    }

    const checkpoints = await checkpointManager.getCheckpoints(projectId);
    const autoCheckpoints = checkpoints.filter(cp => cp.kind === 'auto');

    // Should keep only last 10
    expect(autoCheckpoints.length).toBeLessThanOrEqual(10);
  });

  test('should handle binary files', async () => {
    // Create a binary file (simulated with ArrayBuffer)
    const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    await vfs.createFile(projectId, '/binary.dat', buffer);

    const checkpoint = await checkpointManager.createCheckpoint(
      projectId,
      'With binary file'
    );

    // Modify file
    await vfs.updateFile(projectId, '/binary.dat', new Uint8Array([6, 7, 8]).buffer);

    // Restore
    await checkpointManager.restoreCheckpoint(checkpoint.id);

    // Verify
    const file = await vfs.readFile(projectId, '/binary.dat');
    const restoredArray = new Uint8Array(file.content as ArrayBuffer);
    expect(restoredArray).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });
});

describe('Save Manager', () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await vfs.createProject('Test Project');
    projectId = project.id;
  });

  test('should track dirty state', () => {
    saveManager.markDirty(projectId);
    expect(saveManager.isDirty(projectId)).toBe(true);

    saveManager.markClean(projectId);
    expect(saveManager.isDirty(projectId)).toBe(false);
  });

  test('should notify listeners', (done) => {
    const unsubscribe = saveManager.subscribe((event) => {
      if (event.projectId === projectId && event.dirty) {
        unsubscribe();
        done();
      }
    });

    saveManager.markDirty(projectId);
  });

  test('should save project', async () => {
    await vfs.createFile(projectId, '/test.txt', 'content');
    saveManager.markDirty(projectId);

    const checkpoint = await saveManager.save(projectId, 'Manual save');

    expect(checkpoint).toBeDefined();
    expect(checkpoint.kind).toBe('manual');
    expect(saveManager.isDirty(projectId)).toBe(false);
  });

  test('should restore last saved', async () => {
    // Create and save
    await vfs.createFile(projectId, '/test.txt', 'original');
    await saveManager.save(projectId);

    // Modify
    await vfs.updateFile(projectId, '/test.txt', 'modified');

    // Restore
    const restored = await saveManager.restoreLastSaved(projectId);
    expect(restored).toBe(true);

    // Verify
    const file = await vfs.readFile(projectId, '/test.txt');
    expect(file.content).toBe('original');
  });

  test('should suppress dirty tracking', async () => {
    let dirtyCount = 0;
    const unsubscribe = saveManager.subscribe((event) => {
      if (event.projectId === projectId && event.dirty) {
        dirtyCount++;
      }
    });

    await saveManager.runWithSuppressedDirty(projectId, async () => {
      saveManager.markDirty(projectId);
      saveManager.markDirty(projectId);
      saveManager.markDirty(projectId);
    });

    // Dirty tracking should be suppressed
    expect(dirtyCount).toBe(0);

    unsubscribe();
  });
});

describe('VFS', () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await vfs.createProject('Test Project');
    projectId = project.id;
  });

  test('should create and read file', async () => {
    await vfs.createFile(projectId, '/test.txt', 'Hello World');
    const file = await vfs.readFile(projectId, '/test.txt');

    expect(file.content).toBe('Hello World');
    expect(file.path).toBe('/test.txt');
  });

  test('should update file', async () => {
    await vfs.createFile(projectId, '/test.txt', 'original');
    await vfs.updateFile(projectId, '/test.txt', 'updated');

    const file = await vfs.readFile(projectId, '/test.txt');
    expect(file.content).toBe('updated');
  });

  test('should delete file', async () => {
    await vfs.createFile(projectId, '/test.txt', 'content');
    await vfs.deleteFile(projectId, '/test.txt');

    await expect(vfs.readFile(projectId, '/test.txt')).rejects.toThrow();
  });

  test('should list directory', async () => {
    await vfs.createFile(projectId, '/file1.txt', 'content1');
    await vfs.createFile(projectId, '/file2.txt', 'content2');
    await vfs.createFile(projectId, '/dir/file3.txt', 'content3');

    const files = await vfs.listDirectory(projectId, '/');
    expect(files.length).toBe(3);
  });
});
