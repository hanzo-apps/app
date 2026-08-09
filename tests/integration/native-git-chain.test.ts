/**
 * @jest-environment node
 */
/**
 * FULL NATIVE-GIT CHAIN, against a local mock cloud.
 *
 * This is the "local cloud as backend" acceptance test: a real minted IAM
 * session, a mock forge (git.hanzo.ai) and a mock cloud (projects PATCH +
 * entitlements), driving the ACTUAL route handlers end to end — not a unit of
 * one function. It proves the whole loop the user asked for works together:
 *
 *   build → POST /v1/git/native  → repo created + one commit, linked to project
 *   history → GET /v1/git/commits?provider=hanzo → the commit LISTS (D4)
 *   fork    → GET …&sha&pages=1   → the commit's pages come back (fork/preview)
 *   publish → POST /v1/git/sync (provider hanzo) → lands in the SAME repo
 *
 * If any wiring drifts — the read hitting the wrong backend, the owner being
 * dropped, the link not recorded — this fails. The unit tests pin each piece;
 * this pins that they compose.
 *
 * The mock forge is a tiny in-memory git: create-repo, contents (commit),
 * commits list, tree, raw. It is the smallest thing that can be a truthful
 * backend for the chain, so the test is hermetic and needs no cluster.
 */
import { http, HttpResponse } from 'msw';
import { NextRequest } from 'next/server';
import { clearJwksCache } from '@hanzo/iam/auth';

import { server } from '../../jest.setup';
import { IAM, CLIENT_ID, iamHandlers, mint } from '../iam-fixture';

const FORGE = 'https://git.test';
const CLOUD = 'https://cloud.test';
const HOST = 'hanzo.app';

// --- the local mock forge: an in-memory git for one user ---------------------

type Commit = { sha: string; message: string; files: Record<string, string> };
const repos = new Map<string, { branch: string; commits: Commit[] }>();

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const unb64 = (s: string) => Buffer.from(s, 'base64').toString('utf8');
const key = (o: string, n: string) => `${o}/${n}`;

function mockForge() {
  return [
    // repo exists?
    http.get(`${FORGE}/v1/repos/:owner/:name`, ({ params }) => {
      const r = repos.get(key(params.owner as string, params.name as string));
      if (!r) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json({
        full_name: key(params.owner as string, params.name as string),
        html_url: `${FORGE}/${params.owner}/${params.name}`,
        default_branch: r.branch,
      });
    }),
    // admin create-on-behalf
    http.post(`${FORGE}/v1/admin/users/:owner/repos`, async ({ params, request }) => {
      const body = (await request.json()) as { name: string; default_branch?: string };
      const k = key(params.owner as string, body.name);
      repos.set(k, { branch: body.default_branch || 'main', commits: [] });
      return HttpResponse.json({
        full_name: k,
        html_url: `${FORGE}/${params.owner}/${body.name}`,
        default_branch: body.default_branch || 'main',
      }, { status: 201 });
    }),
    // current tree (for create-vs-update)
    http.get(`${FORGE}/v1/repos/:owner/:name/git/trees/:ref`, ({ params }) => {
      const r = repos.get(key(params.owner as string, params.name as string));
      const last = r?.commits.at(-1);
      const tree = Object.keys(last?.files ?? {}).map((path) => ({ path, type: 'blob' }));
      return HttpResponse.json({ tree });
    }),
    // commit files
    http.post(`${FORGE}/v1/repos/:owner/:name/contents`, async ({ params, request }) => {
      const body = (await request.json()) as {
        message: string;
        files: { operation: string; path: string; content: string }[];
      };
      const r = repos.get(key(params.owner as string, params.name as string));
      if (!r) return new HttpResponse(null, { status: 404 });
      const prev = r.commits.at(-1)?.files ?? {};
      const files = { ...prev };
      for (const f of body.files) files[f.path] = unb64(f.content);
      const sha = `sha${r.commits.length + 1}`;
      r.commits.push({ sha, message: body.message, files });
      return HttpResponse.json({ commit: { sha } }, { status: 201 });
    }),
    // commit list (newest first)
    http.get(`${FORGE}/v1/repos/:owner/:name/commits`, ({ params }) => {
      const r = repos.get(key(params.owner as string, params.name as string));
      const list = [...(r?.commits ?? [])].reverse().map((c) => ({
        sha: c.sha,
        html_url: `${FORGE}/${params.owner}/${params.name}/commit/${c.sha}`,
        commit: { message: c.message, author: { name: 'antje', date: '2026-08-04T00:00:00Z' } },
      }));
      return HttpResponse.json(list);
    }),
    // raw file at a sha (for fork/preview page reconstruction). Flat paths in the
    // test, so one :file segment matches without wildcard-capture ambiguity.
    http.get(`${FORGE}/v1/repos/:owner/:name/raw/:sha/:file`, ({ params }) => {
      const r = repos.get(key(params.owner as string, params.name as string));
      const c = r?.commits.find((x) => x.sha === params.sha);
      const content = c?.files[params.file as string];
      if (content == null) return new HttpResponse(null, { status: 404 });
      return HttpResponse.text(content);
    }),
    // cloud: record the repo link (the route's PATCH is proven by the unit tests;
    // here it just needs to succeed so the chain continues)
    http.patch(`${CLOUD}/v1/projects/:slug`, () => HttpResponse.json({ ok: true })),
    // cloud: the project record /v1/git/sync reads before it pushes
    http.get(`${CLOUD}/v1/projects/:slug`, ({ params }) =>
      HttpResponse.json({ slug: params.slug, repo: {} }),
    ),
    // cloud: no plan (so attribution stays)
    http.get(`${CLOUD}/v1/entitlements`, () => HttpResponse.json({ tier: '' })),
  ];
}

