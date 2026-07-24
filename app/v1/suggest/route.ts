/**
 * /v1/suggest — the LOW-privilege "contribute to this page" door.
 *
 * ANYONE, including anonymous visitors, may suggest a fix. No credits, no agent
 * run: we file a lightweight issue-style entry against the page's declared repo.
 * The token used to file is (in order) the caller's linked-provider token, else a
 * configured Hanzo bot identity (`HANZO_EDIT_BOT_TOKEN`). When neither exists the
 * suggestion is acknowledged honestly (`filed:false`) rather than fabricating a
 * filing — the deploy simply hasn't wired a channel yet.
 *
 * Cross-origin BY DESIGN (the widget runs on every Hanzo app); the security model
 * is the LOW blast radius (a reviewable issue), not CSRF.
 */
import type { NextRequest } from 'next/server';

import { parseOwnerRepo, GitSyncError } from '@/lib/git/sync';
import { cleanLine } from '@/lib/git/summarize';
import { readWidgetBearer, resolveOrgIdentity } from '@/lib/org/server';
import { providerFor, providerName } from '@/lib/edit/provider';
import { resolveEditToken } from '@/lib/edit/token';
import { preflight, withCors } from '@/lib/edit/cors';

export const runtime = 'nodejs';

const MAX_TEXT = 5000;
const MAX_URL = 2000;

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');

  const body = (await req.json().catch(() => ({}))) as {
    repo?: string;
    provider?: unknown;
    path?: string;
    url?: string;
    suggestion?: string;
    context?: string;
    key?: string;
  };

  const parsed = parseOwnerRepo((body.repo || '').trim());
  if (!parsed) {
    return withCors(origin, { ok: false, error: 'A valid "owner/repo" is required.' }, 400);
  }
  const suggestion = (body.suggestion || '').trim().slice(0, MAX_TEXT);
  if (!suggestion) {
    return withCors(origin, { ok: false, error: 'Describe the suggested change.' }, 400);
  }

  const provider = providerName(body.provider);
  const bearer = readWidgetBearer(req);
  // Best-effort actor label for the issue body (validated only when a bearer is
  // present; anonymous suggestions are labeled honestly).
  const id = bearer ? await resolveOrgIdentity(req, { validate: true, bearer }) : null;
  const actor = id ? `@${id.name}${id.isGlobalAdmin ? ' (admin)' : ''}` : 'an anonymous visitor';

  const editToken = await resolveEditToken(req, provider, bearer);
  if (!editToken) {
    // No forge token available (anonymous + no bot configured). Acknowledge
    // honestly — do NOT claim a filing that didn't happen.
    console.warn('[hanzo-edit] suggestion not filed (no forge token):', parsed.path, suggestion.slice(0, 80));
    return withCors(origin, {
      ok: true,
      filed: false,
      message: 'Thanks — your suggestion was received.',
    });
  }

  const title = `Suggestion: ${cleanLine(suggestion) || 'improve ' + parsed.path}`;
  const bodyLines = [
    suggestion,
    '',
    '---',
    body.url ? `Page: ${(body.url || '').slice(0, MAX_URL)}` : '',
    body.path ? `File: \`${body.path}\`` : '',
    body.context ? `\nContext:\n${(body.context || '').slice(0, MAX_TEXT)}` : '',
    `\nSubmitted via Hanzo Edit by ${actor}.`,
    body.key ? `Project: \`${body.key}\`` : '',
  ].filter(Boolean);

  try {
    const gp = providerFor(provider, editToken.token);
    const issue = await gp.openIssue({ owner: parsed.owner, repo: parsed.repo }, title, bodyLines.join('\n'));
    return withCors(origin, {
      ok: true,
      filed: true,
      issueUrl: issue.issueUrl,
      number: issue.number,
      provider,
    });
  } catch (e) {
    const status = e instanceof GitSyncError ? e.status : 502;
    const error = e instanceof Error ? e.message : 'Could not file the suggestion.';
    return withCors(origin, { ok: false, error, provider }, status);
  }
}

export const dynamic = 'force-dynamic';
