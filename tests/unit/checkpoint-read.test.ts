/**
 * Reading a revision must not restore it.
 *
 * `restoreCheckpoint` was the only way to reach a checkpoint's contents, and it
 * overwrites the working tree — so acting on an older revision meant losing the
 * current one. Forking needs the opposite: take the code somewhere new and leave
 * this session exactly as it was. These cover the read path's contract.
 */
import { checkpointManager } from '@/lib/vfs/checkpoint';

describe('readCheckpointFiles', () => {
  it('rejects an id that is not a checkpoint id, without touching storage', async () => {
    expect(await checkpointManager.readCheckpointFiles('' as string)).toBeNull();
    expect(await checkpointManager.readCheckpointFiles('not-a-checkpoint')).toBeNull();
    // A restore id must start with `cp_`; anything else is a caller bug, and
    // answering null is what keeps it from becoming a wrong fork.
    expect(await checkpointManager.readCheckpointFiles('sha-abc123')).toBeNull();
  });

  it('answers null for a checkpoint that does not exist', async () => {
    expect(await checkpointManager.readCheckpointFiles('cp_definitely_absent')).toBeNull();
  });

  it('is a distinct method from restoreCheckpoint', () => {
    // The whole point: two intents, two methods. If these ever collapse into
    // one, forking silently starts destroying the session it forked from.
    expect(typeof checkpointManager.readCheckpointFiles).toBe('function');
    expect(typeof checkpointManager.restoreCheckpoint).toBe('function');
    expect(checkpointManager.readCheckpointFiles).not.toBe(checkpointManager.restoreCheckpoint);
  });
});
