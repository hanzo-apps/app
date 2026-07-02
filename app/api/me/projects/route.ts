import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { isAuthenticated } from "@/lib/auth";
import { listProjects, createProject } from "@/lib/db/projects";
import { createServerAdapter } from "@/lib/vfs/adapters/server";
import { buildStaticDeployment } from "@/lib/compiler/static-builder";
import {
  Deployment,
  Project as VfsProject,
  VirtualFile,
  getFileTypeFromPath,
  getSpecificMimeType,
} from "@/lib/vfs/types";
import { Page } from "@/types";

export async function GET() {
  const user = await isAuthenticated();

  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { ok: true, projects: await listProjects(user.token, user.id) },
    { status: 200 }
  );
}

// Publish a generated site natively to Hanzo Cloud (VFS/SQLite → static build).
// No HuggingFace: the pages are written to the server VFS as a project, wrapped
// in a Deployment, and compiled by the same buildStaticDeployment() engine the
// deployments admin uses. Served live at /deployments/<id>/.
export async function POST(request: NextRequest) {
  const user = await isAuthenticated();

  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { title, pages, prompts } = (await request.json()) as {
    title?: string;
    pages?: Page[];
    prompts?: string[];
  };

  if (!title || !pages || pages.length === 0) {
    return NextResponse.json(
      { message: "Title and HTML content are required.", ok: false },
      { status: 400 }
    );
  }

  try {
    // Normalize pages to VFS paths (leading slash) and guarantee an entry point.
    const byPath = new Map<string, string>();
    for (const page of pages) {
      const path = page.path.startsWith("/") ? page.path : `/${page.path}`;
      byPath.set(path, page.html);
    }
    if (!byPath.has("/index.html")) {
      byPath.set("/index.html", pages[0].html);
    }

    const adapter = await createServerAdapter();
    await adapter.init();

    const now = new Date();
    const projectId = uuidv4();

    const project: VfsProject = {
      id: projectId,
      name: title,
      createdAt: now,
      updatedAt: now,
      settings: { runtime: "static" },
      lastSavedCheckpointId: null,
      lastSavedAt: null,
      costTracking: { totalCost: 0, providerBreakdown: {}, sessionHistory: [] },
    };
    await adapter.createProject(project);

    for (const [path, html] of byPath) {
      const file: VirtualFile = {
        id: uuidv4(),
        projectId,
        path,
        name: path.split("/").pop() || "index.html",
        type: getFileTypeFromPath(path),
        content: html,
        mimeType: getSpecificMimeType(path),
        size: Buffer.byteLength(html, "utf8"),
        createdAt: now,
        updatedAt: now,
        metadata: { isEntry: path === "/index.html" },
      };
      await adapter.createFile(file);
    }

    const deployment: Deployment = {
      id: uuidv4(),
      projectId,
      name: title,
      enabled: true,
      underConstruction: false,
      headScripts: [],
      bodyScripts: [],
      cdnLinks: [],
      analytics: { enabled: false, provider: "builtin", privacyMode: true },
      seo: {},
      compliance: {
        enabled: false,
        bannerPosition: "bottom",
        bannerStyle: "bar",
        message: "",
        acceptButtonText: "Accept",
        declineButtonText: "Decline",
        mode: "opt-in",
        blockAnalytics: true,
      },
      settingsVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    await adapter.createDeployment?.(deployment);

    // Same publish engine as POST /api/deployments/[id]/publish.
    const build = await buildStaticDeployment(deployment.id);
    if (!build.success) {
      return NextResponse.json(
        { error: build.error || "Failed to publish deployment", ok: false },
        { status: 500 }
      );
    }

    const url = `/deployments/${deployment.id}/`;

    // Best-effort: record the project so it appears in the user's project list.
    // A Base failure must not fail an already-published deployment.
    let project_record;
    try {
      project_record = await createProject(user.token, {
        userId: user.id,
        spaceId: deployment.id,
        prompts: prompts ?? [],
      });
    } catch (recordErr) {
      console.error("Failed to record project in Base:", recordErr);
    }

    return NextResponse.json(
      {
        ok: true,
        deploymentId: deployment.id,
        url,
        path: deployment.id,
        project: project_record,
      },
      { status: 201 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, ok: false },
      { status: 500 }
    );
  }
}
