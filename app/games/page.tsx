import { redirect } from 'next/navigation';

/**
 * /games → /templates?category=Games
 *
 * `lib/resources-catalog` already folds games into the gallery as a CATEGORY —
 * its own header says "games are a CATEGORY here, not a top-level surface" —
 * and then this top-level surface stayed anyway. The merge happened; the
 * removal did not.
 *
 * The target is /templates DIRECTLY: bouncing through /resources dropped the
 * query (that redirect carries no params), which landed every visitor on the
 * unfiltered gallery.
 *
 * Only the index moves: /games/<id> and /games/<id>/play are the actual games and
 * keep their URLs.
 */
export default function GamesIndex() {
  redirect('/templates?category=Games');
}
