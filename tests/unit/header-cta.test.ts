import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * This header carries no primary action, and it has to say so.
 *
 * `@hanzogui/shell`'s registry describes hanzo.app from the OUTSIDE, so its
 * `primaryCTA` href is `U.app` — this site's own root. Everywhere else that is a
 * link TO the builder; here it is a self-link, so the most action-oriented
 * control on the page reloaded the marketing page. Inheriting it is the failure
 * this asserts against, and passing `undefined` is what refuses it: creating
 * lives in the page and in the account menu.
 */
const header = readFileSync(join(process.cwd(), 'components/layout/header.tsx'), 'utf8');
const surface = header.match(/surface=\{\{[^}]*\}\}/)?.[0] ?? '';

describe('header primary CTA', () => {
  it('is overridden rather than inherited from the shared registry', () => {
    expect(surface).toMatch(/primaryCTA/);
  });

  it('is none — a header with no primary action renders none', () => {
    expect(surface).toMatch(/primaryCTA:\s*undefined/);
  });

  it('links nowhere by absolute URL, which is how the self-link looked', () => {
    expect(header).not.toMatch(/href:\s*"https:\/\/hanzo\.app"/);
  });
});