const withAuth = (url: string, method: string, token: string, body?: unknown) =>
  new NextRequest(`https://${HOST}${url}`, {
    method,
    headers: {
      host: HOST,
      origin: `https://${HOST}`,
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) as NextRequest;

process.env.IAM_URL = IAM;
process.env.IAM_CLIENT_ID = CLIENT_ID;
process.env.GIT_FORGE_URL = FORGE;
process.env.GIT_FORGE_TOKEN = 'test-forge-token';
process.env.CLOUD_API_URL = CLOUD;

const nativeRoute = () => import('@/app/v1/git/native/route');
const commitsRoute = () => import('@/app/v1/git/commits/route');
const syncRoute = () => import('@/app/v1/git/sync/route');

beforeEach(() => {
  repos.clear();
  clearJwksCache();
});

describe('native git chain (build → history → fork), local cloud', () => {
  it('commits a build, lists it, and reconstructs its pages', async () => {
    server.use(...(await iamHandlers()), ...mockForge());
    // The forge account IS the IAM username — mint name === owner 'antje'.
    const token = await mint({ owner: 'antje', name: 'antje' });

    // BUILD turn one: two pages.
    const t1 = await (await nativeRoute()).POST(
      withAuth('/v1/git/native', 'POST', token, {
        name: 'luxquest',
        message: 'first build',
        pages: [
          { path: 'index.html', html: '<!DOCTYPE html><html><body><a href="quests.html">Q</a></body></html>' },
          { path: 'quests.html', html: '<!DOCTYPE html><html><body>Quests</body></html>' },
        ],
      }),
    );
    const r1 = await t1.json();
    expect(t1.status).toBe(200);
    expect(r1.ok).toBe(true);
    expect(r1.repo).toBe('antje/luxquest');

    // BUILD turn two: EDIT index, ADD a page — one commit, create+update mixed.
    const t2 = await (await nativeRoute()).POST(
      withAuth('/v1/git/native', 'POST', token, {
        name: 'luxquest',
        message: 'add prizes',
        pages: [
          { path: 'index.html', html: '<!DOCTYPE html><html><body>edited</body></html>' },
          { path: 'quests.html', html: '<!DOCTYPE html><html><body>Quests</body></html>' },
          { path: 'prizes.html', html: '<!DOCTYPE html><html><body>Prizes</body></html>' },
        ],
      }),
    );
    expect((await t2.json()).ok).toBe(true);

    // HISTORY (D4): the timeline lists BOTH commits, newest first.
    const h = await (await commitsRoute()).GET(
      withAuth('/v1/git/commits?provider=hanzo&repo=antje/luxquest&branch=main', 'GET', token),
    );
    const hist = await h.json();
    expect(hist.supported).toBe(true);
    expect(hist.commits).toHaveLength(2);
    expect(hist.commits[0].message).toContain('add prizes'); // newest first (+ co-author trailer)
    expect(hist.commits[1].message).toContain('first build');

    // FORK/PREVIEW: the newest commit's pages reconstruct.
    const sha = hist.commits[0].sha;
    const p = await (await commitsRoute()).GET(
      withAuth(`/v1/git/commits?provider=hanzo&repo=antje/luxquest&sha=${sha}&pages=1`, 'GET', token),
    );
    const pagesRes = await p.json();
    const paths = pagesRes.pages.map((x: { path: string }) => x.path).sort();
    expect(paths).toEqual(['index.html', 'prizes.html', 'quests.html']);
    expect(pagesRes.pages.find((x: { path: string }) => x.path === 'index.html').html).toContain('edited');
  });

  /**
   * ONE HOME. Publish used to push to `api.hanzo.ai/v1/git/<org>/<slug>` while
   * every turn committed to `git.hanzo.ai/<user>/<slug>` — same project, two
   * repos, two owners, two histories, and whichever one a person opened was
   * missing half their work. This fails the moment a second backend grows back:
   * the published commit has to land in the SAME repo, on top of the turn's.
   */
  it('publishes into the SAME repo the turns commit to', async () => {
    server.use(...(await iamHandlers()), ...mockForge());
    const token = await mint({ owner: 'antje', name: 'antje' });

    await (await nativeRoute()).POST(
      withAuth('/v1/git/native', 'POST', token, {
        name: 'luxquest',
        message: 'first build',
        pages: [{ path: 'index.html', html: '<html><body>built</body></html>' }],
      }),
    );

    const pub = await (await syncRoute()).POST(
      withAuth('/v1/git/sync', 'POST', token, {
        provider: 'hanzo',
        name: 'luxquest',
        slug: 'luxquest',
        message: 'Publish',
        pages: [{ path: 'index.html', html: '<html><body>published</body></html>' }],
      }),
    );
    const out = await pub.json();
    expect(pub.status).toBe(200);
    // The owner is the SESSION's IAM username, and the URL is the forge's — not
    // an org-scoped path on a different service.
    expect(out.htmlUrl).toBe(`${FORGE}/antje/luxquest`);
    expect(out.created).toBe(false); // the turn already made it
    expect(repos.get('antje/luxquest')!.commits).toHaveLength(2);

    // And the timeline shows both, in one history.
    const h = await (await commitsRoute()).GET(
      withAuth('/v1/git/commits?provider=hanzo&repo=antje/luxquest&branch=main', 'GET', token),
    );
    const hist = await h.json();
    expect(hist.commits.map((c: { message: string }) => c.message.split('\n')[0])).toEqual([
      'Publish',
      'first build',
    ]);
  });

  it('refuses to read another account\'s repo', async () => {
    server.use(...(await iamHandlers()), ...mockForge());
    const token = await mint({ owner: 'antje', name: 'antje' });
    // A repo URL naming a DIFFERENT owner must be rejected before any forge read.
    const h = await (await commitsRoute()).GET(
      withAuth('/v1/git/commits?provider=hanzo&repo=someoneelse/secret&branch=main', 'GET', token),
    );
    expect(h.status).toBe(403);
  });

  it('signed-out cannot commit', async () => {
    server.use(...(await iamHandlers()), ...mockForge());
    const t = await (await nativeRoute()).POST(
      new NextRequest(`https://${HOST}/v1/git/native`, {
        method: 'POST',
        headers: { host: HOST, origin: `https://${HOST}`, 'content-type': 'application/json' },
        body: JSON.stringify({ pages: [{ path: 'index.html', html: '<html></html>' }] }),
      }) as NextRequest,
    );
    expect(t.status).toBe(401);
  });
});
