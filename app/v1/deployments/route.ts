/**
 * API Routes for Deployments (published versions of projects)
 * GET /api/deployments - List all deployments
 * POST /api/deployments - Create a new deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdapter } from '@/lib/vfs/adapters/server';
import { requireSession } from '@/lib/iam';
import { Deployment } from '@/lib/vfs/types';

export async function GET(request: NextRequest) {
  try {
    // Every sibling that reaches this adapter requires a session — sync/projects
    // and sync/files do. These did not, and the store answering "not found"
    // rather than "not signed in" is what hid it: an existing id would have
    // been returned to anyone. It reads empty in production today, and empty is
    // not protected.
    await requireSession(request);

    const adapter = await createServerAdapter();
    await adapter.init();

    const deployments = await adapter.listDeployments?.() || [];

    await adapter.close?.();

    return NextResponse.json(deployments);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Deployments API] Error listing deployments:', error);
    return NextResponse.json(
      { error: 'Failed to list deployments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Every sibling that reaches this adapter requires a session — sync/projects
    // and sync/files do. These did not, and the store answering "not found"
    // rather than "not signed in" is what hid it: an existing id would have
    // been returned to anyone. It reads empty in production today, and empty is
    // not protected.
    await requireSession(request);

    const body = await request.json();
    const { projectId, name, slug } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'projectId and name are required' },
        { status: 400 }
      );
    }

    const adapter = await createServerAdapter();
    await adapter.init();

    // Check if project exists
    const project = await adapter.getProject(projectId);
    if (!project) {
      await adapter.close?.();
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create new deployment
    const deployment: Deployment = {
      id: crypto.randomUUID(),
      projectId,
      name,
      slug: slug || undefined,
      enabled: false,
      underConstruction: false,
      headScripts: [],
      bodyScripts: [],
      cdnLinks: [],
      analytics: {
        enabled: false,
        provider: 'builtin',
        privacyMode: true,
      },
      seo: {},
      compliance: {
        enabled: false,
        bannerPosition: 'bottom' as const,
        bannerStyle: 'bar' as const,
        message: '',
        acceptButtonText: 'Accept',
        declineButtonText: 'Decline',
        mode: 'opt-in' as const,
        blockAnalytics: true,
      },
      settingsVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (adapter.createDeployment) {
      await adapter.createDeployment(deployment);
    }
    await adapter.close?.();

    return NextResponse.json(deployment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Deployments API] Error creating deployment:', error);
    return NextResponse.json(
      { error: 'Failed to create deployment' },
      { status: 500 }
    );
  }
}
