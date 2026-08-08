/**
 * `fetchPublishedSlugs` — which templates the platform actually publishes
 * source for.
 *
 * Two catalogs answer about templates and they disagree: `/v1/gallery` shows 72,
 * `/v1/templates` can serve 63, and only 29 are in both (measured 2026-08-08).
 * The gallery uses this to stop promising a design it will not deliver.
 *
 * The invariant is the FAILURE mode, not the success one. This decides whether a
 * card says "rebuilt from its description", so a wrong answer libels a perfectly
 * good template — and the wrong answer is the easy one to write, because every
 * error path naturally produces "no slugs", which reads as "none of them publish
 * source". Hence: an empty Set means "I do not know", and the caller draws
 * nothing. It must never be reachable to conclude "none".
 */
import { fetchPublishedSlugs } from '@/lib/api/templates';

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

function serve(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('reading the warehouse', () => {
  it('takes slugs from the envelope cloud actually sends', async () => {
    // Measured against api.hanzo.ai: `{"data":[{"slug":"synapse",…}]}`.
    serve(200, { data: [{ slug: 'synapse' }, { slug: 'cipher' }] });
    expect([...(await fetchPublishedSlugs())].sort()).toEqual(['cipher', 'synapse']);
  });

  it('also reads a `templates` envelope', async () => {
    serve(200, { templates: [{ slug: 'kalli' }] });
    expect(await fetchPublishedSlugs()).toEqual(new Set(['kalli']));
  });

  it('drops rows with no usable slug rather than storing junk', async () => {
    serve(200, { data: [{ slug: 'ok' }, { slug: '' }, { slug: 7 }, null, 'nope', {}] });
    expect(await fetchPublishedSlugs()).toEqual(new Set(['ok']));
  });
});

describe('failing open — the reason this returns a Set', () => {
  it('is empty when the warehouse refuses', async () => {
    serve(503, { data: [{ slug: 'synapse' }] });
    expect(await fetchPublishedSlugs()).toEqual(new Set());
  });

  it('is empty when the request throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await fetchPublishedSlugs()).toEqual(new Set());
  });

  it('is empty when the body is not what we expect', async () => {
    serve(200, { unexpected: true });
    expect(await fetchPublishedSlugs()).toEqual(new Set());
  });

  it('never throws — a gallery must render without this answer', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('not json');
      },
    });
    await expect(fetchPublishedSlugs()).resolves.toEqual(new Set());
  });
});
