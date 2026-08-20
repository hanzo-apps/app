import { home } from '../home';
import type { Route } from '../types';

const route = (path: string, file: string): Route => ({ path, file });

describe('home', () => {
  it('opens on the index even when another page sorts ahead of it', () => {
    // The order a filesystem hands back: 404 before about before index.
    expect(
      home([
        route('/404', '/404.html'),
        route('/about', '/about.html'),
        route('/', '/index.html'),
      ]),
    ).toBe('/');
  });

  it('finds the index whether or not the path carries a leading slash', () => {
    expect(home([route('/404', '404.html'), route('index', 'index.html')])).toBe('index');
  });

  it('does not mistake a page that merely ends in index for the index', () => {
    expect(home([route('/reindex', '/reindex.html'), route('/', '/index.html')])).toBe('/');
  });

  it('falls back to the first route when the site has no index', () => {
    expect(home([route('/about', '/about.html'), route('/contact', '/contact.html')])).toBe(
      '/about',
    );
  });

  it('is the root when there are no routes at all', () => {
    expect(home([])).toBe('/');
  });
});
