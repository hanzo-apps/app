/**
 * Opening a template vs. recreating one — the distinction the builder lost.
 *
 * `fetchTemplatePages` asks the BFF for a template's real source and returns null
 * when there is none. That null is not a failure to be smoothed over: it is the
 * signal that the builder is about to WRITE a template rather than OPEN one, and
 * the one thing it must not do is let those two look the same to the user.
 *
 * `templateBrief` and `buildTemplateSeedPrompt` are the two prompts for those two
 * situations. Handing the model the wrong one is how "edit Savor" turned into
 * "invent something Savor-ish", so these assert they stay recognisably different.
 */
import {
  buildTemplateSeedPrompt,
  fetchTemplatePages,
  templateBrief,
  titleize,
  type TemplateSeedMeta,
} from '@/lib/api/templates';

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

function respond(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

const META: TemplateSeedMeta = {
  slug: 'savor',
  displayName: 'Savor',
  description: 'Food-delivery storefront.',
  category: 'E-commerce',
  framework: 'Next.js 14.2 + TS',
  features: ['Food', 'Delivery'],
  useCase: 'Food delivery apps',
  screenshotUrl: 'https://gallery.hanzo.ai/screenshots/savor.png',
};

describe('fetchTemplatePages', () => {
  it('asks the source endpoint, not the one that may answer with a screenshot', async () => {
    respond(200, { pages: [{ path: 'index.html', html: '<html><body>real</body></html>' }] });

    await fetchTemplatePages('metrics');

    expect(global.fetch).toHaveBeenCalledWith(
      '/v1/templates/metrics/pages',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('returns the template pages when there are some', async () => {
    respond(200, { pages: [{ path: 'index.html', html: '<html><body>real</body></html>' }] });

    const pages = await fetchTemplatePages('metrics');

    expect(pages).toEqual([{ path: 'index.html', html: '<html><body>real</body></html>' }]);
  });

  it('reports no source as null, so the caller must decide out loud', async () => {
    respond(404, { error: 'no source for slug' });

    expect(await fetchTemplatePages('savor')).toBeNull();
  });

  it('drops empty pages rather than opening a blank editor as if it were the template', async () => {
    respond(200, { pages: [{ path: 'index.html', html: '   ' }] });

    expect(await fetchTemplatePages('savor')).toBeNull();
  });

  it('ignores malformed rows', async () => {
    respond(200, { pages: [null, { path: 'a.html' }, { html: '<html></html>' }, 7] });

    expect(await fetchTemplatePages('savor')).toBeNull();
  });

  it('survives an unreachable BFF', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch;

    await expect(fetchTemplatePages('savor')).resolves.toBeNull();
  });

  it('never asks for an empty slug', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    expect(await fetchTemplatePages('  ')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('templateBrief', () => {
  it('describes the template concretely from its catalog entry', () => {
    const brief = templateBrief(META, 'savor');

    expect(brief).toContain('Savor');
    expect(brief).toContain('E-commerce');
    expect(brief).toContain('Food-delivery storefront.');
    expect(brief).toContain('Food delivery apps');
  });

  it('still names the template when the catalog says nothing', () => {
    expect(templateBrief(null, 'hidden-oasis')).toContain('Hidden Oasis');
  });

  it('cannot be mistaken for the prompt used when a template really is loaded', () => {
    const recreate = templateBrief(META, 'savor');
    const onTopOf = buildTemplateSeedPrompt(META, 'savor', 'edit');

    // The seed prompt asserts the template is already there; the brief must not,
    // because when it is used the template is precisely what is missing.
    expect(onTopOf).toMatch(/already built and running/i);
    expect(recreate).not.toMatch(/already built and running/i);
    expect(recreate).toMatch(/^Build /);
  });
});

describe('titleize', () => {
  it('makes a human title out of a slug', () => {
    expect(titleize('hidden-oasis')).toBe('Hidden Oasis');
    expect(titleize('hanzo-apps/savor')).toBe('Hanzo Apps Savor');
  });
});
