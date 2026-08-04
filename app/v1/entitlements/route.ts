/**
 * /v1/entitlements — the caller's PLAN, from the one authority that knows it.
 *
 * Forwards to the gateway `/v1/entitlements` as the signed-in user (their IAM
 * bearer), which cloud calls "the paywall's OWN projection — what the shell
 * renders upgrade UI from": `{ tier, apps }`, where `tier` is the org's resolved
 * subscription slug and `""` means commerce named no plan.
 *
 * It exists because hanzo.app had NO plan read at all — the upgrade CTA was a
 * static button, so a paying customer was told to upgrade to what they already
 * bought. A UI that asserts a plan must have asked for one.
 *
 * Same shape as `/v1/wallet`: identity is server-side, the browser only sends
 * its selected org, and the upstream status passes through untouched.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, resolveScope } from '@/lib/org/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const scope = await resolveScope(req);
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${scope.token}`,
    Accept: 'application/json',
  };
  // Stamp X-Org-Id ONLY for a validated global admin acting cross-org.
  if (scope.crossOrg) headers['X-Org-Id'] = scope.org;

  try {
    const res = await fetch(`${cloudBase()}/v1/entitlements`, { headers, cache: 'no-store' });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'entitlements backend unreachable' }, { status: 502 });
  }
}
