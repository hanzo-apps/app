/**
 * Platform "Deploy" path — the builder's bridge to the cloud PaaS.
 *
 * POST /api/platform/deploy
 *   Ensure a platform project + application exist, then trigger a deploy.
 *   Body: { project: {name, slug?}, app: AppSpec, deploy?: {commit?,tag?} }.
 *   For a git app this launches a BuildKit build; for an image app it deploys
 *   immediately. Returns the project, app, deployment, and public URL (if any).
 *
 * GET /api/platform/deploy?project=<slug>&app=<slug>
 *   Live build/deploy status + URL for the builder's status panel.
 *
 * Every call runs AS the logged-in user (their IAM token, minted here — never a
 * shared key). The cloud derives the tenant org from the token owner, so a user
 * can only ever deploy into their own namespace.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/session';
import {
  deploy,
  deployStatus,
  PlatformAuthError,
  PlatformError,
  type DeployInput,
} from '@/lib/platform';

export async function POST(req: NextRequest) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: DeployInput;
  try {
    body = (await req.json()) as DeployInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.project?.name || !body?.app?.name || !body?.app?.source) {
    return NextResponse.json(
      { error: 'project.name, app.name and app.source are required' },
      { status: 400 },
    );
  }

  try {
    const result = await deploy(user.token, body);
    return NextResponse.json(
      {
        ...result,
        statusUrl: `/api/platform/deploy?project=${encodeURIComponent(
          result.project.slug,
        )}&app=${encodeURIComponent(result.app.slug)}`,
      },
      { status: 202 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project');
  const app = searchParams.get('app');
  if (!project || !app) {
    return NextResponse.json({ error: 'project and app query params are required' }, { status: 400 });
  }

  try {
    return NextResponse.json(await deployStatus(user.token, project, app));
  } catch (err) {
    return errorResponse(err);
  }
}

/** Map a client/upstream error to an honest HTTP response (never a fake 200). */
function errorResponse(err: unknown): NextResponse {
  if (err instanceof PlatformAuthError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof PlatformError) {
    // Surface the control plane's own status + body verbatim.
    let payload: unknown;
    try {
      payload = JSON.parse(err.body);
    } catch {
      payload = { error: err.body };
    }
    return NextResponse.json(payload, { status: err.status });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'deploy failed' },
    { status: 502 },
  );
}
