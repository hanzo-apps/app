"use server";

import { cookies } from "next/headers";

import { isAuthenticated } from "@/lib/auth";
import {
  listProjects,
  getProject as getProjectRow,
  spaceId,
} from "@/lib/db/projects";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { cloudBase } from "@/lib/org/server";
import { Project as ProjectType } from "@/types";

/**
 * The ONE canonical projects store is the org-scoped cloud projects subsystem
 * (`api.hanzo.ai/v1/projects`) — the SAME records console.hanzo.ai and the
 * same-origin `/v1/projects` BFF read, tenant-derived from the bearer `owner`
 * claim. We reach it here EXACTLY the way that (proven-working) BFF does: the raw
 * `hanzo_token` httpOnly cookie is forwarded verbatim as the bearer, and cloud
 * verifies it + derives the tenant. We deliberately do NOT gate this on an IAM
 * userinfo round-trip (isAuthenticated) — that round-trip is the regression that
 * made this return 0 (it fails from the pod, short-circuiting before the fetch);
 * the cloud gateway is the authoritative verifier, so forwarding the cookie is
 * sufficient and correct. The per-user Base store (listProjects) remains only as
 * a fail-soft fallback when the cookie is absent or the cloud call throws — never
 * a second source of truth.
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
  // Primary + canonical: forward the SAME httpOnly `hanzo_token` cookie the
  // working /v1/projects BFF forwards, straight to the org-scoped cloud store.
  // No userinfo round-trip — cloud is the authoritative verifier of the bearer.
  const token = (await cookies()).get(MY_TOKEN_KEY())?.value;
  if (token) {
    try {
      return {
        ok: true,
        projects: (await cloudOrgProjects(token)) as unknown as ProjectType[],
      };
    } catch {
      // Cloud unreachable → fall through to the per-user Base fallback below.
    }
  }

  // Fail-soft: the per-user Base store. It scopes by the caller's IAM `sub`, so
  // it needs the validated identity (isAuthenticated) — used only when the cloud
  // store is unavailable or the session cookie is missing.
  const user = await isAuthenticated();
  if (!user) {
    return { ok: false, projects: [] };
  }
  return {
    ok: true,
    projects: (await listProjects(
      user.token,
      user.id
    )) as unknown as ProjectType[],
  };
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
