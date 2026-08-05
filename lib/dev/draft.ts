/**
 * Which project a builder session is working on.
 *
 * An open project answers this itself. A FRESH `/dev` session does not: it has
 * no org/project in its URL and no project prop, so until it is published there
 * is nothing naming it — which is why attaching an image used to be refused
 * until you published. But a draft is a project that has not been published
 * yet, not a different kind of thing, so it gets a key like any other and the
 * refusal disappears.
 *
 * Minted ONCE per browser and remembered, so every upload in the session lands
 * in one place and still finds them after a reload. The images themselves are
 * addressed by their own durable URLs, so a draft that later publishes under a
 * real slug keeps every picture it collected.
 */
import { currentOrg } from '@/lib/org-scope';

const KEY = 'hanzo.draft';

/** Short, unguessable, and stable once written. */
function mint(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** This browser's draft key, creating it the first time it is needed. */
function id(): string {
  try {
    const seen = window.localStorage.getItem(KEY);
    if (seen) return seen;
    const made = mint();
    window.localStorage.setItem(KEY, made);
    return made;
  } catch {
    // Storage blocked (private mode): a per-call key still uploads, it just
    // does not group with the session's earlier images.
    return mint();
  }
}

/**
 * The project key to store this session's images under: the open project's own,
 * else this browser's draft. Empty only when there is no org yet to scope it to,
 * which is the one case there is genuinely nowhere to put them.
 */
export function space(projectSpaceId?: string | null): string {
  const open = (projectSpaceId ?? '').trim();
  if (open) return open;
  if (typeof window === 'undefined') return '';
  const org = currentOrg().trim();
  return org ? `${org}/draft-${id()}` : '';
}
