/**
 * Git commit-LOG reader (lib/git/log) — the READ counterpart to lib/git/sync.
 *
 * PURE (token in, normalized commits out) so we drive the real code with a routed
 * `fetch` mock and assert the normalized `GitCommit[]` shape + the exact provider
 * endpoints: GitHub `…/commits?sha={branch}` (list) and `…/commits/{sha}` (detail
 * with files + patch); GitLab `…/repository/commits?ref_name=` (list) and
 * `…/commits/{sha}` + `/diff` (detail). Hanzo degrades to `code:'unsupported'`
 * when its commit-log endpoint isn't exposed — an honest empty timeline.
 */
import { GitSyncError } from '@/lib/git/sync';
import { getCommit, listCommits, subjectOf } from '@/lib/git/log';

type Route = {
  method: string;
  match: (url: string) => boolean;
  res: () => unknown;
  status?: number;
};

function mkFetch(routes: Route[]) {
  const calls: { method: string; url: string }[] = [];
  const fn = jest.fn(async (url: string, init?: RequestInit) => {
    const method = (init?.method || 'GET').toUpperCase();
    calls.push({ method, url });
    const r = routes.find((x) => x.method === method && x.match(url));
    if (!r) throw new Error(`unrouted ${method} ${url}`);
    const status = r.status ?? 200;
    const payload = r.res();
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    } as unknown as Response;
  });
  // @ts-expect-error test shim
  global.fetch = fn;
  return { calls };
}

afterEach(() => jest.restoreAllMocks());

describe('subjectOf', () => {
  it('takes the first non-empty line, trimmed', () => {
    expect(subjectOf('  add header\n\nbody text')).toBe('add header');
    expect(subjectOf('')).toBe('');
  });
});

describe('listCommits — GitHub', () => {
  it('hits …/commits?sha={branch} and normalizes each commit', async () => {
    const { calls } = mkFetch([
      {
        method: 'GET',
        match: (u) => /\/repos\/octo\/site\/commits\?sha=main/.test(u),
        res: () => [
          {
            sha: 'abcdef1234567890',
            html_url: 'https://github.com/octo/site/commit/abcdef1',
            commit: {
              message: 'Add dark navy header\n\nlong body',
              author: { name: 'Ada', date: '2026-07-18T10:00:00Z' },
            },
            author: { login: 'ada' },
          },
        ],
      },
    ]);

    const commits = await listCommits('github', 'gho_tok', 'https://github.com/octo/site.git', 'main');

    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({
      sha: 'abcdef1234567890',
      shortSha: 'abcdef1',
      message: 'Add dark navy header',
      rawMessage: 'Add dark navy header\n\nlong body',
      author: 'Ada',
      authoredAt: '2026-07-18T10:00:00Z',
      url: 'https://github.com/octo/site/commit/abcdef1',
    });
    expect(calls[0].url).toContain('per_page=50');
  });
});

describe('getCommit — GitHub detail carries filesChanged + patch', () => {
  it('normalizes files[] status → added/modified/removed/renamed with patch', async () => {
    mkFetch([
      {
        method: 'GET',
        match: (u) => /\/repos\/octo\/site\/commits\/deadbeef$/.test(u),
        res: () => ({
          sha: 'deadbeef',
          html_url: 'https://github.com/octo/site/commit/deadbeef',
          commit: { message: 'edit', author: { name: 'Ada', date: '2026-07-18T10:00:00Z' } },
          files: [
            { filename: 'index.html', status: 'modified', patch: '@@ -1 +1 @@\n-<h1>a</h1>\n+<h1>b</h1>' },
            { filename: 'about.html', status: 'added' },
            { filename: 'old.html', status: 'removed' },
          ],
        }),
      },
    ]);

    const commit = await getCommit('github', 'gho_tok', 'octo/site', 'deadbeef');
    expect(commit.filesChanged).toEqual([
      { path: 'index.html', status: 'modified', patch: '@@ -1 +1 @@\n-<h1>a</h1>\n+<h1>b</h1>' },
      { path: 'about.html', status: 'added', patch: undefined },
      { path: 'old.html', status: 'removed', patch: undefined },
    ]);
  });
});

