/**
 * @jest-environment node
 */
/**
 * IMPORT A REPOSITORY, AND KEEP ITS PAST.
 *
 * The import used to route a repository URL at the TEMPLATE loader: `/dev?repo=`
 * looked the repo's NAME up in the template catalog, found nothing, and offered
 * to recreate it from a description. Nothing was cloned, so nothing was imported
 * and no history existed to explore — for GitLab and for GitHub alike.
 *
 * It is a clone onto git.hanzo.ai now, which is where projects built here
 * already live, so an imported repo becomes an ordinary project: its commits are
 * the history panel's timeline and the next turn commits on top of them. These
 * drive the ACTUAL route against a mock forge and pin the three things that
 * would quietly undo it — a flattened history, an owner taken from the request,
 * and a provider the recognizer refuses.
 */
import { http, HttpResponse } from 'msw';
import { NextRequest } from 'next/server';
import { clearJwksCache } from '@hanzo/iam/auth';

import { server } from '../../jest.setup';
import { IAM, CLIENT_ID, iamHandlers, mint } from '../iam-fixture';

const FORGE = 'https://git.test';
const HOST = 'hanzo.app';

/** What the forge was asked to clone, and under whom. */
let migrated: Record<string, unknown> | null = null;

/** The user's IAM account — the source of a linked provider's clone credential. */
let linked: Record<string, string> = {};
const iamAccount = () =>
  http.get(`${IAM}/v1/iam/get-account`, () =>
    HttpResponse.json({ status: 'ok', data: { properties: linked } }),
  );

/** A source repo's history — three commits, oldest last, as the forge lists it. */
const HISTORY = [
  { sha: 'c3', message: 'ship the pricing page\n\nCo-authored-by: someone <a@b.c>', date: '2026-03-03T00:00:00Z' },
  { sha: 'c2', message: 'add the docs', date: '2026-02-02T00:00:00Z' },
  { sha: 'c1', message: 'Initial commit', date: '2026-01-01T00:00:00Z' },
];

function mockForge() {
  return [
    http.post(`${FORGE}/v1/repos/migrate`, async ({ request }) => {
      migrated = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(
        {
          full_name: `${migrated.repo_owner}/${migrated.repo_name}`,
          html_url: `${FORGE}/${migrated.repo_owner}/${migrated.repo_name}`,
          default_branch: 'main',
        },
        { status: 201 },
      );
    }),
    http.get(`${FORGE}/v1/repos/:owner/:name/commits`, ({ params }) =>
      HttpResponse.json(
        HISTORY.map((c) => ({
          sha: c.sha,
          html_url: `${FORGE}/${params.owner}/${params.name}/commit/${c.sha}`,
          commit: { message: c.message, author: { name: 'antje', date: c.date } },
        })),
      ),
    ),
    http.get(`${FORGE}/v1/repos/:owner/:name/git/commits/:sha`, ({ params }) => {
      const c = HISTORY.find((x) => x.sha === params.sha);
      if (!c) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json({
        sha: c.sha,
        html_url: `${FORGE}/${params.owner}/${params.name}/commit/${c.sha}`,
        commit: { message: c.message, author: { name: 'antje', date: c.date } },
        files: [{ filename: 'index.html', status: 'modified' }],
      });
    }),
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

const importRoute = () => import('@/app/v1/git/import/route');
const commitsRoute = () => import('@/app/v1/git/commits/route');

beforeEach(() => {
  migrated = null;
  linked = {};
  clearJwksCache();
});

describe('import a repository', () => {
  it('clones a GitLab repo with its history, and the timeline shows it', async () => {
    server.use(...(await iamHandlers()), iamAccount(), ...mockForge());
    const token = await mint({ owner: 'antje', name: 'antje' });

    const res = await (await importRoute()).POST(
      withAuth('/v1/git/import', 'POST', token, { url: 'https://gitlab.com/acme/storefront' }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, slug: 'storefront', branch: 'main', commit: 'c3' });

    // A CLONE, not a copy: no shallow depth, and not a read-only mirror — the
    // project has to be able to commit onto what it just imported.
    expect(migrated).toMatchObject({
      clone_addr: 'https://gitlab.com/acme/storefront',
      repo_name: 'storefront',
      mirror: false,
    });

    // The owner is the SESSION's username. A caller naming someone else's
    // account is how an admin-scoped forge token becomes a way to write into it.
    expect(migrated?.repo_owner).toBe('antje');

    // The imported past IS the project's history — all three commits, newest
    // first, in the shape the panel reads.
    const h = await (await commitsRoute()).GET(
      withAuth('/v1/git/commits?provider=hanzo&repo=storefront&branch=main', 'GET', token),
    );
    const hist = await h.json();
    expect(hist.supported).toBe(true);
    expect(hist.commits.map((c: { sha: string }) => c.sha)).toEqual(['c3', 'c2', 'c1']);
    expect(hist.commits[0]).toMatchObject({
      shortSha: 'c3',
      // The SUBJECT is the row's title; the trailer belongs to the full message.
      message: 'ship the pricing page',
      authoredAt: '2026-03-03T00:00:00Z',
      author: 'antje',
    });
    expect(hist.commits[0].rawMessage).toContain('Co-authored-by');
  });

  it('expands a commit into the files it touched', async () => {
    server.use(...(await iamHandlers()), iamAccount(), ...mockForge());
    const token = await mint({ owner: 'antje', name: 'antje' });

    // A detail request used to fall through to the list and answer `{commits}`
    // to a caller reading `{commit}` — every row expanded onto nothing.
    const res = await (await commitsRoute()).GET(
      withAuth('/v1/git/commits?provider=hanzo&repo=storefront&sha=c2', 'GET', token),
    );
    const body = await res.json();
    expect(body.commit).toMatchObject({ sha: 'c2', shortSha: 'c2', message: 'add the docs' });
    expect(body.commit.filesChanged).toEqual([{ path: 'index.html', status: 'modified' }]);
  });

  it("clones a private source with the user's own linked token", async () => {
    server.use(...(await iamHandlers()), iamAccount(), ...mockForge());
    linked = { oauth_GitLab_accessToken: 'glpat-secret' };
    const token = await mint({ owner: 'antje', name: 'antje' });

    await (await importRoute()).POST(
      withAuth('/v1/git/import', 'POST', token, { url: 'https://gitlab.com/acme/private' }),
    );
    // GitLab authenticates a token clone as `oauth2`. The credential is the
    // user's own, resolved server-side, and never appears in the clone address.
    expect(migrated).toMatchObject({ auth_username: 'oauth2', auth_password: 'glpat-secret' });
    expect(String(migrated?.clone_addr)).not.toContain('glpat-secret');
  });

  it('refuses a remote it cannot read, and says which', async () => {
    server.use(...(await iamHandlers()), iamAccount(), ...mockForge());
    const token = await mint({ owner: 'antje', name: 'antje' });

    const res = await (await importRoute()).POST(
      withAuth('/v1/git/import', 'POST', token, { url: 'git@gitlab.com:acme/storefront.git' }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/Public HTTPS/);
    expect(migrated).toBeNull();
  });

  it('imports nothing without a session', async () => {
    server.use(...(await iamHandlers()), iamAccount(), ...mockForge());
    const res = await (await importRoute()).POST(
      new NextRequest(`https://${HOST}/v1/git/import`, {
        method: 'POST',
        headers: { host: HOST, origin: `https://${HOST}`, 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://gitlab.com/acme/storefront' }),
      }) as NextRequest,
    );
    expect(res.status).toBe(401);
    expect(migrated).toBeNull();
  });
});
