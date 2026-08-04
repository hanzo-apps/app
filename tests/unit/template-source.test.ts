/**
 * lib/template-source — "what is this template's source?", which is the question
 * the builder has to answer before it can decide whether it is OPENING a template
 * or WRITING one.
 *
 * The bug these tests exist to prevent: this question used to be answered with the
 * template's screenshot wrapped in an `<img>`, 200 and all. Nothing in the response
 * distinguished a photograph from source, so the builder either edited an image tag
 * or — as it eventually did — gave up on loading templates entirely and generated
 * an imitation from each template's description, presenting the result as the
 * template.
 *
 * So the invariant under test is a refusal: this resolver returns real markup or
 * null, and never something that merely looks like an answer.
 */
import { templatePages } from '@/lib/template-source';

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

/** Stand in for a host, so no test reaches the network. */
function serve(status: number, body: string, contentType = 'text/html') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    headers: new Map([['content-type', contentType]]),
  }) as unknown as typeof fetch;
}

describe('templatePages', () => {
  it('returns the document we ship for a slug, without touching the network', async () => {
    global.fetch = jest.fn(() => {
      throw new Error('shipped source must not require a fetch');
    }) as unknown as typeof fetch;

    const pages = await templatePages('metrics');

    expect(pages).not.toBeNull();
    expect(pages).toHaveLength(1);
    expect(pages![0].path).toBe('index.html');
    expect(pages![0].html).toMatch(/^<!DOCTYPE html>/i);
    // Real, editable markup — not a picture of a dashboard.
    expect(pages![0].html).not.toMatch(/<img[^>]+screenshots/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is insensitive to slug casing and padding, like the registry it reads', async () => {
    expect(await templatePages('  Metrics  ')).not.toBeNull();
  });

  it('returns null for a slug that publishes nothing, rather than guessing', async () => {
    global.fetch = jest.fn(() => {
      throw new Error('a slug with no demo must not be fetched for');
    }) as unknown as typeof fetch;

    // In the catalog, deliberately excluded from the verified-demo set.
    expect(await templatePages('savor')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads a template from its own deployed site', async () => {
    serve(200, '<!doctype html><html><head><title>Blocks</title></head><body>real</body></html>');

    const pages = await templatePages('blocks');

    expect(pages).not.toBeNull();
    expect(pages![0].html).toContain('real');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://blocks.hanzo.app/',
      expect.objectContaining({ headers: { Accept: 'text/html' } }),
    );
  });

  it('anchors a fetched page so its relative assets still resolve', async () => {
    serve(
      200,
      '<!doctype html><html><head><link rel="stylesheet" href="css/main.css"></head><body></body></html>',
    );

    const pages = await templatePages('blocks');

    // Lifted out of its origin, `css/main.css` would resolve against the builder
    // and the real page would render unstyled — which reads as broken, not real.
    expect(pages![0].html).toContain('<base href="https://blocks.hanzo.app/">');
  });

  it('leaves a document that already declares its own base alone', async () => {
    serve(
      200,
      '<!doctype html><html><head><base href="https://elsewhere.example/"></head><body></body></html>',
    );

    const pages = await templatePages('blocks');

    expect(pages![0].html).toContain('https://elsewhere.example/');
    expect(pages![0].html).not.toContain('blocks.hanzo.app/">');
  });

  it('treats a wiped deployment as no source, never as an empty template', async () => {
    // Every `<slug>.hanzo.app` template demo currently answers exactly like this.
    serve(404, '<!doctype html><html><head><title>Not Found</title></head><body>site not found</body></html>');

    expect(await templatePages('blocks')).toBeNull();
  });

  it('refuses a 200 that is not a document', async () => {
    serve(200, '{"error":"nope"}', 'application/json');

    expect(await templatePages('blocks')).toBeNull();
  });

  it('refuses an unreachable host rather than throwing at the caller', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    await expect(templatePages('blocks')).resolves.toBeNull();
  });

  it('has nothing to say about an empty slug', async () => {
    expect(await templatePages('')).toBeNull();
    expect(await templatePages('   ')).toBeNull();
  });
});
