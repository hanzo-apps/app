/**
 * @jest-environment node
 *
 * One session, verified.
 *
 * hanzo.app used to hold three credentials at once: an app-named `hanzo_token`
 * cookie trusted on an UNVERIFIED `decodeJwt`, a self-issued HS256 `osw_session`
 * that nothing ever minted (so the 34 routes behind it answered 401 forever),
 * and a scatter of one-off cookie readers. This pins the collapse of all of that
 * onto one JWKS-verified IAM session.
 *
 * Every token here is really signed by a really-fetched key, so the interesting
 * cases are the real ones: a forged signature over a perfect payload, and a
 * genuine token minted for a different Hanzo app.
 */
import { NextRequest } from 'next/server';
import { http, HttpResponse } from 'msw';
import { clearJwksCache } from '@hanzo/iam/auth';

import { server } from '../../jest.setup';
import { IAM, CLIENT_ID, iamHandlers, mint, forge, selfSigned } from '../iam-fixture';

import { GET as wallet } from '@/app/v1/wallet/route';
import { GET as projects } from '@/app/v1/me/projects/route';
import { GET as orgs } from '@/app/v1/orgs/route';
import { session } from '@/lib/iam';
import { subjectOf } from '@/lib/security/rate-limiter';

const GATEWAY = 'https://api.hanzo.ai';

// The Base data plane `/v1/me/projects` reads once a caller is authenticated.
//
// This is lib/base.ts's DEFAULT — the in-cluster companion — and not an origin
// chosen here, because that module reads HANZO_BASE_URL once at module scope and
// imports are hoisted above any assignment a test could make. Naming the value
// the code actually resolves to is the honest way to say which host is expected.
const BASE = 'http://hanzo-app-base.hanzo.svc:8090';

function bearer(url: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  return new NextRequest(url, { ...init, headers } as ConstructorParameters<typeof NextRequest>[1]);
}

function cookie(url: string, token: string) {
  return new NextRequest(url, {
    headers: new Headers({ cookie: `hanzo_iam_access_token=${token}` }),
  });
}

beforeEach(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  clearJwksCache();
  server.use(...(await iamHandlers()));
});

describe('lib/iam: the one trust decision', () => {
  it('accepts a genuinely signed token and reads the org off the `orgs` claim', async () => {
    const s = await session(bearer('http://localhost/x', await mint({ owner: 'acme' })));
    expect(s).not.toBeNull();
    // The USER's own org — the first entry of the signed membership set. NOT the
    // SDK's `owner` (which derives from a "org/user" sub and would be "unknown"
    // for IAM's uuid subjects), and NOT the `owner` claim, which is the APP's org.
    expect(s!.org).toBe('acme');
    expect(s!.sub).toBe('11111111-2222-3333-4444-555555555555');
  });

  it('REFUSES a forged signature over a valid payload', async () => {
    const good = await mint({ owner: 'acme' });
    expect(await session(bearer('http://localhost/x', forge(good)))).toBeNull();
  });

  it('REFUSES an unsigned token that simply asserts the claims it wants', async () => {
    const alg_none = await selfSigned({ owner: 'admin', isAdmin: true, email: 'x@hanzo.ai' });
    expect(await session(bearer('http://localhost/x', alg_none))).toBeNull();
  });

  it('lets a token from a DIFFERENT Hanzo app act as its own user, never elevate', async () => {
    // The cross-origin Edit widget forwards its host app's token, so a foreign
    // audience is a real person — it just cannot become staff or cross tenants.
    const foreign = await session(bearer('http://localhost/x', await mint({ owner: 'admin', email: 'z@hanzo.ai', aud: 'hanzo-chat' })));
    expect(foreign).not.toBeNull();
    expect(foreign!.org).toBe('admin');
    expect(foreign!.isAdmin).toBe(false);
    expect(foreign!.isSuperAdmin).toBe(false);

    // The identical claims on a token minted for OUR client do elevate.
    const ours = await session(bearer('http://localhost/x', await mint({ owner: 'admin', email: 'z@hanzo.ai' })));
    expect(ours!.isAdmin).toBe(true);
    expect(ours!.isSuperAdmin).toBe(true);
  });

  it('REFUSES an expired token', async () => {
    expect(await session(bearer('http://localhost/x', await mint({ ttl: -60 })))).toBeNull();
  });

  it('reads the header and the session cookie identically', async () => {
    const t = await mint({ owner: 'acme' });
    const viaHeader = await session(bearer('http://localhost/x', t));
    const viaCookie = await session(cookie('http://localhost/x', t));
    expect(viaCookie).toEqual(viaHeader);
  });

  it('grants sudo only to the `admin` org, off a verified claim', async () => {
    const normal = await session(bearer('http://localhost/x', await mint({ owner: 'acme' })));
    expect(normal!.isSuperAdmin).toBe(false);
    const sudo = await session(bearer('http://localhost/x', await mint({ owner: 'admin' })));
    expect(sudo!.isSuperAdmin).toBe(true);
  });

  it('takes the USER\'s org, never the APP\'s — a real signed token, claims split', async () => {
    // IAM stamps the APPLICATION's org into `owner`, so a customer of `acme` who
    // signs in through an app owned by `admin` carries owner=admin. Reading that
    // claim handed them sudo AND pointed billing at the wrong ledger. The signed
    // membership set is the only thing that says who they actually are.
    const s = await session(
      bearer('http://localhost/x', await mint({ owner: 'admin', home: 'acme' })),
    );
    expect(s!.org).toBe('acme');
    expect(s!.isSuperAdmin).toBe(false);
  });

  it('resolves NO org for a token that names no membership — fail closed', async () => {
    // A legacy token (minted before IAM emitted `orgs`) must grant no org scope
    // at all rather than falling back to the app-selected `owner`.
    const s = await session(bearer('http://localhost/x', await mint({ home: '' })));
    expect(s!.org).toBe('');
    expect(s!.isSuperAdmin).toBe(false);
  });
});

