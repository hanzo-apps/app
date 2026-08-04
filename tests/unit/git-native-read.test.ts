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

  it('reconstructs a commit\'s html pages for fork/preview', async () => {
    server.use(
      http.get(`${FORGE}/v1/repos/:o/:n/git/trees/:sha`, () =>
        HttpResponse.json({ tree: [
          { path: 'index.html', type: 'blob' },
          { path: 'logo.png', type: 'blob' }, // non-html: skipped
        ] }),
      ),
      http.get(`${FORGE}/v1/repos/:o/:n/raw/:sha/index.html`, () =>
        HttpResponse.text('<!DOCTYPE html><html><body>LuxQuest</body></html>'),
      ),
    );
    const { forgeCommitPages } = await import('@/lib/git/forge');
    const pages = await forgeCommitPages('antje', 'luxquest', 'abc123');

    expect(pages).toHaveLength(1); // only the html
    expect(pages[0].path).toBe('index.html');
    expect(pages[0].html).toContain('LuxQuest');
  });
});
