import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LIBS, ORIGIN, rewrite, thirdParty, url } from '@/lib/vendor';

const root = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/**
 * Every file that tells a model, or a template, what a generated site should
 * load. If one of these names a host we do not own, sites built here fetch code
 * from that host on every page view — which is the thing this whole module
 * exists to stop, so the list is checked rather than trusted.
 */
const GENERATES = [
  'lib/prompts.ts',
  'lib/project-templates.ts',
  'lib/llm/prompts/react.ts',
  'lib/llm/prompts/preact.ts',
  'lib/llm/prompts/svelte.ts',
  'lib/llm/prompts/vue.ts',
  'lib/vfs/skills/built-in/one-shot.ts',
  'lib/vfs/skills/built-in/planning.ts',
  'lib/vfs/templates/vibe-check.ts',
];

describe('a generated site loads code from us, and from nobody else', () => {
  it('names no third-party host in anything that generates a site', () => {
    const guilty = GENERATES.map((f) => [f, thirdParty(read(f))] as const).filter(
      ([, hits]) => hits.length,
    );
    // Name the file AND the URL: "some file has a CDN" sends the next person
    // grepping nine files by hand.
    expect(guilty.map(([f, hits]) => `${f}: ${hits.join(', ')}`)).toEqual([]);
  });

  it('does not let the policy allow one either', () => {
    // The prompts and the policy have to agree. They did not for a long time in
    // the other direction — the policy permitted four CDNs because the prompts
    // used them — and a policy that still allows a host nothing asks for is an
    // open door nobody is watching.
    const csp = read('lib/security/middleware.ts');
    const inPolicy = csp.slice(csp.indexOf('const CDN'), csp.indexOf('export'));
    expect(thirdParty(inPolicy)).toEqual([]);
    expect(inPolicy).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  it('serves every library from ONE origin', () => {
    const origins = Object.keys(LIBS).map((k) => new URL(url(k as keyof typeof LIBS)).origin);
    expect([...new Set(origins)]).toEqual([new URL(ORIGIN).origin]);
  });
});

describe('documents saved before we hosted these still render', () => {
  // Removing the CDNs from the prompts fixes what we generate NEXT. Every
  // project already stored names those hosts literally, and its preview
  // inherits an app policy that no longer allows them — so without the rewrite
  // a site that worked yesterday previews as unstyled markup.
  const legacy = [
    ['https://cdn.tailwindcss.com', url('tailwind')],
    ['https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js', url('feather')],
    ['https://cdn.jsdelivr.net/npm/animejs/lib/anime.iife.min.js', url('anime')],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', url('leaflet')],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', url('leafletCss')],
  ] as const;

  it.each(legacy)('points %s at our copy', (from, to) => {
    const out = rewrite(`<script src="${from}"></script>`);
    expect(out).toContain(to);
    expect(thirdParty(out)).toEqual([]);
  });

  it('is idempotent, because it runs on every preview frame', () => {
    const once = rewrite('<script src="https://cdn.tailwindcss.com"></script>');
    expect(rewrite(once)).toBe(once);
  });

  it('leaves a document that names nobody alone', () => {
    const plain = '<html><body><h1>hi</h1></body></html>';
    expect(rewrite(plain)).toBe(plain);
  });

  it('rewrites a whole document, not just the first match', () => {
    // Two libraries in one head is the ordinary case, and `replace` without the
    // global flag would silently fix only the first — leaving the second
    // refused by the policy and the page half-styled.
    const doc = `<script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>`;
    expect(thirdParty(rewrite(doc))).toEqual([]);
  });
});

describe('the preview frame applies it', () => {
  it('rewrites on the way into the frame', () => {
    // The frame is where the policy bites, so the rewrite has to happen there
    // and not only at save time — that is what heals already-saved projects.
    expect(read('components/editor/preview/bridge.ts')).toMatch(/rewrite\(html\)/);
  });
});
