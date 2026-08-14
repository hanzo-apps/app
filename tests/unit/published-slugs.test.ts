import { fetchPublishedSlugs } from '@/lib/api/templates';

/**
 * `fetchPublishedSlugs` — which templates the platform can actually open.
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
 *
 * It reads through `fetchGalleryTemplates` rather than asking the warehouse
 * itself, so what counts as servable is defined ONCE — including the part that
 * is easy to miss: a row with no `source` cannot seed the builder, so it is not
 * servable however valid its slug looks.
 */
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

/** A row shaped the way api.hanzo.ai actually sends one. */
const row = (slug: string, over: Record<string, unknown> = {}) => ({
  slug,
  title: slug[0].toUpperCase() + slug.slice(1),
  source: `https://github.com/hanzo-apps/template-${slug}`,
  category: 'AI/SaaS',
  framework: 'Next.js 14.2 + TS',
  preview: `https://gallery.hanzo.ai/screenshots/${slug}.png`,
  ...over,
});

describe('reading the warehouse', () => {
  it('takes slugs from the envelope cloud actually sends', async () => {
    serve(200, { data: [row('synapse'), row('cipher')] });
    expect([...(await fetchPublishedSlugs())].sort()).toEqual(['cipher', 'synapse']);
  });

  it('does not count a row that cannot seed the builder', async () => {
    // No `source` means there is nothing to fork, so the card would fail at the
    // moment it matters. Counting it as servable is precisely the promise this
    // whole mechanism exists to stop making.
    serve(200, { data: [row('good'), { slug: 'sourceless', title: 'Sourceless' }] });
    expect(await fetchPublishedSlugs()).toEqual(new Set(['good']));
  });
});

describe('failing open — the reason this returns a Set', () => {
  it('is empty when the warehouse refuses', async () => {
    serve(503, { data: [row('synapse')] });
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

  it('is empty when the answer is the local fallback, not the warehouse', async () => {
    // `fetchGalleryTemplates` substitutes a bundled list and reports live:false.
    // Those slugs are real templates but they are NOT evidence about what cloud
    // can serve, so treating them as such would mark the wrong cards.
    serve(200, { data: [] });
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
