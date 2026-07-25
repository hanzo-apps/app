/**
 * /v1/edit — the Hanzo Edit dispatch + the REAL security boundary.
 *
 * The gate (server-side, IAM-validated — never a client-supplied "isAdmin"):
 *   - not signed in                       → 401 { openLogin:true }
 *   - signed in, no credits, not admin    → 402 { needsCredits:true }
 *   - global admin                        → allowed, FREE
 *   - signed in WITH credits              → allowed, the agent run debits them
 * i.e. `isAdmin || (authenticated && hasCredits)`. The widget hiding the
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
import { MAX_FILE_BYTES } from '@/lib/edit/agent';
import { resolveEditToken } from '@/lib/edit/token';
import { preflight, withCors } from '@/lib/edit/cors';
import { parseContext, pickPath, renderContext } from '@/lib/edit/context';

export const runtime = 'nodejs';

const MAX_INSTRUCTION = 4000;
const MAX_CONTEXT = 8000;

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const bearer = readWidgetBearer(req);

  // 1) Identity — IAM-validated, so isAdmin/isPlatformSudo are authoritative.
  const id = await resolveOrgIdentity(req, { validate: true, bearer: bearer ?? undefined });
  if (!id) {
    return withCors(origin, { ok: false, error: 'Sign in to open a PR.', openLogin: true }, 401);
  }

  // 2) Entitlement gate: admin is free; everyone else needs spendable credits.
  const free = id.isAdmin;
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
    mode?: string;
    reviewed?: string;
    baseSha?: string;
  };

  // Direct-commit ("goes live" straight to the default branch) is admin-ONLY.
  // A non-admin passing mode:'direct' is silently downgraded to the PR flow —
  // privilege is decided here (server), never in the browser.
  // direct-commit bypasses review on the default branch — SUDO, not merely staff.
  const direct = body.mode === 'direct' && id.isPlatformSudo;

  // Direct is two-phase: PROPOSE (no `reviewed`) computes + returns the rewrite
  // for review; CONFIRM commits the exact bytes the admin approved. The confirm
  // bytes are admin-authored, but still bounded by the single-file ceiling and
  // committed against the reviewed sha (non-destructive).
  const reviewed = direct && typeof body.reviewed === 'string' ? body.reviewed : undefined;
  const baseSha = direct && typeof body.baseSha === 'string' ? body.baseSha : null;
  if (reviewed !== undefined && Buffer.byteLength(reviewed, 'utf8') > MAX_FILE_BYTES) {
    return withCors(origin, { ok: false, error: 'The reviewed file is too large to commit.' }, 413);
  }

  // The widget auto-resolves the source file for the current view, so `path` is
  // optional: fall back to the top-ranked candidate when it's absent.
  const trace = parseContext(body);
  const effectivePath = pickPath(body.path, trace.candidateFiles) ?? undefined;
  const target = parseTarget({ ...body, path: effectivePath });
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
  const context = [
    body.url ? `URL: ${body.url}` : '',
    renderContext(trace),
    (body.context || '').slice(0, MAX_CONTEXT),
  ]
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
      direct,
      reviewed,
      baseSha,
      // Attribute a direct "goes live" commit to the VALIDATED admin identity —
      // not the shared bot token — in the commit message trailer (flow.ts).
      identity: { sub: id.sub, name: id.name },
    });
    // PROPOSE phase (admin direct): return the computed rewrite for review — the
    // widget renders the diff and the admin must confirm before it goes live.
    if (out.preview) {
      return withCors(origin, {
        ok: true,
        preview: true,
        proposed: out.proposed,
        diff: out.diff,
        baseSha: out.baseSha,
        path: target.path,
        branch: out.branch,
        provider: target.provider,
      });
    }
    // Server-side security audit for a direct "goes live" commit: WHO (validated
    // admin sub), WHAT (repo/path/sha/branch), WHERE FROM (origin). One structured
    // line → server logs → o11y. Only a confirmed commit (has a sha) is audited;
    // the propose phase committed nothing and returned above.
    if (out.direct && out.commitSha) {
      console.warn(
        '[hanzo-edit][audit] direct-commit',
        JSON.stringify({
          admin: id.sub,
          name: id.name,
          repo: `${target.repo.owner}/${target.repo.repo}`,
          path: target.path,
          branch: out.branch,
          sha: out.commitSha,
          origin: origin || '',
          provider: target.provider,
          at: new Date().toISOString(),
        }),
      );
    }
    return withCors(origin, {
      ok: true,
      prUrl: out.prUrl,
      number: out.number,
      branch: out.branch,
      forked: out.forked,
      commitSha: out.commitSha,
      // Direct-commit outcome (admin "goes live"): the widget shows a live link
      // instead of a PR. `liveUrl` is the page the edit was made from.
      committed: out.direct === true,
      commitUrl: out.commitUrl,
      liveUrl: out.direct ? (body.url || undefined) : undefined,
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
