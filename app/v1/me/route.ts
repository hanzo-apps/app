/**
 * /v1/me — the Hanzo Edit widget's identity + entitlement probe.
 *
 * Cross-origin (the widget runs on every Hanzo app), so it accepts the caller's
 * IAM bearer via cookie (same-origin hanzo.app) OR `Authorization` header
 * (different-site Hanzo apps, where a SameSite=Lax cookie can't ride) — see
 * `readWidgetBearer`. Identity is ALWAYS IAM-validated (validate:true), so
 * `isGlobalAdmin` is authoritative.
 *
 * Returns the shape the widget uses to pick a CTA:
 *   { authenticated, isGlobalAdmin, org, balance, hasCredits }
 *     - admin           → "Open PR — free"
 *     - user + credits  → "Submit fix (uses credits)"
 *     - user, no credit → "Top up to submit a PR"
 *     - anonymous       → "Suggest a fix" + "Log in to open a PR"
 *
 * Never fabricates: an unknown balance (billing unrouted / unreachable) is null,
 * and a non-admin with unknown/zero balance is `hasCredits:false`.
 */
import type { NextRequest } from 'next/server';

import { resolveOrgIdentity, readWidgetBearer } from '@/lib/org/server';
import { spendableCents } from '@/lib/billing/server';
import { preflight, withCors } from '@/lib/edit/cors';

export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const id = await resolveOrgIdentity(req, { validate: true, bearer: readWidgetBearer(req) ?? undefined });

  if (!id) {
    return withCors(origin, {
      authenticated: false,
      isGlobalAdmin: false,
      org: '',
      balance: null,
      hasCredits: false,
    });
  }

  // Admins never need credits (the /v1/edit run is free for them); skip the
  // balance round-trip. Everyone else: real spendable cents decides the CTA.
  const cents = id.isGlobalAdmin ? null : await spendableCents(id.token);
  const hasCredits = id.isGlobalAdmin || (typeof cents === 'number' && cents > 0);

  return withCors(origin, {
    authenticated: true,
    isGlobalAdmin: id.isGlobalAdmin,
    org: id.homeOrg,
    balance: cents,
    hasCredits,
  });
}

export const dynamic = 'force-dynamic';
