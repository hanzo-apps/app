/**
 * API Route for Publishing Deployments
 * POST /api/deployments/[id]/publish - Build and publish a deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildStaticDeployment } from '@/lib/compiler/static-builder';
import { getSQLiteAdapter } from '@/lib/vfs/adapters/server';
import MY_TOKEN_KEY from '@/lib/get-cookie-name';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Forward the signed-in user's IAM bearer so the builder can read the
    // org-scoped cloud project (its wired-by-default analytics flag + Base space).
    const bearer = request.cookies.get(MY_TOKEN_KEY())?.value;

    // Build the deployment
    const result = await buildStaticDeployment(id, { bearer });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to build deployment' },
        { status: 500 }
      );
    }

    // Update deployment metadata after successful build
    const adapter = getSQLiteAdapter();
    await adapter.init();

    const deployment = await adapter.getDeployment?.(id);
    if (deployment && adapter.updateDeployment) {
      deployment.lastPublishedVersion = deployment.settingsVersion;
      deployment.publishedAt = new Date();
      deployment.updatedAt = new Date();

      // Enable deployment database for analytics when publishing
      if (!deployment.databaseEnabled) {
        deployment.databaseEnabled = true;
        await adapter.enableDeploymentDatabase(id);
      }

      await adapter.updateDeployment(deployment);
    }

    return NextResponse.json({
      success: true,
      deploymentId: result.deploymentId,
      projectId: result.projectId,
      filesWritten: result.filesWritten,
      outputPath: result.outputPath,
      lastPublishedVersion: deployment?.settingsVersion ?? null,
    });
  } catch (error) {
    console.error('[Deployments API] Error publishing deployment:', error);
    return NextResponse.json(
      { error: 'Failed to publish deployment' },
      { status: 500 }
    );
  }
}
