import type { Route } from './types';

/**
 * Where a site opens.
 *
 * `routes` is the HTML files in the order the filesystem listed them, so the
 * first one is alphabetical rather than meaningful — and `404.html` sorts ahead
 * of `index.html`, which is how a preview of a working site opens on its own
 * Not Found page. The home is the index, wherever it happens to sit.
 */
export function home(routes: Route[]): string {
  const index = routes.find((route) => /(?:^|\/)index\.html$/i.test(route.file));
  return index?.path ?? routes[0]?.path ?? '/';
}
