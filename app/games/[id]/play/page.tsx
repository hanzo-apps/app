/**
 * /games/<id>/play — the playable build, when there is one.
 *
 * Server gate over a client view, for the status code — same reason as the
 * detail page beside it.
 *
 * `generateStaticParams` enumerates EVERY game, not only the playable ones,
 * and that distinction is the point. An unknown id is not a page and answers
 * 404. A real game with no build yet IS a page: the view says so and offers the
 * way back, which is a better answer than a 404 for something that exists and
 * will work later.
 */
import { gamesCatalog } from '@/data/games-catalog';

import { GamePlay } from './view';

export const dynamicParams = false;

export function generateStaticParams() {
  return gamesCatalog.map((g) => ({ id: g.id }));
}

export default function Page() {
  return <GamePlay />;
}
