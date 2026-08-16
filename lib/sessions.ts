// Server-side Hanzo agent-session client.
//
// Binds hanzo.app to the cloud /v1/agents/sessions registry — the live coding
// sessions on the org's machines, the same registry `hanzo code` registers into.
// This module REIMPLEMENTS nothing: it does not run terminals, track liveness, or
// keep a roster of its own. There is exactly one session plane, and this reads it.
//
// IAM-native, per-org, fail-closed, exactly as lib/platform.ts: every call is
// made AS the logged-in user by forwarding that user's IAM access token, and the
// control plane derives the org from the token owner. The browser never sends an
// org, so a user can only ever see their own org's sessions.

import { API_BASE, PlatformAuthError, PlatformError } from './platform';

/** Base for the live agent-session registry. */
export const SESSIONS_BASE = `${API_BASE}/v1/agents/sessions`;

/** Session lifecycle, as the control plane models it. */
export type SessionStatus = 'running' | 'paused' | 'done' | 'error';

/** One session, as /v1/agents/sessions reports it. */
export interface AgentSession {
  id: string;
  org: string;
  agent: string;
  actor?: string;
  status: SessionStatus;
  rootSessionId: string;
  parentSessionId?: string;
  title?: string;
  /** Execution context — the machine, repo and cwd this session runs on. */
  host?: string;
  cwd?: string;
  repo?: string;
  /**
   * Where this session's live terminal can be watched. Absent when the machine
   * publishes none, which is the normal case for a session nobody shared.
   */
  terminal?: string;
  provider?: string;
  account?: string;
  events: number;
  children: number;
  /** RFC3339 — the control plane formats these, so they are strings here. */
  startedAt: string;
  endedAt?: string;
  updatedAt: string;
}

export interface SessionList {
  sessions: AgentSession[];
}

/**
 * List the caller's org's sessions. `token` is the user's IAM access token,
 * forwarded verbatim as the bearer so the control plane attributes the request —
 * and derives the org — from that identity.
 *
 * With no filter the registry returns ROOT sessions only, so this shows one row
 * per flow rather than one per subagent.
 */
export async function listSessions(
  token: string,
  opts: { status?: SessionStatus; limit?: number } = {},
): Promise<SessionList> {
  if (!token) throw new PlatformAuthError();

  const q = new URLSearchParams();
  if (opts.status) q.set('status', opts.status);
  if (opts.limit) q.set('limit', String(opts.limit));
  // `toString()`, never `q.size`: that property is recent (Node 19 / Chrome 113)
  // and reads as `undefined` where it is missing, so the ternary is silently
  // false and the filter is DROPPED — the caller asks for running sessions and
  // is handed every session, with nothing reporting a problem.
  const qs = q.toString();
  const url = qs ? `${SESSIONS_BASE}?${qs}` : SESSIONS_BASE;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) throw new PlatformError(res.status, text);
  return (text ? JSON.parse(text) : { sessions: [] }) as SessionList;
}

/** True while a session is still doing something — the two non-terminal states. */
export function isActive(s: AgentSession): boolean {
  return s.status === 'running' || s.status === 'paused';
}
