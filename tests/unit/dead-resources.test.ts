/**
 * A generated page that loads a local script it never wrote is dead on arrival:
 * the file 404s and every reference to what it defined throws "Can't find
 * variable". This catches it — the script/style twin of the dead-link check.
 */
import { deadResources } from '@/lib/pages/resources';
import type { Page } from '@/types';

const page = (path: string, html: string): Page => ({ path, html } as Page);

describe('deadResources', () => {
  it('flags a local script that is not a project file — the reported crash', () => {
    const pages = [page('index.html', '<script src="app.js"></script><script>LuxQuest.init()</script>')];
    const dead = deadResources(pages);
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({ ref: 'app.js', kind: 'script' });
  });

  it('flags a missing local stylesheet', () => {
    const pages = [page('index.html', '<link rel="stylesheet" href="styles.css">')];
    expect(deadResources(pages)[0].kind).toBe('stylesheet');
  });

  it('accepts a local file that IS a project page', () => {
    const pages = [
      page('index.html', '<script src="app.js"></script>'),
      page('app.js', 'window.LuxQuest = {}'),
    ];
    expect(deadResources(pages)).toEqual([]);
  });

  it('is silent about CDN and inline scripts', () => {
    const pages = [
      page(
        'index.html',
        '<script src="https://cdn.tailwindcss.com"></script>' +
          '<script src="//unpkg.com/x"></script>' +
          '<script>const x = 1</script>',
      ),
    ];
    expect(deadResources(pages)).toEqual([]);
  });

  it('does not flag a preconnect or icon link', () => {
    const pages = [page('index.html', '<link rel="preconnect" href="/fonts"><link rel="icon" href="/favicon.ico">')];
    expect(deadResources(pages)).toEqual([]);
  });

  it('resolves ./ and / prefixes and query strings', () => {
    const pages = [
      page('index.html', '<script src="./app.js?v=2"></script>'),
      page('app.js', ''),
    ];
    expect(deadResources(pages)).toEqual([]);
  });
});