describe('listCommits — GitLab', () => {
  it('hits …/repository/commits?ref_name={branch} and normalizes', async () => {
    const { calls } = mkFetch([
      {
        method: 'GET',
        match: (u) => /\/projects\/grp%2Fsite\/repository\/commits\?ref_name=main/.test(u),
        res: () => [
          {
            id: 'fed00012345',
            short_id: 'fed0001',
            title: 'Fix mobile nav',
            message: 'Fix mobile nav\n\ndetails',
            author_name: 'Lin',
            authored_date: '2026-07-17T09:00:00Z',
            web_url: 'https://gitlab.com/grp/site/-/commit/fed0001',
          },
        ],
      },
    ]);

    const commits = await listCommits('gitlab', 'glpat', 'https://gitlab.com/grp/site', 'main');
    expect(commits[0]).toMatchObject({
      sha: 'fed00012345',
      shortSha: 'fed0001',
      message: 'Fix mobile nav',
      author: 'Lin',
      authoredAt: '2026-07-17T09:00:00Z',
      url: 'https://gitlab.com/grp/site/-/commit/fed0001',
    });
    expect(calls[0].url).toContain('per_page=50');
  });
});

describe('getCommit — GitLab detail merges /diff into filesChanged', () => {
  it('maps new_file/deleted_file/renamed_file flags to status + carries diff', async () => {
    mkFetch([
      {
        method: 'GET',
        match: (u) => /\/repository\/commits\/fed0001$/.test(u),
        res: () => ({ id: 'fed0001', short_id: 'fed0001', title: 'edit', message: 'edit', author_name: 'Lin', authored_date: '', web_url: '' }),
      },
      {
        method: 'GET',
        match: (u) => /\/repository\/commits\/fed0001\/diff$/.test(u),
        res: () => [
          { old_path: 'index.html', new_path: 'index.html', diff: '@@ -1 +1 @@\n-a\n+b' },
          { old_path: 'x', new_path: 'new.html', new_file: true },
          { old_path: 'gone.html', new_path: 'gone.html', deleted_file: true },
        ],
      },
    ]);

    const commit = await getCommit('gitlab', 'glpat', 'grp/site', 'fed0001');
    expect(commit.filesChanged).toEqual([
      { path: 'index.html', status: 'modified', patch: '@@ -1 +1 @@\n-a\n+b' },
      { path: 'new.html', status: 'added', patch: undefined },
      { path: 'gone.html', status: 'removed', patch: undefined },
    ]);
  });
});

describe('listCommits — Hanzo degrades honestly', () => {
  it('throws code:"unsupported" when the commit-log endpoint 404s', async () => {
    mkFetch([
      { method: 'GET', match: (u) => /\/repos\/site\/commits/.test(u), res: () => 'not found', status: 404 },
    ]);
    await expect(
      listCommits('hanzo', 'iam_bearer', 'https://api.hanzo.ai/site.git', 'main'),
    ).rejects.toMatchObject({ code: 'unsupported' });
    await expect(
      listCommits('hanzo', 'iam_bearer', 'site', 'main'),
    ).rejects.toBeInstanceOf(GitSyncError);
  });

  it('normalizes a Gitea-compatible payload when the backend answers', async () => {
    mkFetch([
      {
        method: 'GET',
        match: (u) => /\/repos\/site\/commits/.test(u),
        res: () => [
          {
            sha: 'aaa111bbb222',
            html_url: 'https://git.hanzo.ai/z/site/commit/aaa111b',
            commit: { message: 'seed', author: { name: 'Z', date: '2026-07-18T00:00:00Z' } },
          },
        ],
      },
    ]);
    const commits = await listCommits('hanzo', 'iam_bearer', 'site', 'main');
    expect(commits[0]).toMatchObject({ sha: 'aaa111bbb222', shortSha: 'aaa111b', message: 'seed', author: 'Z' });
  });
});
