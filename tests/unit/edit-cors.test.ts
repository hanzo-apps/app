import { corsHeaders, isAllowedOrigin, isTenantOrigin } from '@/lib/edit/cors';

/**
 * Widget CORS — who may read a CREDENTIALED response from /v1/me, /v1/suggest
 * and /v1/edit.
 *
 * Regression pinned (swarm audit, 2026-07-25): `hanzo.app` was suffix-matched,
 * and `<slug>.hanzo.app` is the ONE serve for user-published sites — so every
 * tenant site was a credentialed, readable origin against /v1/edit. A superadmin
 * visiting any published site handed that site's JS their first-party cookie and
 * the ability to read the reply. Tenant subdomains are attacker-authored: they
 * are never us.
 */
describe('isTenantOrigin — user-published namespaces', () => {
  it('a published site is tenant content', () => {
    expect(isTenantOrigin('acme.hanzo.app')).toBe(true);
    expect(isTenantOrigin('anything.deep.hanzo.app')).toBe(true);
  });

  it('the apex itself is ours, not tenant content', () => {
    expect(isTenantOrigin('hanzo.app')).toBe(false);
  });
});

describe('isAllowedOrigin — credentialed reads', () => {
  it('NO published tenant site is ever credentialed', () => {
    for (const o of [
      'https://acme.hanzo.app',
      'https://evil.hanzo.app',
      'https://a.b.hanzo.app',
    ]) {
      expect(isAllowedOrigin(o)).toBe(false);
      expect(corsHeaders(o)['Access-Control-Allow-Credentials']).toBeUndefined();
      expect(corsHeaders(o)['Access-Control-Allow-Origin']).toBeUndefined();
    }
  });

  it('first-party Hanzo surfaces still are', () => {
    for (const o of [
      'https://hanzo.app',
      'https://hanzo.ai',
      'https://docs.hanzo.ai',
      'https://hanzo.id',
      'https://lux.network',
    ]) {
      expect(isAllowedOrigin(o)).toBe(true);
      expect(corsHeaders(o)['Access-Control-Allow-Credentials']).toBe('true');
    }
  });

  it('an unrelated or malformed origin is refused', () => {
    expect(isAllowedOrigin('https://evil.com')).toBe(false);
    expect(isAllowedOrigin('https://nothanzo.ai')).toBe(false);
    expect(isAllowedOrigin('https://hanzo.ai.evil.com')).toBe(false);
    expect(isAllowedOrigin('not-a-url')).toBe(false);
    expect(isAllowedOrigin(null)).toBe(false);
  });
});
