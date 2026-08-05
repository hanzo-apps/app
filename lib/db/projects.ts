import { baseAs } from "@/lib/base";

/**
 * Project metadata, stored in Hanzo Base (the `projects` collection) — the one
 * data plane for project metadata.
 *
 * Every function acts as the signed-in user (their hanzo.id IAM token) and
 * scopes by `user_id` (their IAM `sub`) for per-user isolation. Thin wrapper
 * over the @hanzo/base core client — no bespoke HTTP, no local DB.
 */
// `type` (not `interface`) so it satisfies the BaseClient generic's
// `BaseRecord` constraint — only type-alias object literals get the implicit
// string index signature `[key: string]: unknown` requires (same pattern as
// lib/db/history.ts).
export type Project = {
  id: string;
  user_id: string;
  space_id: string; // canonical key, "namespace/repoId"
  prompts: string[];
  created: string;
  updated: string;
};

/** Canonical project key from a namespace + repo id. */
export function spaceId(namespace: string, repoId: string): string {
  return `${namespace}/${repoId}`;
}

/** Escape single quotes for a Base filter literal. */
const lit = (s: string) => s.replace(/'/g, "\\'");

export async function listProjects(
  token: string,
  userId: string
): Promise<Project[]> {
  const res = await baseAs(token)
    .collection("projects")
    .getList<Project>(1, 100, {
      filter: `user_id='${lit(userId)}'`,
      sort: "-created",
    });
  return res.items;
}

export async function getProject(
  token: string,
  userId: string,
  space_id: string
): Promise<Project | null> {
  try {
    return await baseAs(token)
      .collection("projects")
      .getFirstListItem<Project>(
        `user_id='${lit(userId)}' && space_id='${lit(space_id)}'`
      );
  } catch {
    return null; // not found
  }
}

export async function createProject(
  token: string,
  input: { userId: string; spaceId: string; prompts: string[] }
): Promise<Project> {
  return baseAs(token).collection("projects").create<Project>({
    user_id: input.userId,
    space_id: input.spaceId,
    prompts: input.prompts ?? [],
  });
}

/**
 * The user's project row, created if this is the first time anything asked for it.
 *
 * NOTHING ELSE CREATES IT. Publishing goes to the cloud projects service, and
 * the only other writer here demands a published static space first — so every
 * per-project feature (reference images, imported assets, brand guidelines) was
 * gated behind a row that neither drafting NOR publishing ever wrote. The gate
 * read as "publish first", but publishing did not help.
 *
 * A row is a user id, a key, and an empty prompt list. It is cheap, it belongs
 * to the caller, and refusing to make one buys nothing — so this makes it and
 * the feature simply works. A concurrent first request may win the create; that
 * is a success, so the row it made is returned rather than an error.
 */
export async function ensureProject(
  token: string,
  userId: string,
  space_id: string
): Promise<Project | null> {
  const existing = await getProject(token, userId, space_id);
  if (existing) return existing;
  try {
    return await createProject(token, { userId, spaceId: space_id, prompts: [] });
  } catch {
    return getProject(token, userId, space_id);
  }
}

export async function updateProject(
  token: string,
  userId: string,
  space_id: string,
  updates: { prompts?: string[] }
): Promise<Project | null> {
  const existing = await getProject(token, userId, space_id);
  if (!existing) return null;
  return baseAs(token).collection("projects").update<Project>(existing.id, {
    prompts: updates.prompts ?? existing.prompts,
  });
}

export async function deleteProject(
  token: string,
  userId: string,
  space_id: string
): Promise<boolean> {
  const existing = await getProject(token, userId, space_id);
  if (!existing) return false;
  return baseAs(token).collection("projects").delete(existing.id);
}
