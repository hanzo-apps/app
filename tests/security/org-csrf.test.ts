/**
 * CSRF guard (sameOriginOK) — the same-origin check on the cookie-authenticated
 * org BFFs (/v1/publish, /onboard, /v1/projects, /v1/generate). Mirrors console2's
 * bearer-proxy CSRF suite. PURE — no transport.
 */
import { sameOriginOK, type OriginSignals } from '@/lib/org/csrf';

const HOST = 'hanzo.app';
const sig = (o: Partial<OriginSignals> = {}): OriginSignals => ({
  host: HOST,
  origin: null,
  referer: null,
  secFetchSite: null,
  ...o,
});

describe('sameOriginOK', () => {
  it('never gates safe methods (GET/HEAD/OPTIONS)', () => {
    for (const m of ['GET', 'HEAD', 'OPTIONS', 'get']) {
      expect(sameOriginOK(m, sig({ origin: 'https://evil.example', secFetchSite: 'cross-site' }))).toBe(true);
    }
  });

  it('allows a same-origin mutating request (Origin host == Host)', () => {
    expect(sameOriginOK('POST', sig({ origin: `https://${HOST}` }))).toBe(true);
    expect(sameOriginOK('DELETE', sig({ origin: `https://${HOST}` }))).toBe(true);
    // Explicit non-default port must match on both sides.
    expect(sameOriginOK('POST', sig({ origin: 'https://hanzo.app:8443', host: 'hanzo.app:8443' }))).toBe(true);
  });

  it('refuses an explicit cross-site fetch (Sec-Fetch-Site, unforgeable)', () => {
    expect(sameOriginOK('POST', sig({ origin: `https://${HOST}`, secFetchSite: 'cross-site' }))).toBe(false);
  });

  it('refuses a cross-origin Origin host', () => {
    expect(sameOriginOK('POST', sig({ origin: 'https://evil.example' }))).toBe(false);
    // suffix / lookalike hosts must NOT match
    expect(sameOriginOK('POST', sig({ origin: 'https://hanzo.app.evil.com' }))).toBe(false);
    expect(sameOriginOK('POST', sig({ origin: 'https://nothanzo.app' }))).toBe(false);
  });

  it('falls back to Referer host when Origin is absent', () => {
    expect(sameOriginOK('POST', sig({ referer: `https://${HOST}/dev` }))).toBe(true);
    expect(sameOriginOK('POST', sig({ referer: 'https://evil.example/x' }))).toBe(false);
  });

  it('allows a no-Origin/no-Referer request only when Sec-Fetch-Site affirms same-origin', () => {
    expect(sameOriginOK('POST', sig({ secFetchSite: 'same-origin' }))).toBe(true);
    // No signal at all → refuse a mutating request (fail closed).
    expect(sameOriginOK('POST', sig())).toBe(false);
  });

  it('refuses a mutating request with no Host to compare against', () => {
    expect(sameOriginOK('POST', sig({ host: '', origin: 'https://hanzo.app' }))).toBe(false);
  });
});