describe('protected routes refuse anything that is not a verified caller', () => {
  // /v1/wallet took the old UNVERIFIED hot path (`resolveScope` → `decodeOwner`),
  // so before this change a forged token reached the gateway as a real caller.
  const cases: Array<[string, () => Promise<string | undefined>]> = [
    ['no token', async () => undefined],
    ['a forged signature', async () => forge(await mint())],
    ['an unsigned self-asserted token', async () => selfSigned({ owner: 'admin' })],
    ['an expired token', async () => mint({ ttl: -60 })],
    ['a garbage string', async () => 'not-a-jwt'],
  ];

  it.each(cases)('/v1/wallet refuses %s', async (_label, make) => {
    let reached = false;
    server.use(
      http.get(`${GATEWAY}/v1/*`, () => {
        reached = true;
        return HttpResponse.json({ balance: 999 });
      }),
    );
    const res = await wallet(bearer('http://localhost/v1/wallet', await make()));
    expect(res.status).toBe(401);
    expect(reached).toBe(false); // never spoke to the gateway on its behalf
  });

  it.each(cases)('/v1/orgs refuses %s', async (_label, make) => {
    const res = await orgs(bearer('http://localhost/v1/orgs', await make()));
    expect(res.status).toBe(401);
  });

  it.each(cases)('/v1/me/projects refuses %s', async (_label, make) => {
    const res = await projects(bearer('http://localhost/v1/me/projects', await make()));
    expect(res.status).toBe(401);
  });
});

describe('the routes stranded behind the self-issued session are on the IAM one', () => {
  // `requireAuth()` read an HS256 `osw_session` cookie that NOTHING in the repo
  // ever minted, so /v1/me/projects answered 401 to a fully signed-in user. It now
  // answers to the same session as everything else.
  it('/v1/me/projects serves a signed-in IAM caller', async () => {
    // Past the gate the route really reads Base, so Base has to answer. What is
    // under test is the SESSION, not the projects — an empty list is a complete
    // answer, and MSW refusing an unmocked call is what makes that explicit.
    server.use(
      http.get(`${BASE}/v1/collections/projects/records`, () =>
        HttpResponse.json({ items: [], page: 1, perPage: 100, totalItems: 0, totalPages: 0 }),
      ),
    );
    const res = await projects(bearer('http://localhost/v1/me/projects', await mint()));
    expect(res.status).not.toBe(401);
  });
});

describe('the AI rate-limit bucket survives a token refresh', () => {
  // Keyed on the token's last 24 chars, a refresh minted a brand-new bucket and
  // handed the user a fresh budget. The subject is what stays put.
  it('two tokens for the same person key the same bucket', async () => {
    const first = await mint({ sub: 'same-person' });
    const second = await mint({ sub: 'same-person', ttl: 7200 });
    expect(second).not.toBe(first);
    expect(subjectOf(bearer('http://localhost/v1/generate', first))).toBe('same-person');
    expect(subjectOf(bearer('http://localhost/v1/generate', second))).toBe('same-person');
  });

  it('different people key different buckets', async () => {
    const a = subjectOf(bearer('http://localhost/x', await mint({ sub: 'ann' })));
    const b = subjectOf(bearer('http://localhost/x', await mint({ sub: 'bob' })));
    expect(a).not.toBe(b);
  });
});
