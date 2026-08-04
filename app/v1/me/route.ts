/**
 * /v1/me — the Hanzo Edit widget's identity + entitlement probe.
 *
 * Cross-origin (the widget runs on every Hanzo app), so it accepts the caller's
 * IAM bearer via `Authorization` header (different-site Hanzo apps, where a
 * SameSite=Lax cookie can't ride) or the session cookie (same-origin hanzo.app).
 * Either way the token is JWKS-verified by `lib/iam.ts`, so `isAdmin` is
 * authoritative and a forged token is simply not a caller.
 *
 * Returns the shape the widget uses to pick a CTA:
 *   { authenticated, isAdmin, org, balance, balanceState, hasCredits }
 *     - admin           → "Open PR — free"
 *     - user + credits  → "Submit fix (uses credits)"
 *     - user, no credit → "Top up to submit a PR"
 *     - anonymous       → "Suggest a fix" + "Log in to open a PR"
 *
 * Never fabricates: an unknown balance (billing unrouted / unreachable) is null,
 * and a non-admin with unknown/zero balance is `hasCredits:false`. `balanceState`
 * says WHICH it was ('ok' | 'noauth' | 'unavailable' | 'skipped' for an admin), so
 * a CTA can tell "you have no credits" apart from "we could not ask" — the two
 * used to be one null, and a funded customer was told to top up.
 */
import type { NextRequest } from 'next/server';

import { session } from '@/lib/iam';
import { spendable, knownCents, funded } from '@/lib/billing/server';
import { preflight, withCors } from '@/lib/edit/cors';

export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const id = await session(req);

  if (!id) {
    return withCors(origin, {
      authenticated: false,
      isAdmin: false,
      org: '',
      balance: null,
      balanceState: 'anonymous',
      hasCredits: false,
    });
  }

  // Admins never need credits (the /v1/edit run is free for them); skip the
  // balance round-trip. Everyone else: real spendable cents decides the CTA.
  const bal = id.isAdmin ? null : await spendable(id.token);
  const hasCredits = id.isAdmin || (bal !== null && funded(bal));

  return withCors(origin, {
    authenticated: true,
    isAdmin: id.isAdmin,
    org: id.org,
    balance: bal === null ? null : knownCents(bal),
    // WHY the balance is null, so the widget can say "sign in again" or "billing is
    // down" instead of "top up". Without this, an unreadable balance and an empty
    // one are the same null and every failure reads as "you are out of money".
    balanceState: bal === null ? 'skipped' : bal.state,
    hasCredits,
  });
}

export const dynamic = 'force-dynamic';
