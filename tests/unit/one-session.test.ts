/**
 * @jest-environment node
 *
 * The session cookie is a projection of the token, not a session of its own —
 * and nothing in the tree holds a second one.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { SignJWT } from 'jose';
import { SESSION_COOKIE } from '@hanzo/iam/server';

import { cookieMaxAge } from '@/components/providers/IamClientProvider';

const ROOT = path.resolve(__dirname, '../..');

async function tokenExpiringIn(seconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + seconds)
    .sign(new TextEncoder().encode('irrelevant-the-server-verifies-properly'));
}

describe('the cookie cannot outlive the token it carries', () => {
  it('takes the token’s own remaining lifetime', async () => {
    const age = cookieMaxAge(await tokenExpiringIn(3600));
    expect(age).toBeGreaterThan(3590);
    expect(age).toBeLessThanOrEqual(3600);
  });

  it('is already dead for an expired token', async () => {
    expect(cookieMaxAge(await tokenExpiringIn(-60))).toBe(0);
  });

  it('refuses to persist something it cannot date', () => {
    expect(cookieMaxAge('not-a-jwt')).toBe(0);
    expect(cookieMaxAge('')).toBe(0);
  });

  it('is the SDK’s canonical name, not one the app made up', () => {
    expect(SESSION_COOKIE).toBe('hanzo_iam_access_token');
  });
});

describe('there is no second session left to find', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f) && !f.startsWith('tests/'));

  const hits = (needle: string) =>
    tracked.filter((f) => {
      const p = path.join(ROOT, f);
      return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(needle);
    });

  it.each([
    ['hanzo_token', 'the app-named mirror cookie'],
    ['osw_session', 'the self-issued HS256 session'],
    ['SESSION_SECRET', 'the secret that signed it'],
    ['getUserSession', 'the userinfo-per-call reader'],
    ['MY_TOKEN_KEY', 'the cookie-name indirection'],
    ['readWidgetBearer', 'the second bearer reader'],
    ['decodeOwner', 'trusting an unverified decode'],
  ])('%s is gone (%s)', (needle) => {
    expect(hits(needle)).toEqual([]);
  });

  it('only lib/iam.ts decides who a caller is', () => {
    // `validateToken` is the verification primitive; exactly one module may call it.
    expect(hits('@hanzo/iam/auth')).toEqual(['lib/iam.ts']);
  });

  it('no module re-implements a userinfo round-trip for identity', () => {
    expect(hits('OIDC_PATHS.userinfo')).toEqual([]);
  });
});
