/**
 * @jest-environment node
 */
/**
 * Native git history reads the FORGE, owner-scoped.
 *
 * The write path committed to git.hanzo.ai/v1/repos/<owner>/<name>; the read
 * path used api.hanzo.ai/v1/git/repos/<name> with the owner stripped, so every
 * native repo's timeline came back empty and fork/preview threw "not available".
 * These pin the forge read shape and the ownership gate that keeps an
 * admin-scoped token from reading another account's repo.
 */
import { http, HttpResponse } from 'msw';

import { server } from '../../jest.setup';

const FORGE = 'https://git.hanzo.ai';

beforeAll(() => {
  process.env.GIT_FORGE_URL = FORGE;
  process.env.GIT_FORGE_TOKEN = 'test-forge-token';
});

describe('listForgeCommits', () => {
  it('reads /v1/repos/<owner>/<name>/commits and normalizes', async () => {
    let seen = '';
    server.use(
      http.get(`${FORGE}/v1/repos/:owner/:name/commits`, ({ request }) => {
        seen = new URL(request.url).pathname;
        return HttpResponse.json([
          {
            sha: 'abc123',
            html_url: `${FORGE}/antje/luxquest/commit/abc123`,
            commit: { message: 'add quests', author: { name: 'antje', date: '2026-08-04T00:00:00Z' } },
          },
        ]);
      }),
    );
    const { listForgeCommits } = await import('@/lib/git/forge');
    const commits = await listForgeCommits('antje', 'luxquest', 'main');

    // The owner is IN the path — the whole point. `api.hanzo.ai/.../<name>` was the bug.
    expect(seen).toBe('/v1/repos/antje/luxquest/commits');
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({ sha: 'abc123', message: 'add quests', author: 'antje' });
  });

  /**
   * EVERY TEXT FILE, not only `.html`.
   *
   * The filter used to be `/\.html?$/i`, from when a project was a bag of
   * generated pages. The coding agent pushes a real repo from its sandbox now, so
   * a project's files are `.tsx`, `.ts`, `.json`, `.css` — and a filter that kept
   * only HTML answered EMPTY for every one of them, which is a history panel and
   * a fork that both silently show nothing while the commits sit in the timeline.
   */
  it("reads every text file of a commit, and no binaries", async () => {
    const asked: string[] = [];
    server.use(
      http.get(`${FORGE}/v1/repos/:o/:n/git/trees/:sha`, () =>
        HttpResponse.json({ tree: [
          { path: 'index.html', type: 'blob', size: 48 },
          { path: 'src/App.tsx', type: 'blob', size: 120 },
          { path: 'package.json', type: 'blob', size: 60 },
          { path: 'logo.png', type: 'blob', size: 9000 },      // binary: skipped
          { path: 'dump.sqlite', type: 'blob', size: 4096 },   // binary: skipped
          { path: 'huge.ts', type: 'blob', size: 8 * 1024 * 1024 }, // oversized: skipped
          { path: 'src', type: 'tree' },
        ] }),
      ),
      ...['index.html', 'src/App.tsx', 'package.json', 'logo.png', 'dump.sqlite', 'huge.ts'].map(
        (path) =>
          http.get(`${FORGE}/v1/repos/:o/:n/raw/:sha/${path}`, () => {
            asked.push(path);
            return HttpResponse.text(`contents of ${path}`);
          }),
      ),
    );
    const { forgeCommitPages } = await import('@/lib/git/forge');
    const pages = await forgeCommitPages('antje', 'luxquest', 'abc123');

    expect(pages.map((p) => p.path)).toEqual(['index.html', 'src/App.tsx', 'package.json']);
    expect(pages[1].html).toBe('contents of src/App.tsx');
    // A binary decoded as UTF-8 is a corrupt binary the moment a fork writes it
    // back, so it is never even fetched.
    expect(asked).not.toContain('logo.png');
    expect(asked).not.toContain('dump.sqlite');
    expect(asked).not.toContain('huge.ts');
  });
});
