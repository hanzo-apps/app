/**
 * Hanzo Edit — the fork→edit→PR orchestration + pure helpers.
 *
 * Drives `runEdit` against a MOCK `GitProvider` and a mocked model gateway
 * (global.fetch) to assert the whole vertical WITHOUT touching a real forge:
 *   - write access  → branch+commit+PR directly on the repo (no fork).
 *   - no write access → fork → syncBase → branch+commit on the fork → PR into
 *     the upstream base with a cross-repo `owner:branch` head.
 *   - a no-op rewrite is refused (never opens an empty PR).
 * Plus `parseTarget`, `editBranchName`, and the CORS allowlist. Node env.
 */
import { runEdit, parseTarget, editBranchName } from '@/lib/edit/flow';
import { isAllowedOrigin } from '@/lib/edit/cors';
import type { FileContent, GitProvider, RepoRef } from '@/lib/edit/provider';

/** A GitProvider double that records every call and returns canned results. */
function mockProvider(opts: { canWrite: boolean; file?: FileContent }): {
  gp: GitProvider;
  calls: Record<string, unknown[][]>;
} {
  const calls: Record<string, unknown[][]> = {
    whoami: [], getFile: [], hasWriteAccess: [], fork: [], syncBase: [],
    createBranch: [], commitFile: [], openPR: [], openIssue: [],
  };
  const rec = (k: string, ...a: unknown[]) => calls[k].push(a);
  const file = opts.file ?? { content: 'OLD', sha: 'blobsha', exists: true };
  const gp: GitProvider = {
    name: 'github',
    async whoami() { rec('whoami'); return 'bob'; },
    async getFile(r, p, ref) { rec('getFile', r, p, ref); return file; },
    async hasWriteAccess(r) { rec('hasWriteAccess', r); return opts.canWrite; },
    async fork(r) { rec('fork', r); return { owner: 'bob', repo: r.repo }; },
    async syncBase(r, b) { rec('syncBase', r, b); },
    async createBranch(r, from, nb) { rec('createBranch', r, from, nb); },
    async commitFile(r, br, p, c, m, sha) { rec('commitFile', r, br, p, c, m, sha); return { commitSha: 'c1' }; },
    async openPR(r, base, head, t, body) { rec('openPR', r, base, head, t, body); return { prUrl: 'https://github.com/up/site/pull/1', number: 1 }; },
    async openIssue(r, t, b) { rec('openIssue', r, t, b); return { issueUrl: 'https://github.com/up/site/issues/1', number: 1 }; },
  };
  return { gp, calls };
}

/** Mock the model gateway (agent.rewriteFile → POST /chat/completions). */
function mockGateway(content: string) {
  return jest.spyOn(global, 'fetch').mockImplementation(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

const REPO: RepoRef = { owner: 'up', repo: 'site' };
const baseInput = {
  target: { repo: REPO, path: 'docs/intro.md', branch: 'main', provider: 'github' as const },
  instruction: 'fix the typo in the intro',
  agentToken: 'iam-bearer',
  actorLabel: 'admin @z',
};

afterEach(() => jest.restoreAllMocks());

describe('runEdit — direct write access', () => {
  it('branches, commits, and opens a PR on the repo (no fork)', async () => {
    const gw = mockGateway('NEW CONTENT');
    const { gp, calls } = mockProvider({ canWrite: true });

    const out = await runEdit(gp, baseInput);

    expect(gw).toHaveBeenCalled(); // the agent run happened (debits the caller)
    expect(calls.getFile[0]).toEqual([REPO, 'docs/intro.md', 'main']);
    expect(calls.hasWriteAccess.length).toBe(1);
    expect(calls.fork.length).toBe(0);
    expect(calls.syncBase.length).toBe(0);

    // committed the rewritten content, against the read blob sha, on an edit branch
    const [wRepo, wBranch, wPath, wContent, , wSha] = calls.commitFile[0];
    expect(wRepo).toEqual(REPO);
    expect(String(wBranch)).toMatch(/^hanzo-edit\//);
    expect(wPath).toBe('docs/intro.md');
    expect(wContent).toBe('NEW CONTENT');
    expect(wSha).toBe('blobsha');

    // PR on the upstream repo, same-repo head (no `owner:` prefix), base = declared branch
    const [prRepo, prBase, prHead] = calls.openPR[0];
    expect(prRepo).toEqual(REPO);
    expect(prBase).toBe('main');
    expect(String(prHead)).not.toContain(':');
    expect(out).toMatchObject({ prUrl: expect.stringContaining('/pull/1'), forked: false });
  });
});

describe('runEdit — no write access (fork path)', () => {
  it('forks, syncs, commits on the fork, and opens a cross-repo PR', async () => {
    mockGateway('NEW CONTENT');
    const { gp, calls } = mockProvider({ canWrite: false });

    const out = await runEdit(gp, baseInput);

    expect(calls.fork[0]).toEqual([REPO]);
    expect(calls.syncBase.length).toBe(1); // stale-fork guard ran
    // committed to the FORK, not upstream
    const [wRepo] = calls.commitFile[0];
    expect(wRepo).toEqual({ owner: 'bob', repo: 'site' });
    // PR is opened on the UPSTREAM with a cross-repo head `bob:hanzo-edit/...`
    const [prRepo, prBase, prHead] = calls.openPR[0];
    expect(prRepo).toEqual(REPO);
    expect(prBase).toBe('main');
    expect(String(prHead)).toMatch(/^bob:hanzo-edit\//);
    expect(out.forked).toBe(true);
  });
});

describe('runEdit — no-op guard', () => {
  it('refuses to open a PR when the rewrite equals the original', async () => {
    mockGateway('OLD'); // identical to the mock file content
    const { gp, calls } = mockProvider({ canWrite: true, file: { content: 'OLD', sha: 's', exists: true } });
    await expect(runEdit(gp, baseInput)).rejects.toMatchObject({ status: 422, code: 'no_change' });
    expect(calls.openPR.length).toBe(0);
  });
});

describe('parseTarget', () => {
  it('accepts owner/repo + path and defaults branch/provider', () => {
    const t = parseTarget({ repo: 'hanzoai/app', path: 'app/page.tsx' });
    expect(t).toEqual({ repo: { owner: 'hanzoai', repo: 'app' }, path: 'app/page.tsx', branch: 'main', provider: 'github' });
  });
  it('rejects a missing repo and a missing path', () => {
    expect('error' in parseTarget({ path: 'x' })).toBe(true);
    expect('error' in parseTarget({ repo: 'hanzoai/app' })).toBe(true);
  });
  it('rejects a traversal path', () => {
    expect('error' in parseTarget({ repo: 'a/b', path: '../etc/passwd' })).toBe(true);
  });
});

describe('editBranchName', () => {
  it('is namespaced + unique', () => {
    const a = editBranchName('Fix the Nav');
    const b = editBranchName('Fix the Nav');
    expect(a).toMatch(/^hanzo-edit\/fix-the-nav-[0-9a-f]{8}$/);
    expect(a).not.toBe(b);
  });
});

describe('CORS allowlist', () => {
  it('reflects Hanzo-family origins only', () => {
    expect(isAllowedOrigin('https://hanzo.app')).toBe(true);
    expect(isAllowedOrigin('https://docs.hanzo.ai')).toBe(true);
    expect(isAllowedOrigin('https://zoo.ngo')).toBe(true);
    expect(isAllowedOrigin('https://evil.com')).toBe(false);
    expect(isAllowedOrigin('https://nothanzo.ai.evil.com')).toBe(false);
    expect(isAllowedOrigin(null)).toBe(false);
  });
});
