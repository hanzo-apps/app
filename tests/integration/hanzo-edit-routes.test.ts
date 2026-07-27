/**
 * Hanzo Edit — the backend GATE + CTA shaping, exercised through the real route
 * handlers with a mocked IAM/billing/forge (global.fetch). Proves the security
 * boundary that the widget only cosmetically mirrors:
 *   /v1/edit  → 401 anon · 402 no-credit non-admin · admin+credit pass the gate
 *   /v1/me    → the { authenticated, isAdmin, balance, hasCredits } shape
 *   /v1/suggest → anonymous works (honest filed:false with no channel; files an
 *                 issue when a forge token is available)
 * Node env (NextRequest extends the global Request).
 */
// `jose` ships ESM that jest doesn't transform inside node_modules; org/server
// only needs `decodeJwt` (unverified claim decode), which is a base64url unwrap
// of the payload — mock it so the route chain loads under jest.
jest.mock('jose', () => ({
  decodeJwt: (t: string) =>
    JSON.parse(Buffer.from(String(t).split('.')[1] || '', 'base64url').toString('utf8') || '{}'),
}));

import { NextRequest } from 'next/server';

import { GET as meGET } from '@/app/v1/me/route';
import { POST as askPOST } from '@/app/v1/ask/route';
import { POST as editPOST } from '@/app/v1/edit/route';
import { POST as suggestPOST } from '@/app/v1/suggest/route';

// --- helpers ---------------------------------------------------------------

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
/** An unsigned JWT jose.decodeJwt can read (claims only — validity comes from the mocked userinfo). */
const jwt = (claims: Record<string, unknown>) =>
  `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims })}.sig`;

interface FetchOpts { balance?: number; githubToken?: string | null }

function installFetch(o: FetchOpts = {}) {
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
  return jest.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.includes('/v1/iam/get-account')) {
      const props: Record<string, string> = {};
      if (o.githubToken) {
        props['oauth_GitHub_accessToken'] = o.githubToken;
        props['oauth_GitHub_username'] = 'bob';
      }
      return json({ status: 'ok', data: { properties: props } });
    }
    if (url.includes('/v1/billing/balance')) return json({ available: o.balance ?? 0 });
    if (url.includes('/chat/completions'))
      return json({ choices: [{ message: { content: 'The concise answer.' } }] });
    if (url.includes('api.github.com') && url.endsWith('/issues'))
      return json({ html_url: 'https://github.com/owner/repo/issues/9', number: 9 });
    if (url.includes('hanzo.id')) return json({ sub: 'bob', preferred_username: 'bob', name: 'bob', email: 'b@x' });
    throw new Error('unexpected fetch: ' + url);
  });
}

function req(
  url: string,
  o: { method?: string; token?: string; origin?: string; body?: unknown } = {},
) {
  const headers: Record<string, string> = {};
  if (o.token) headers['authorization'] = `Bearer ${o.token}`;
  if (o.origin) headers['origin'] = o.origin;
  if (o.body) headers['content-type'] = 'application/json';
  return new NextRequest(url, {
    method: o.method ?? 'GET',
    headers,
    body: o.body ? JSON.stringify(o.body) : undefined,
  });
}

// An admin token elevates ONLY when it was minted for hanzo.app's OWN IAM client
// (aud === IAM_CLIENT_ID) — FIX #2 (confused-deputy guard). ADMIN carries our
// audience; ADMIN_FOREIGN is an admin-owner token from a DIFFERENT app's client.
const ADMIN = () => jwt({ owner: 'admin', name: 'z', aud: 'hanzo-app' });
const ADMIN_FOREIGN = () => jwt({ owner: 'admin', name: 'z', aud: 'hanzo-chat' });
const USER = () => jwt({ owner: 'acme', name: 'bob', aud: 'hanzo-app' });
const EDIT_BODY = { repo: 'hanzoai/app', path: 'README.md', instruction: 'fix a typo' };

beforeEach(() => {
  delete process.env.HANZO_EDIT_BOT_TOKEN;
  process.env.IAM_CLIENT_ID = 'hanzo-app';
});
afterEach(() => jest.restoreAllMocks());

// --- /v1/me ----------------------------------------------------------------

describe('GET /v1/me', () => {
  it('anonymous → not authenticated, no credits', async () => {
    installFetch();
    const res = await meGET(req('https://hanzo.app/v1/me', { origin: 'https://docs.hanzo.ai' }));
    expect(res.status).toBe(200);
    // CORS reflects the Hanzo-family origin with credentials.
    expect(res.headers.get('access-control-allow-origin')).toBe('https://docs.hanzo.ai');
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(await res.json()).toMatchObject({ authenticated: false, isAdmin: false, hasCredits: false });
  });

  it('user with credits → hasCredits true, real balance', async () => {
    installFetch({ balance: 500 });
    const res = await meGET(req('https://hanzo.app/v1/me', { token: USER() }));
    expect(await res.json()).toMatchObject({ authenticated: true, isAdmin: false, hasCredits: true, balance: 500 });
  });

  it('user without credits → hasCredits false', async () => {
    installFetch({ balance: 0 });
    const res = await meGET(req('https://hanzo.app/v1/me', { token: USER() }));
    expect(await res.json()).toMatchObject({ authenticated: true, isAdmin: false, hasCredits: false, balance: 0 });
  });

  it('admin → free (hasCredits true, balance skipped)', async () => {
    installFetch();
    const res = await meGET(req('https://hanzo.app/v1/me', { token: ADMIN() }));
    expect(await res.json()).toMatchObject({ authenticated: true, isAdmin: true, hasCredits: true, balance: null });
  });
});

