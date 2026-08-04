/**
 * @jest-environment node
 *
 * Onboarding must not read an IAM REFUSAL as "this org does not exist".
 *
 * IAM v1.33.31 made org scoping honour-or-refuse (`internal/authz/authz.go`
 * `Scope`): a non-super principal that asks about a foreign owner is REFUSED
 * rather than silently re-pointed at its own org. Its wire shapes, read from
 * that source, are three DIFFERENT answers and this suite pins all three:
 *
 *   hit      HTTP 200 {status:"ok",    data:{…}}                  (httpx.Ok)
 *   absence  HTTP 200 {status:"error", msg:"the entity does not exist"}
 *                                                                 (httpx.Err — 200 BY CONTRACT,
 *                                                                  "branch on status, not HTTP code")
 *   refusal  HTTP 403 {status:"error", msg:"forbidden: …"}        (authz.Deny → 403)
 *
 * Absence is the ONLY one that may become `null`. Collapsing the other two into
 * `null` tells the caller "that slug is free" about an org it merely may not
 * read — and `/onboard` then CREATES on a taken slug, or hands a taken slug back
 * as available. The refusal is exactly what the v1.33.31 rollout makes common,
 * so this is a deploy-ordering hazard, not a theoretical one.
 *
 * Driven through the REAL route with a REAL signed token, so it pins the
 * behaviour a caller actually gets — not just the helper in isolation.
 */
import { NextRequest } from 'next/server';
import { http, HttpResponse, delay } from 'msw';
import { clearJwksCache } from '@hanzo/iam/auth';

import { server } from '../../jest.setup';
import { IAM, CLIENT_ID, iamHandlers, mint } from '../iam-fixture';

const HOST = 'hanzo.app';

/** IAM's genuine-absence envelope, verbatim (compat/aliases.go getHandler). */
const ABSENT = { status: 'error', msg: 'the entity does not exist' };
/** IAM's refusal, verbatim (authz.errForeignOrg, rendered by authz.Deny at 403). */
const REFUSAL = { status: 'error', msg: 'forbidden: this credential is scoped to organization hanzo' };

/** Calls IAM saw, by verb — so a WRITE that should never happen is provable. */
let calls: string[] = [];

type OrgAnswer = () => HttpResponse;

/**
 * Stub IAM's org primitives. `getOrg` decides what the existence probe answers;
 * every write is recorded and succeeds, so "did we write?" is the assertion and
 * never a side effect of the write failing.
 */
function iamOrgHandlers(getOrg: OrgAnswer) {
  return [
    http.get(`${IAM}/v1/iam/get-organization`, () => {
      calls.push('get-organization');
      return getOrg();
    }),
    http.post(`${IAM}/v1/iam/add-organization`, () => {
      calls.push('add-organization');
      return HttpResponse.json({ status: 'ok', data: {} });
    }),
    http.get(`${IAM}/v1/iam/get-user`, () => {
      calls.push('get-user');
      return HttpResponse.json({ status: 'ok', data: { owner: 'acme', name: 'Someone' } });
    }),
    http.post(`${IAM}/v1/iam/update-user`, () => {
      calls.push('update-user');
      return HttpResponse.json({ status: 'ok', data: {} });
    }),
  ];
}

/** The onboard route, imported AFTER env is set (it reads env at module scope). */
type OnboardRoute = { POST: (req: NextRequest) => Promise<Response> };
type Onboard = typeof import('@/lib/org/onboard');

let route: OnboardRoute;
let onboard: Onboard;

async function post(body: unknown, token: string) {
  return route.POST(
    new NextRequest(`https://${HOST}/onboard`, {
      method: 'POST',
      headers: {
        host: HOST,
        origin: `https://${HOST}`,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }) as NextRequest,
  );
}

beforeAll(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_ADMIN_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  process.env.IAM_MINT_CLIENT_ID = 'hanzo-app-mint';
  process.env.IAM_MINT_CLIENT_SECRET = 'test-secret';
  process.env.IAM_TIMEOUT_MS = '200'; // bound the silent-IAM case without a slow test
  route = (await import('@/app/onboard/route')) as unknown as OnboardRoute;
  onboard = await import('@/lib/org/onboard');
});

