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

  /**
   * Regression pinned: a brand APEX is its own origin and no `*.hanzo.ai`
   * pattern reaches it. The chat client is served at `hanzo.chat`
   * (chat.hanzo.ai 308s there) and embeds the widget, so `/v1/me` saw
   * `Origin: https://hanzo.chat` and answered with allow-methods +
   * allow-headers but NO allow-origin — half-configured, which looks
   * configured while the browser still blocks the read, so the chat client
   * could never resolve identity. All three must move together.
   */
  it('a brand apex that serves a browser surface gets all three headers', () => {
    for (const o of ['https://hanzo.chat', 'https://hanzo.team']) {
      const h = corsHeaders(o);
      expect(h['Access-Control-Allow-Origin']).toBe(o);
      expect(h['Access-Control-Allow-Credentials']).toBe('true');
      expect(h['Access-Control-Allow-Methods']).toBeDefined();
      expect(h['Access-Control-Allow-Headers']).toBeDefined();
    }
  });

  /** Credentialed CORS may never be wildcarded — browsers reject `*` + credentials. */
  it('never answers with a wildcard origin', () => {
    for (const o of ['https://hanzo.chat', 'https://hanzo.ai', 'https://evil.com', null]) {
      expect(corsHeaders(o)['Access-Control-Allow-Origin']).not.toBe('*');
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