// --- /v1/ask ---------------------------------------------------------------

describe('POST /v1/ask', () => {
  it('requires a validated Hanzo identity', async () => {
    installFetch();
    const res = await askPOST(
      req('https://hanzo.app/v1/ask', {
        method: 'POST',
        origin: 'https://docs.hanzo.ai',
        body: { question: 'Where is billing?' },
      }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, openLogin: true });
  });

  it('answers in the widget and reflects the calling Hanzo origin', async () => {
    installFetch();
    const res = await askPOST(
      req('https://hanzo.app/v1/ask', {
        method: 'POST',
        token: USER(),
        origin: 'https://docs.hanzo.ai',
        body: { question: 'Where is billing?', url: 'https://docs.hanzo.ai/start' },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://docs.hanzo.ai');
    expect(await res.json()).toEqual({ ok: true, answer: 'The concise answer.' });
  });

  it('rejects an empty question', async () => {
    installFetch();
    const res = await askPOST(
      req('https://hanzo.app/v1/ask', { method: 'POST', token: USER(), body: { question: ' ' } }),
    );
    expect(res.status).toBe(400);
  });
});

// --- /v1/edit gate ---------------------------------------------------------

describe('POST /v1/edit — the gate', () => {
  it('anonymous → 401 openLogin', async () => {
    installFetch();
    const res = await editPOST(req('https://hanzo.app/v1/edit', { method: 'POST', body: EDIT_BODY }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, openLogin: true });
  });

  it('non-admin with no credits → 402 needsCredits', async () => {
    installFetch({ balance: 0 });
    const res = await editPOST(req('https://hanzo.app/v1/edit', { method: 'POST', token: USER(), body: EDIT_BODY }));
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ ok: false, needsCredits: true });
  });

  it('non-admin WITH credits passes the gate (then needs a linked forge → 409)', async () => {
    installFetch({ balance: 500, githubToken: null });
    const res = await editPOST(req('https://hanzo.app/v1/edit', { method: 'POST', token: USER(), body: EDIT_BODY }));
    expect(res.status).toBe(409); // past the gate; stopped only for lack of a GitHub link
    expect(await res.json()).toMatchObject({ ok: false, connect: true });
  });

  it('admin passes the gate FREE — no balance needed (then 409 for no linked forge)', async () => {
    installFetch({ githubToken: null }); // note: no balance provided; admin must not consult billing
    const res = await editPOST(req('https://hanzo.app/v1/edit', { method: 'POST', token: ADMIN(), body: EDIT_BODY }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ ok: false, connect: true });
  });

  // FIX #2: an `owner:admin` token minted for a DIFFERENT (lower-trust) app's IAM
  // client must NOT elevate — it is treated as a normal user, so with no credits
  // it is stopped at the 402 billing gate, never granted the free admin path.
  it('admin-owner token from a FOREIGN app client does NOT elevate → 402', async () => {
    installFetch({ balance: 0, githubToken: null });
    const res = await editPOST(
      req('https://hanzo.app/v1/edit', { method: 'POST', token: ADMIN_FOREIGN(), body: EDIT_BODY }),
    );
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ ok: false, needsCredits: true });
  });

  it('rejects a body with no path', async () => {
    installFetch({ balance: 500 });
    const res = await editPOST(
      req('https://hanzo.app/v1/edit', { method: 'POST', token: USER(), body: { repo: 'a/b', instruction: 'x' } }),
    );
    expect(res.status).toBe(400);
  });
});

// --- /v1/suggest -----------------------------------------------------------

describe('POST /v1/suggest', () => {
  it('anonymous with no bot configured → accepted, filed:false (honest)', async () => {
    installFetch();
    const res = await suggestPOST(
      req('https://hanzo.app/v1/suggest', { method: 'POST', body: { repo: 'owner/repo', suggestion: 'fix a typo' } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, filed: false });
  });

  it('authenticated with a linked forge → files an issue', async () => {
    installFetch({ githubToken: 'ght' });
    const res = await suggestPOST(
      req('https://hanzo.app/v1/suggest', { method: 'POST', token: USER(), body: { repo: 'owner/repo', suggestion: 'fix a typo' } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, filed: true, issueUrl: expect.stringContaining('/issues/9') });
  });

  it('rejects an empty suggestion', async () => {
    installFetch();
    const res = await suggestPOST(
      req('https://hanzo.app/v1/suggest', { method: 'POST', body: { repo: 'owner/repo', suggestion: '  ' } }),
    );
    expect(res.status).toBe(400);
  });
});
