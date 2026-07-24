/**
 * Resolve the FORGE token the Edit flow acts with — server-side only.
 *
 * Priority:
 *   1. The signed-in user's OWN linked-provider OAuth token (resolved from IAM by
 *      `lib/git/server.ts` — the SAME path the builder's git-sync uses; the token
 *      never reaches the browser). A fork/PR then lands under the user's account.
 *   2. A configured Hanzo bot token (`HANZO_EDIT_BOT_TOKEN`) — the fallback for a
 *      user with no linked forge, so an admin without a personal GitHub link can
 *      still fork→PR under a Hanzo bot identity. NEVER hardcoded; absent ⇒ skipped.
 *
 * Fail-closed: no linked token and no bot ⇒ null (the route returns an honest
 * "connect GitHub to open a PR").
 */
import 'server-only';

import type { NextRequest } from 'next/server';

import { resolveConnection } from '@/lib/git/server';
import type { GitProvider as LinkedProvider } from '@/lib/api/git';

import type { ProviderName } from './provider';

export interface EditToken {
  token: string;
  /** The forge login the token acts as (fork owner / head-ref owner). */
  login: string;
  source: 'user' | 'bot';
}

/** Map the Edit provider name to the IAM-linked provider key (Gitea = our own git). */
function linkedKey(p: ProviderName): LinkedProvider {
  return p === 'gitea' ? 'hanzo' : p;
}

/** The optional server bot identity for a chosen forge (env-configured, never hardcoded). */
function botToken(p: ProviderName): EditToken | null {
  if (p !== 'github') return null; // increment 1: only a GitHub bot is wired
  const token = process.env.HANZO_EDIT_BOT_TOKEN;
  if (!token) return null;
  return { token, login: process.env.HANZO_EDIT_BOT_LOGIN || 'hanzo-bot', source: 'bot' };
}

/**
 * Resolve the acting forge token. `bearer` is the caller's IAM bearer (already
 * read via `readWidgetBearer`), used to fetch their linked-provider token; it is
 * null on the anonymous suggest path, which falls straight through to the bot.
 */
export async function resolveEditToken(
  req: NextRequest,
  provider: ProviderName,
  bearer: string | null,
): Promise<EditToken | null> {
  if (bearer) {
    const conn = await resolveConnection(req, linkedKey(provider), bearer);
    if (conn?.token) {
      return { token: conn.token, login: conn.login || '', source: 'user' };
    }
  }
  return botToken(provider);
}
