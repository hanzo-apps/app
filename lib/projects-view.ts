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
  /** The project's own display name (the cloud projects service carries a real name);
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

// `relativeTime` lives in lib/time.ts. It is re-exported here because a dozen
// call sites import it from this module and the name is the same thing —
// moving the IMPLEMENTATION is the point, not making every caller rewrite.
export { relativeTime } from "./time";
