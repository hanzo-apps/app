/**
 * Presentation helpers for real Hanzo Base project rows on the dashboard.
 *
 * The data plane stores a project as `{ id, user_id, space_id, prompts,
 * created, updated }` where `space_id` is the canonical `namespace/repoId`
 * key. The dashboard needs a human title and a relative timestamp — both
 * derived from those real fields, never fabricated. Pure + framework-free so
 * the mapping is unit-tested.
 */

/** A real Base project row as returned by `listProjects` (lossy-cast upstream). */
export interface BaseProjectRow {
  id?: string;
  _id?: string;
  space_id?: string;
<<<<<<< HEAD
  /** The project's own display name (the cloud projects service carries a real name);
=======
  /** The project's own display name (the cloud projects store carries a real name);
>>>>>>> chore/comment-cleanup-projects
   *  preferred over the de-slugged space_id when present. */
  name?: string;
  prompts?: string[];
  created?: string;
  updated?: string;
  _createdAt?: string;
  _updatedAt?: string;
}

/** The shape the dashboard renders — every field sourced from real data. */
export interface DashboardProject {
  id: string;
  name: string;
  spaceId: string;
  updatedAt: string | null;
}

/** Human title from a `namespace/repoId` space id: the repo id, de-slugged. */
export function projectName(spaceId: string | undefined): string {
  if (!spaceId) return "Untitled project";
  const repo = spaceId.split("/").filter(Boolean).pop() ?? spaceId;
  const pretty = repo
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return pretty || spaceId;
}

export function toDashboardProject(row: BaseProjectRow): DashboardProject {
  const spaceId = row.space_id ?? "";
  return {
    id: row.id ?? row._id ?? spaceId,
    name: row.name?.trim() || projectName(spaceId),
    spaceId,
    updatedAt: row.updated ?? row._updatedAt ?? row.created ?? row._createdAt ?? null,
  };
}

/** Honest relative time. Returns null-safe "—" for missing timestamps. */
export function relativeTime(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "—";
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
