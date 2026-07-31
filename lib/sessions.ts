// Server-side Hanzo Sessions client.
//
// Binds hanzo.app to the cloud /v1/sessions roster — the live coding sessions on
// the org's machines, each publishing a terminal through zrok. This module
// REIMPLEMENTS nothing: it does not run terminals, hold shares, or track
// liveness. The roster and its TTL live in the control plane; this reads them.
//
// IAM-native, per-org, fail-closed, exactly as lib/platform.ts: every call is
// made AS the logged-in user by forwarding that user's IAM access token, and
// /v1/sessions derives the org from the token owner. The browser never sends an
// org, so a user can only ever see their own org's sessions. A call with no user
// token fails closed.

import { API_BASE, PlatformAuthError, PlatformError } from './platform';

/** Base for the live-session roster. */
export const SESSIONS_BASE = `${API_BASE}/v1/sessions`;

/** One live coding session, as /v1/sessions reports it. */
export interface CodingSession {
  id: string;
  host: string;
  workspace: string;
  repo?: string;
  branch?: string;
  agent?: string;
  /** The terminal's public URL — always https, enforced server-side. */
  url: string;
  startedAt: number;
  beatAt: number;
}

export interface SessionRoster {
  sessions: CodingSession[];
  /**
   * How long a session stays listed after its last heartbeat. It travels with
   * the roster so the UI can show a session going stale instead of hardcoding a
   * guess that drifts from the server's.
   */
  ttlSeconds: number;
}

/**
 * List the caller's org's live coding sessions. `token` is the user's IAM access
 * token, forwarded verbatim as the bearer so the control plane attributes the
 * request — and derives the org — from that identity.
 */
export async function listSessions(token: string): Promise<SessionRoster> {
  if (!token) throw new PlatformAuthError();

  const res = await fetch(SESSIONS_BASE, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) throw new PlatformError(res.status, text);
  return (text ? JSON.parse(text) : { sessions: [], ttlSeconds: 0 }) as SessionRoster;
}

/**
 * True while a session's last heartbeat is inside the roster's TTL. The server
 * already filters on this; the UI re-derives it so a list that is a few seconds
 * old visibly ages rather than showing a dead terminal as live.
 */
export function isLive(session: CodingSession, ttlSeconds: number, now = Date.now()): boolean {
  return now / 1000 - session.beatAt <= ttlSeconds;
}
