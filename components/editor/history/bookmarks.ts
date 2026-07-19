/**
 * Revision bookmarks — the ONE persistence surface for pinning editor
 * revisions. localStorage-backed and namespaced per project so a bookmark on
 * one project never bleeds into another. Pure storage: callers hand in the
 * project key + a stable revision key; the view layer owns key derivation.
 *
 * Best-effort by design — a full/blocked storage quota degrades to "no
 * bookmarks" rather than throwing into the render path.
 */

const NAMESPACE = "hanzo.dev.history.bookmarks";

/** Storage key for a project's bookmark set (empty project → shared "local"). */
export function bookmarkStorageKey(project: string): string {
  return `${NAMESPACE}:${project || "local"}`;
}

/** Read the persisted bookmark set for a project. Never throws. */
export function readBookmarks(project: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(bookmarkStorageKey(project));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((x): x is string => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Persist a bookmark set for a project (the localStorage fallback layer). Used to
 * MIRROR the durable Base set locally so a subsequent offline open is correct.
 * Never throws.
 */
export function saveBookmarks(project: string, ids: Set<string>): void {
  writeBookmarks(project, ids);
}

/** Persist a bookmark set for a project. Never throws. */
function writeBookmarks(project: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      bookmarkStorageKey(project),
      JSON.stringify(Array.from(ids)),
    );
  } catch {
    /* storage full / unavailable — bookmarks are a convenience, not truth */
  }
}

/**
 * Toggle a revision's bookmark and persist. Returns the NEW set so the caller
 * can drop it straight into state (immutable update, no stale-read races).
 */
export function toggleBookmark(project: string, revisionKey: string): Set<string> {
  const next = readBookmarks(project);
  if (next.has(revisionKey)) {
    next.delete(revisionKey);
  } else {
    next.add(revisionKey);
  }
  writeBookmarks(project, next);
  return next;
}
