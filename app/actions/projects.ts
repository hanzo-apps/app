"use server";

import { isAuthenticated } from "@/lib/auth";
import {
  listProjects,
  getProject as getProjectRow,
  spaceId,
} from "@/lib/db/projects";
import { Project as ProjectType } from "@/types";

export async function getProjects(): Promise<{
  ok: boolean;
  projects: ProjectType[];
}> {
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
