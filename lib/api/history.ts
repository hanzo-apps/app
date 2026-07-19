/**
 * Client for the per-app version-history store (`/v1/apps/:slug/history`).
 *
 * The durable primary is Hanzo Base (per user + app); these helpers resolve
 * (never throw) so the History panel can fall back to localStorage whenever the
 * store is unconfigured/unreachable (`durable:false`). Same-origin so the httpOnly
 * `hanzo_token` cookie rides automatically.
 */

/** A persisted revision row (rich metadata for the timeline). */
export interface RevisionRecord {
  revKey: string;
  kind: 'commit' | 'edit' | 'checkpoint';
  title: string;
  at: number;
  sha?: string;
  author?: string;
  url?: string;
  model?: string;
  filesChanged?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface AppHistory {
  durable: boolean;
  bookmarks: string[];
  revisions: RevisionRecord[];
}

function base(slug: string): string {
  return `/v1/apps/${encodeURIComponent(slug)}/history`;
}

/** Load the durable bookmarks + revisions for an app. `durable:false` ⇒ fall back. */
export async function fetchAppHistory(slug: string): Promise<AppHistory> {
  if (!slug || slug === 'local') return { durable: false, bookmarks: [], revisions: [] };
  try {
    const res = await fetch(base(slug), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const body = (await res.json().catch(() => ({}))) as Partial<AppHistory>;
    return {
      durable: Boolean(body.durable),
      bookmarks: Array.isArray(body.bookmarks) ? body.bookmarks : [],
      revisions: Array.isArray(body.revisions) ? body.revisions : [],
    };
  } catch {
    return { durable: false, bookmarks: [], revisions: [] };
  }
}

/** Toggle a bookmark durably; returns the new key set, or null when not durable. */
export async function putBookmarkToggle(
  slug: string,
  key: string,
  orgHeader?: string,
): Promise<string[] | null> {
  if (!slug || slug === 'local') return null;
  try {
    const res = await fetch(base(slug), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(orgHeader ? { 'X-Org-Id': orgHeader } : {}),
      },
      body: JSON.stringify({ bookmark: key }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { durable?: boolean; bookmarks?: string[] };
    return body.durable && Array.isArray(body.bookmarks) ? body.bookmarks : null;
  } catch {
    return null;
  }
}

/** Persist (upsert) one revision's metadata. Best-effort; resolves false when not durable. */
export async function postRevision(
  slug: string,
  revision: RevisionRecord,
  orgHeader?: string,
): Promise<boolean> {
  if (!slug || slug === 'local') return false;
  try {
    const res = await fetch(base(slug), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(orgHeader ? { 'X-Org-Id': orgHeader } : {}),
      },
      body: JSON.stringify({ revision }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { durable?: boolean };
    return Boolean(body.durable);
  } catch {
    return false;
  }
}