beforeEach(() => {
  calls = [];
  clearJwksCache();
});

async function withIam(getOrg: OrgAnswer) {
  server.use(...(await iamHandlers()), ...iamOrgHandlers(getOrg));
  return mint({ owner: 'acme', name: 'Someone' });
}

describe('getOrganization — three answers, not one', () => {
  it('a genuine absence is the ONLY null', async () => {
    await withIam(() => HttpResponse.json(ABSENT));
    await expect(onboard.getOrganization('nope')).resolves.toBeNull();
  });

  it('a hit returns the org', async () => {
    await withIam(() => HttpResponse.json({ status: 'ok', data: { owner: 'admin', name: 'taken' } }));
    await expect(onboard.getOrganization('taken')).resolves.toMatchObject({ name: 'taken' });
  });

  it('a REFUSAL is not an absence — it throws, and says why', async () => {
    await withIam(() => HttpResponse.json(REFUSAL, { status: 403 }));
    await expect(onboard.getOrganization('lux')).rejects.toThrow(/scoped to organization hanzo/);
  });

  it('a 5xx is not an absence', async () => {
    await withIam(() => HttpResponse.json({ status: 'error', msg: 'boom' }, { status: 502 }));
    await expect(onboard.getOrganization('acme')).rejects.toThrow();
  });

  it('a network failure is not an absence', async () => {
    await withIam(() => HttpResponse.error() as unknown as HttpResponse);
    await expect(onboard.getOrganization('acme')).rejects.toThrow();
  });

  it('an unreadable envelope is not an absence', async () => {
    await withIam(() => HttpResponse.json({ status: 'error', msg: 'id (owner/name) or name is required' }));
    await expect(onboard.getOrganization('acme')).rejects.toThrow(/is required/);
  });

  it('a SILENT IAM is bounded, and is not an absence', async () => {
    // Reachable but never answering: without a timeout this wedges the route
    // until the caller gives up. It must end as a throw, never as "no such org".
    await withIam((async () => {
      await delay(1_000); // >> the 200ms bound, without leaving a long handle
      return HttpResponse.json(ABSENT);
    }) as unknown as OrgAnswer);
    await expect(onboard.getOrganization('acme')).rejects.toThrow(/unreachable/);
  });
});

describe('POST /onboard — a refusal never becomes a duplicate org', () => {
  it('REFUSED existence probe: refuses honestly and NEVER writes', async () => {
    const token = await withIam(() => HttpResponse.json(REFUSAL, { status: 403 }));

    const res = await post({ name: 'Acme Corp' }, token);

    // The write is the damage. It must not have happened.
    expect(calls).not.toContain('add-organization');
    expect(calls).not.toContain('update-user');
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('scoped to organization hanzo'),
    });
  });

  it('a genuine absence still creates — the fix does not break onboarding', async () => {
    const token = await withIam(() => HttpResponse.json(ABSENT));

    const res = await post({ name: 'Acme Corp' }, token);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ org: 'acme-corp' });
    expect(calls).toContain('add-organization');
  });

  it('a real hit is still a taken slug (409), not a create', async () => {
    const token = await withIam(() =>
      HttpResponse.json({ status: 'ok', data: { owner: 'admin', name: 'acme-corp' } }),
    );

    const res = await post({ name: 'Acme Corp' }, token);

    expect(res.status).toBe(409);
    expect(calls).not.toContain('add-organization');
  });

  it('an unreachable IAM never writes', async () => {
    const token = await withIam(() => HttpResponse.error() as unknown as HttpResponse);

    const res = await post({ name: 'Acme Corp' }, token);

    expect(calls).not.toContain('add-organization');
    expect(res.status).toBe(502);
  });
});
