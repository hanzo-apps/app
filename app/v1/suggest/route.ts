/**
 * /v1/suggest — the LOW-privilege "contribute to this page" door.
 *
 * A SIGNED-IN person may suggest a fix. No credits and no agent run — we file a
 * lightweight issue-style entry against the page's declared repo — but a name is
 * required, and that is a deliberate change from the anonymous door this used to
 * be.
 *
 * Two reasons, and the second is the one that decided it. A suggestion becomes an
 * ISSUE on one of our repos, filed by a bot identity when the caller has no forge
 * token of their own, so an open door is an unauthenticated write into every repo
 * in the host map — the classic shape of a spam channel, and one where the abuse
 * lands on maintainers rather than on us. And an issue with no author cannot be
 * answered: a reviewer with a question about a suggestion has nobody to ask, so
 * the cheapest suggestions to file were the most expensive to act on.
 *
 * The token used to file is (in order) the caller's linked-provider token, else a
 * configured Hanzo bot identity (`HANZO_EDIT_BOT_TOKEN`). When neither exists the
 * suggestion is acknowledged honestly (`filed:false`) rather than fabricating a
 * filing — the deploy simply hasn't wired a channel yet.
 *
 * Cross-origin BY DESIGN (the widget runs on every Hanzo app). A JSON POST is
 * preflighted and `withCors` reflects only Hanzo-family origins, so requiring a
 * credential here does not open a CSRF path: a third-party page cannot get the
 * preflight past the allow-list to send it.
 */
import type { NextRequest } from 'next/server';

import { parseOwnerRepo, GitSyncError } from '@/lib/git/sync';
import { cleanLine } from '@/lib/git/summarize';
import { session } from '@/lib/iam';
import { providerFor, providerName } from '@/lib/edit/provider';
import { resolveEditToken } from '@/lib/edit/token';
import { preflight, withCors } from '@/lib/edit/cors';
import { parseContext, pickPath, renderContext } from '@/lib/edit/context';

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

  // A suggestion carries a name. Refused BEFORE the repo is touched, so an
  // unauthenticated caller learns nothing about which repos exist.
  const id = await session(req);
  if (!id) {
    return withCors(origin, { ok: false, error: 'Sign in to suggest a change.', authRequired: true }, 401);
  }
  const actor = `@${id.name}${id.isAdmin ? ' (admin)' : ''}`;

  const editToken = await resolveEditToken(req, provider, id?.token ?? null);
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

  // Auto-resolved context: the file the widget detected for this view + the
  // route/DOM/session trace, so a reviewer can find and finish the fix.
  const ctx = parseContext(body);
  const filePath = pickPath(body.path, ctx.candidateFiles);
  const contextBlock = renderContext(ctx);

  const title = `Suggestion: ${cleanLine(suggestion) || 'improve ' + (filePath || parsed.path)}`;
  const bodyLines = [
    suggestion,
    '',
    '---',
    body.url ? `Page: ${(body.url || '').slice(0, MAX_URL)}` : '',
    filePath ? `File: \`${filePath}\`` : '',
    body.context ? `\nSelected text:\n${(body.context || '').slice(0, MAX_TEXT)}` : '',
    contextBlock ? `\n${contextBlock}` : '',
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
