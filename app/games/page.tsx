import { redirect } from 'next/navigation';

/**
 * /games → /resources?category=Games
 *
 * `lib/resources-catalog` already folds games into the resources gallery as a
 * CATEGORY — its own header says "games are a CATEGORY here, not a top-level
 * surface" — and then this top-level surface stayed anyway. The merge happened;
 * the removal did not.
 *
 * Only the index moves: /games/<id> and /games/<id>/play are the actual games and
 * keep their URLs.
 */
export default function GamesIndex() {
  redirect('/resources?category=Games');
}
