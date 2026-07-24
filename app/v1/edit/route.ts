/**
 * /v1/edit — the Hanzo Edit dispatch + the REAL security boundary.
 *
 * The gate (server-side, IAM-validated — never a client-supplied "isAdmin"):
 *   - not signed in                       → 401 { openLogin:true }
 *   - signed in, no credits, not admin    → 402 { needsCredits:true }
 *   - global admin                        → allowed, FREE
 *   - signed in WITH credits              → allowed, the agent run debits them
 * i.e. `isGlobalAdmin || (authenticated && hasCredits)`. The widget hiding the
 * button is only cosmetic; THIS is what actually protects the flow.
 *
 * On pass, it runs the whole vertical for ONE file (fork→edit→PR) via the
 * provider abstraction (`lib/edit/*`): resolve the caller's forge token
 * server-side, read the file, compute the rewrite with Hanzo's model stack
 * (debiting the caller), then branch+commit+PR — forking first when the caller
 * lacks write access. The forge token NEVER reaches the browser. Cross-origin by
 * design (the widget runs on every Hanzo app); the gate, not CSRF, is the guard.
 */
import type { NextRequest } from 'next/server';

import { GitSyncError } from '@/lib/git/sync';
import { readWidgetBearer, resolveOrgIdentity } from '@/lib/org/server';
import { spendableCents } from '@/lib/billing/server';
import { providerFor } from '@/lib/edit/provider';
import { parseTarget, runEdit } from '@/lib/edit/flow';
import { resolveEditToken } from '@/lib/edit/token';
import { preflight, withCors } from '@/lib/edit/cors';

export const runtime = 'nodejs';

const MAX_INSTRUCTION = 4000;
const MAX_CONTEXT = 8000;

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const bearer = readWidgetBearer(req);

  // 1) Identity — IAM-validated, so isGlobalAdmin is authoritative.
  const id = await resolveOrgIdentity(req, { validate: true, bearer: bearer ?? undefined });
  if (!id) {
    return withCors(origin, { ok: false, error: 'Sign in to open a PR.', openLogin: true }, 401);
  }

  // 2) Entitlement gate: admin is free; everyone else needs spendable credits.
  const free = id.isGlobalAdmin;
  if (!free) {
    const cents = await spendableCents(id.token);
    if (!(typeof cents === 'number' && cents > 0)) {
      return withCors(
        origin,
        { ok: false, error: 'Add credits to open a PR.', needsCredits: true, balance: cents },
        402,
      );
    }
  }

  // 3) Resolve + validate the edit target.
  const body = (await req.json().catch(() => ({}))) as {
    repo?: string;
    path?: string;
    branch?: string;
    provider?: unknown;
    instruction?: string;
    context?: string;
    url?: string;
    key?: string;
    model?: string;
  };

  const target = parseTarget(body);
  if ('error' in target) {
    return withCors(origin, { ok: false, error: target.error }, 400);
  }
  const instruction = (body.instruction || '').trim().slice(0, MAX_INSTRUCTION);
  if (!instruction) {
    return withCors(origin, { ok: false, error: 'Describe the change to make.' }, 400);
  }

  // 4) Resolve the caller's forge token (their linked account, or the Hanzo bot).
  const editToken = await resolveEditToken(req, target.provider, bearer);
  if (!editToken) {
    return withCors(
      origin,
      {
        ok: false,
        error: `Connect ${target.provider} in your Hanzo account to open a PR.`,
        connect: true,
        provider: target.provider,
      },
      409,
    );
  }

  // 5) Run the vertical: read → agentic rewrite (debits) → fork? → branch → commit → PR.
  const context = [body.url ? `URL: ${body.url}` : '', (body.context || '').slice(0, MAX_CONTEXT)]
    .filter(Boolean)
    .join('\n');
  const actorLabel = `${free ? 'admin ' : ''}@${id.name}${editToken.source === 'bot' ? ' via hanzo-bot' : ''}`;

  try {
    const gp = providerFor(target.provider, editToken.token);
    const out = await runEdit(gp, {
      target,
      instruction,
      context: context || undefined,
      agentToken: id.token,
      model: body.model,
      actorLabel,
      projectKey: (body.key || '').trim() || undefined,
    });
    return withCors(origin, {
      ok: true,
      prUrl: out.prUrl,
      number: out.number,
      branch: out.branch,
      forked: out.forked,
      commitSha: out.commitSha,
      provider: target.provider,
      free,
    });
  } catch (e) {
    const status = e instanceof GitSyncError ? e.status : 502;
    const code = e instanceof GitSyncError ? e.code : 'error';
    const error = e instanceof Error ? e.message : 'The edit failed.';
    const payload: Record<string, unknown> = { ok: false, error, code, provider: target.provider };
    if (code === 'forbidden') payload.connect = true;
    if (code === 'needs_credits') payload.needsCredits = true;
    return withCors(origin, payload, status);
  }
}

export const dynamic = 'force-dynamic';
