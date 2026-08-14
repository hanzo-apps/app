/**
 * /v1/provision — enable the Hanzo stack for a newly-created project.
 *
 * The REAL work behind the remix flow's "Setting up integrations" step (see
 * components/remix/remix-progress + lib/remix). For the given project it:
 *
 *   - Hanzo Base (the app's data plane): opens the per-project SQLite via the
 *     in-repo adapter (`getProjectDatabaseConnection` → data/projects/<id>/
 *     database.sqlite), which CREATES + registers the store, then stamps a
 *     provisioning marker row. This is the same per-app DB the builder and the
 *     published deployment use — a genuine state change, not a stub.
 *   - Analytics: records analytics-enabled in that marker. Per-page traffic is
 *     captured per-deployment automatically (lib/vfs/adapters/analytics-database)
 *     once the app is published, so the built app genuinely ships with analytics.
 *
 * `pending` carries integrations a template still needs the user to connect
 * (via /connectors). The current gallery catalog declares none, so it is empty;
 * the contract is in place for templates that will.
 *
 * Auth: signed-in only (the caller's IAM bearer). `projectId` is strictly
 * validated so it can never traverse outside the projects data dir.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { resolveScope } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';

export const runtime = 'nodejs';

/** Project ids are slugs — reject anything that could escape the data dir. */
const SAFE_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

/**
 * GET /v1/provision?projectId= — read back what POST stamped.
 *
 * The marker rows ARE the record of provisioning, so this reports them and
 * nothing else. It never opens a connection the way POST does: opening CREATES
 * the store, which would make asking the question change the answer — every
 * unprovisioned project would read as provisioned the moment someone looked. So
 * an absent file is reported as absent.
 *
 * `null` means NOT KNOWN and is distinct from `false`: a project whose store
 * exists but carries no marker (created by the app before provisioning, or by an
 * older build) knows nothing about analytics, and the caller renders that gap
 * rather than guessing at it.
 */
export async function GET(req: NextRequest) {
  const scope = await resolveScope(req);
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = (req.nextUrl.searchParams.get('projectId') || '').trim();
  if (!SAFE_ID.test(projectId)) {
    return NextResponse.json({ error: 'invalid projectId' }, { status: 400 });
  }

  const { projectDatabaseExists, getProjectDatabaseConnection } = await import(
    '@/lib/vfs/adapters/sqlite-connection'
  );
  if (!projectDatabaseExists(projectId)) {
    return NextResponse.json({ projectId, base: false, analytics: null, provisionedAt: null, org: null });
  }

  let marker: Record<string, string> = {};
  try {
    const rows = getProjectDatabaseConnection(projectId)
      .prepare('SELECT key, value FROM _hanzo_app_meta')
      .all() as Array<{ key: string; value: string }>;
    marker = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // The store exists but carries no marker table — Base is real, the rest is
    // unknown. Reported as such below; nothing is inferred from the absence.
  }

  return NextResponse.json({
    projectId,
    base: true,
    analytics: 'analytics_enabled' in marker ? marker.analytics_enabled === '1' : null,
    provisionedAt: marker.provisioned_at ?? null,
    org: marker.provisioned_org || null,
  });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const scope = await resolveScope(req);
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let projectId = '';
  try {
    const body = (await req.json()) as { projectId?: string };
    projectId = (body.projectId || '').trim();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!SAFE_ID.test(projectId)) {
    return NextResponse.json({ error: 'invalid projectId' }, { status: 400 });
  }

  const provisioned: string[] = [];
  const pending: Array<{ name: string; connectUrl?: string; skippable: true }> = [];

  // Enable Hanzo Base (create/register the per-project DB) + mark analytics.
  try {
    // Imported lazily: this adapter pulls in better-sqlite3 (native), which must
    // stay on the Node runtime and off any edge/client bundle.
    const { getProjectDatabaseConnection } = await import('@/lib/vfs/adapters/sqlite-connection');
    const db = getProjectDatabaseConnection(projectId);
    db.exec('CREATE TABLE IF NOT EXISTS _hanzo_app_meta (key TEXT PRIMARY KEY, value TEXT)');
    const stamp = db.prepare(
      'INSERT INTO _hanzo_app_meta (key, value) VALUES (?, ?) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );
    stamp.run('provisioned_at', new Date().toISOString());
    stamp.run('provisioned_org', scope.org || '');
    stamp.run('analytics_enabled', '1');
    provisioned.push('Hanzo Base', 'Analytics');
  } catch (err) {
    // Honest failure: nothing confirmed — surface Base as a retryable step so
    // the remix still proceeds and the user is told what's incomplete.
    console.error('provision: Base enablement failed', err);
    pending.push({ name: 'Hanzo Base backend', connectUrl: '/connectors', skippable: true });
  }

  return NextResponse.json({ projectId, provisioned, pending });
}
