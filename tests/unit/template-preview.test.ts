import { readFileSync } from 'node:fs';

import { join } from 'node:path';


import { stripComments } from '../source';

const root = join(__dirname, '..', '..');

/** A file with its comments removed. The rule is about what the code DOES, and
 *  the comment explaining a fix necessarily NAMES the thing it stopped using —
 *  read whole, every file convicts itself of its own explanation. The ordering
 *  law this discovered now lives with the function. */
const code = (p: string) => stripComments(readFileSync(join(root, p), 'utf8'));

/** Every surface that draws a picture of a template. */
const SURFACES = [
  'app/page.tsx',
  'app/templates/page.tsx',
  'components/template-gallery.tsx',
  'components/remix/template-preview-modal.tsx',
];

/**
 * The shape this pins is silent: a preview that points at a host we do not own
 * renders an empty box, and nothing else notices. The page returns 200, the
 * build is green, the types are fine, and every card on it is a hole with its
 * alt text showing through. Measured on /templates while it was live: 0 of 66
 * images loaded, 48 confirmed broken, 94 cards.
 */
describe('a template preview comes from us', () => {
  it('draws every one through TemplateThumb', () => {
    // One component decides picture-or-drawing, so a slug with no captured shot
    // falls to the schematic instead of to nothing. A surface that reaches past
    // it has opted out of that fallback.
    const missing = SURFACES.filter(
      (f) => !code(f).includes('@/components/template-thumb'),
    );
    expect(missing).toEqual([]);
  });

  it('never points one at the gallery host', () => {
    // `screenshotUrl` is a field of the upstream catalog record — foreign data,
    // fine to carry. Reading it to render is what put gallery.hanzo.ai in front
    // of every visitor. The shots we own are in public/templates.
    const guilty = [...SURFACES, 'lib/resources-catalog.ts'].filter((f) =>
      /screenshotUrl|gallery\.hanzo\.ai\/screenshots/.test(code(f)),
    );
    expect(guilty).toEqual([]);
  });
});
