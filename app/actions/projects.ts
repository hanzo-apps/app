"use server";

import { isAuthenticated } from "@/lib/auth";
import {
  listProjects,
  getProject as getProjectRow,
  spaceId,
} from "@/lib/db/projects";
import { cloudBase } from "@/lib/org/server";
import { Project as ProjectType } from "@/types";

/**
 * The ONE canonical projects store is the org-scoped cloud projectsvc
 * (`api.hanzo.ai/v1/projects`) — the SAME records console.hanzo.ai and the
 * /v1/projects BFF read, tenant-derived from the bearer `owner` claim. We fetch
 * it here (server-side, with the user's IAM bearer) and map to the BaseProjectRow
 * shape the dashboard renders. The per-user Base store (listProjects) remains only
 * as a self-hosted fallback when cloud is unreachable — never a second source of truth.
 */
async function cloudOrgProjects(token: string): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(`${cloudBase()}/v1/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`cloud /v1/projects ${res.status}`);
  const rows = (await res.json()) as Array<{
    id: string;
    slug: string;
    name?: string;
    updatedAt?: number;
    createdAt?: number;
  }>;
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    space_id: p.slug,
    updated: p.updatedAt ? new Date(p.updatedAt * 1000).toISOString() : null,
    created: p.createdAt ? new Date(p.createdAt * 1000).toISOString() : null,
  }));
}

export async function getProjects(): Promise<{
  ok: boolean;
  projects: ProjectType[];
}> {
  const user = await isAuthenticated();
  if (!user) {
    return { ok: false, projects: [] };
  }
  try {
    return {
      ok: true,
      projects: (await cloudOrgProjects(user.token)) as unknown as ProjectType[],
    };
  } catch {
    // Self-hosted / cloud-unreachable fallback: the per-user Base store.
    return {
      ok: true,
      projects: (await listProjects(
        user.token,
        user.id
      )) as unknown as ProjectType[],
    };
  }
}

export async function getProject(
  namespace: string,
  repoId: string
): Promise<ProjectType | null> {
  const user = await isAuthenticated();
  if (!user) {
    return null;
  }
  return (await getProjectRow(
    user.token,
    user.id,
    spaceId(namespace, repoId)
  )) as unknown as ProjectType | null;
}
