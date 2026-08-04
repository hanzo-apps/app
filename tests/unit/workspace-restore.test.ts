/**
 * Reloading the builder must not lose the work.
 *
 * A project with no server record had nowhere to come back from, so a reload
 * produced an empty editor — which the replayed seed prompt then filled by
 * regenerating the whole site. This is the working copy that closes the window
 * before a project record or a repo exists.
 */
import { saveWorkspace, loadWorkspace, clearWorkspace } from '@/lib/dev/workspace';
import type { Page } from '@/types';

const pages: Page[] = [
  { path: 'index.html', html: '<!DOCTYPE html><html><body><h1>LuxQuest</h1></body></html>' },
  { path: 'quests.html', html: '<!DOCTYPE html><html><body><h1>Quests</h1></body></html>' },
];

beforeEach(() => window.localStorage.clear());

describe('workspace working copy', () => {
  it('restores what was saved', () => {
    saveWorkspace('luxquest', pages, ['build luxquest']);
    const back = loadWorkspace('luxquest');
    expect(back?.pages).toHaveLength(2);
    expect(back?.pages[0].html).toContain('LuxQuest');
    expect(back?.prompts).toEqual(['build luxquest']);
  });

  it('keeps projects apart', () => {
    saveWorkspace('a', pages, []);
    expect(loadWorkspace('b')).toBeNull();
  });

  it('is case-insensitive about the project key', () => {
    saveWorkspace('LuxQuest', pages, []);
    expect(loadWorkspace('luxquest')?.pages).toHaveLength(2);
  });

  it('answers null rather than guessing at an unknown shape', () => {
    // Half-reading a snapshot would restore a project into a state it was never
    // in — worse than starting empty.
    window.localStorage.setItem('hanzo.dev.workspace:x', JSON.stringify({ v: 999, pages }));
    expect(loadWorkspace('x')).toBeNull();
    window.localStorage.setItem('hanzo.dev.workspace:y', 'not json');
    expect(loadWorkspace('y')).toBeNull();
  });

  it('never saves an empty project over a real one', () => {
    saveWorkspace('z', pages, []);
    saveWorkspace('z', [], []);
    expect(loadWorkspace('z')?.pages).toHaveLength(2);
  });

  it('clears on demand', () => {
    saveWorkspace('z', pages, []);
    clearWorkspace('z');
    expect(loadWorkspace('z')).toBeNull();
  });

  it('does not throw when storage refuses', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveWorkspace('q', pages, [])).not.toThrow();
    spy.mockRestore();
  });
});

describe('projectRepoName — a repo name that cannot collide', () => {
  const { projectRepoName } = jest.requireActual('@/lib/dev/workspace');

  it('uses the project slug when the project is saved', () => {
    expect(projectRepoName('luxquest')).toBe('luxquest');
  });

  it('mints ONE id for an unsaved project and reuses it', () => {
    const a = projectRepoName(undefined);
    const b = projectRepoName(undefined);
    expect(a).toMatch(/^site-[a-z0-9]+$/);
    expect(b).toBe(a); // never re-minted — a new name orphans every commit
  });

  it('never returns a shared constant', () => {
    // THE BUG: "untitled-site" for every user's first project meant unrelated
    // projects shared one repo and overwrote each other's history.
    expect(projectRepoName(undefined)).not.toBe('untitled-site');
  });

  it('returns nothing rather than a shared name when storage is blocked', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    // Losing this session's history beats writing it over another project's repo.
    expect(projectRepoName(undefined)).toBe('');
    spy.mockRestore();
  });
});
