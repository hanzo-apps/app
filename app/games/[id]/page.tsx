/**
 * /games/<id> — one open-source game.
 *
 * A SERVER component wrapping the interactive view, and that split exists for
 * one reason: the status code. The view is `'use client'`, so when it met an
 * unknown id it could render "Game not found" but could not answer 404 — the
 * response had already gone out as 200. Measured on prod:
 * `/games/does-not-exist` returned 200 with the generic site title, so a
 * crawler indexed a phantom page and a link checker called the link healthy.
 *
 * `/templates/<slug>` and `/builds/<org>/<project>` already answer properly;
 * these two game routes were the pair that did not. Now all four agree.
 *
 * The catalog is a static file, so the valid ids are known at build time:
 * `generateStaticParams` enumerates them and `dynamicParams = false` makes
 * everything else a real 404 with no runtime check to keep in sync.
 */
import { gamesCatalog } from '@/data/games-catalog';

import { GameDetail } from './view';

export const dynamicParams = false;

export function generateStaticParams() {
  return gamesCatalog.map((g) => ({ id: g.id }));
}

export default function Page() {
  return <GameDetail />;
}
