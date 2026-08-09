/**
 * @jest-environment node
 *
 * BFF: the NATIVE git.hanzo.ai import seam — the DEFAULT home.
 *
 * A signed-in user's forge account is populated automatically: no OAuth link,
 * the ADMIN token reads their repos, and the account name is the verified IAM
 * username (`session.name`) — bound by the server, never taken from the request
 * (the same binding the write path uses). This pins that the native provider
 * leads the account list, that the forge is called with the admin token and NOT
 * the IAM bearer, and that neither secret ever reaches the browser.
 *
 * `GIT_FORGE_*` must be set before forge.ts freezes BASE/TOKEN at module load, so
 * the routes are imported DYNAMICALLY inside the tests (after `beforeAll`) — the
 * same pattern git-native-read.test.ts uses.
 */
import { NextRequest } from 'next/server';
import { http, HttpResponse } from 'msw';
import { clearJwksCache } from '@hanzo/iam/auth';

import { server } from '../../../jest.setup';
import { IAM as IAM_HOST, CLIENT_ID, iamHandlers, mint } from '../../iam-fixture';

const FORGE = 'https://git.hanzo.ai';
const FORGE_TOKEN = 'test-forge-token';
// `session.name` for the default minted token (iam-fixture) — the forge username.
const USER = 'Someone';

let AUTH: string;

beforeAll(() => {
  process.env.GIT_FORGE_URL = FORGE;
  process.env.GIT_FORGE_TOKEN = FORGE_TOKEN;
});

beforeEach(async () => {
  process.env.IAM_URL = IAM_HOST;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  clearJwksCache();
  server.use(...(await iamHandlers()));
  AUTH = await mint();
});

function req(url: string, authed = true) {
  const headers = new Headers();
  if (authed) headers.set('authorization', `Bearer ${AUTH}`);
  return new NextRequest(url, { headers });
}

/** IAM get-account with NO OAuth provider linked — native is the only home. */
function iamNoOauth() {
  return http.get(`${IAM_HOST}/v1/iam/get-account`, () =>
    HttpResponse.json({ status: 'ok', data: { properties: {} } }),
  );
}

describe('BFF: GET /v1/git/accounts (native)', () => {
  it('leads with the native account, read with the ADMIN token — not the IAM bearer', async () => {
    let forgeAuth: string | null = null;
    server.use(
      iamNoOauth(),
      http.get(`${FORGE}/v1/users/${USER}`, ({ request }) => {
        forgeAuth = request.headers.get('authorization');
        return HttpResponse.json({ login: USER, avatar_url: 'https://a/someone.png' });
      }),
      http.get(`${FORGE}/v1/users/${USER}/orgs`, () =>
        HttpResponse.json([{ username: 'hanzoai', avatar_url: 'https://a/h.png' }]),
      ),
    );

    const { GET } = await import('@/app/v1/git/accounts/route');
    const res = await GET(req('http://localhost/v1/git/accounts'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(forgeAuth).toBe(`token ${FORGE_TOKEN}`); // admin token, never the bearer
    expect(body.connected).toBe(true);
    // Native leads; its account carries the forge avatar and the user's orgs follow.
    expect(body.accounts[0]).toEqual({
      login: USER, avatarUrl: 'https://a/someone.png', provider: 'hanzo', type: 'user',
    });
    expect(body.accounts).toContainEqual({
      login: 'hanzoai', avatarUrl: 'https://a/h.png', provider: 'hanzo', type: 'org',
    });
    // …and it is advertised first in the connectable list.
    expect(body.providers[0]).toEqual({ provider: 'hanzo', connectable: true });
    // Neither secret is serialized to the browser.
    expect(JSON.stringify(body)).not.toContain(FORGE_TOKEN);
    expect(JSON.stringify(body)).not.toContain(AUTH);
  });

  it('orgs are best-effort: none still yields the personal account', async () => {
    server.use(
      iamNoOauth(),
      http.get(`${FORGE}/v1/users/${USER}`, () =>
        HttpResponse.json({ login: USER, avatar_url: '' }),
      ),
      http.get(`${FORGE}/v1/users/${USER}/orgs`, () => new HttpResponse(null, { status: 500 })),
    );

    const { GET } = await import('@/app/v1/git/accounts/route');
    const res = await GET(req('http://localhost/v1/git/accounts'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.connected).toBe(true);
    expect(body.accounts).toEqual([
      { login: USER, avatarUrl: '', provider: 'hanzo', type: 'user' },
    ]);
  });
});

describe('BFF: GET /v1/git/repos?provider=hanzo (native)', () => {
  it('self account → /v1/users/:user/repos, newest first, mapped, admin-token', async () => {
    let seenPath = '';
    let forgeAuth: string | null = null;
    server.use(
      iamNoOauth(),
      http.get(`${FORGE}/v1/users/${USER}/repos`, ({ request }) => {
        seenPath = new URL(request.url).pathname;
        forgeAuth = request.headers.get('authorization');
        // Returned oldest-first on purpose — the BFF must sort newest-first.
        return HttpResponse.json([
          {
            name: 'old', full_name: `${USER}/old`, private: false, description: 'older',
            updated_at: '2026-06-01T00:00:00Z', default_branch: 'main',
            clone_url: `${FORGE}/${USER}/old.git`, html_url: `${FORGE}/${USER}/old`,
          },
          {
            name: 'site', full_name: `${USER}/site`, private: true, description: 'the site',
            updated_at: '2026-08-01T00:00:00Z', default_branch: 'main',
            clone_url: `${FORGE}/${USER}/site.git`, html_url: `${FORGE}/${USER}/site`,
          },
        ]);
      }),
    );

    const { GET } = await import('@/app/v1/git/repos/route');
    const res = await GET(req(`http://localhost/v1/git/repos?provider=hanzo&account=${USER}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenPath).toBe(`/v1/users/${USER}/repos`);
    expect(forgeAuth).toBe(`token ${FORGE_TOKEN}`);
    expect(body.repos.map((r: { fullName: string }) => r.fullName)).toEqual([
      `${USER}/site`,
      `${USER}/old`,
    ]);
    expect(body.repos[0]).toMatchObject({
      fullName: `${USER}/site`,
      private: true,
      provider: 'hanzo',
      cloneUrl: `${FORGE}/${USER}/site.git`,
      defaultBranch: 'main',
    });
    expect(JSON.stringify(body)).not.toContain(FORGE_TOKEN);
  });

  it('an org account → /v1/orgs/:org/repos', async () => {
    let seenPath = '';
    server.use(
      iamNoOauth(),
      http.get(`${FORGE}/v1/orgs/hanzoai/repos`, ({ request }) => {
        seenPath = new URL(request.url).pathname;
        return HttpResponse.json([
          {
            name: 'iam', full_name: 'hanzoai/iam', private: false, description: 'identity',
            updated_at: '2026-07-02T00:00:00Z', default_branch: 'main',
            clone_url: `${FORGE}/hanzoai/iam.git`, html_url: `${FORGE}/hanzoai/iam`,
          },
        ]);
      }),
    );

    const { GET } = await import('@/app/v1/git/repos/route');
    const res = await GET(req('http://localhost/v1/git/repos?provider=hanzo&account=hanzoai'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenPath).toBe('/v1/orgs/hanzoai/repos');
    expect(body.repos[0].fullName).toBe('hanzoai/iam');
    expect(body.repos[0].provider).toBe('hanzo');
  });
});
