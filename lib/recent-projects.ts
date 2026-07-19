/**
 * Recently-opened project tracking — a real, local signal.
 *
 * We have no server-side "last viewed" telemetry, so "Recently viewed" and the
 * ⌘K palette's recent list are driven by a genuine client signal: every time the
 * user opens a project (a card, a palette entry, a sidebar recent) we stamp its
 * id with `Date.now()` here. Reads return ids newest-first. This is honest — it
 * reflects what THIS browser actually opened, never a fabricated ranking.
 *
 * One small localStorage map (`hanzo-app-recent-projects`: id → epoch-ms),
 * capped so it can't grow unbounded. Framework-free + SSR-safe (no-ops without
 * `window`) so it composes anywhere.
 */

const KEY = 'hanzo-app-recent-projects';
const CAP = 50;

type RecentMap = Record<string, number>;

function read(): RecentMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as RecentMap;
  } catch {
    return {};
  }
}

function write(map: RecentMap): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep only the most recent CAP entries so the map stays bounded.
    const trimmed = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, CAP);
    window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // Storage may be full/unavailable — recents are best-effort, never fatal.
  }
}

/** Record that a project was just opened (id = slug or record id). */
export function markProjectOpened(id: string): void {
  if (!id) return;
  const map = read();
  map[id] = Date.now();
  write(map);
}

/** The recorded open time (epoch ms) for a project, or 0 if never opened here. */
export function lastOpenedAt(id: string): number {
  return read()[id] ?? 0;
}

/** Project ids this browser has opened, newest-first. */
export function recentProjectIds(): string[] {
  return Object.entries(read())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/**
 * Order a list of items by how recently they were opened here (newest-first),
 * dropping those never opened. Pure — the caller supplies the id accessor.
 */
export function orderByRecentlyOpened<T>(items: T[], idOf: (item: T) => string): T[] {
  const map = read();
  return items
    .map((item) => ({ item, at: map[idOf(item)] ?? 0 }))
    .filter((x) => x.at > 0)
    .sort((a, b) => b.at - a.at)
    .map((x) => x.item);
}
