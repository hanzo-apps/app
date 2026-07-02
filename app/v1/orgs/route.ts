/**
 * /v1/orgs — the org context for the signed-in user.
 *
 * GET → the honest OrgContext (the org(s) the user can act in, the current/
 *       effective org, whether they still need onboarding). Drives the org
 *       selector + the onboarding gate.
 *
 * There is NO POST switch: the selected org is a CLIENT value (`lib/org-scope`,
 * localStorage) stamped as `X-Org-Id` on every scoped call — exactly console2's
 * mechanism. The server honors it only for a global admin (a normal user is
 * pinned to their bearer owner), so switching needs no server round-trip.
 *
 * No `/api/` prefix (CTO law: same-origin `/v1/*`).
 */
import { type NextRequest, NextResponse } from 'next/server';

import { resolveOrgContext } from '@/lib/org/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ctx = await resolveOrgContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(ctx);
}
