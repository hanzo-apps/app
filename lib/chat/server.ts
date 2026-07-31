/**
 * Chat-mode persistence — a thin BFF over cloud's canonical /v1/agents/sessions
 * registry (the ONE ordered-log-of-turns surface every Hanzo product hangs off).
 *
 * A conversation IS a session tagged `agent: "chat"`; a message IS a session
 * event of kind `message` whose payload is `{ role, content, model? }`. Nothing
 * is stored app-side — cloud owns the log, org-scoped and fail-closed, exactly
 * as it does for hanzo.bot and the @hanzo/dev CLI. This module only maps the
 * session/event shapes to the chat client's shapes.
 */
import 'server-only';

import { cloudBase, type Scope } from '@/lib/org/server';

/** The agent label that marks a session as a chat conversation. */
export const CHAT_AGENT = 'chat';

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  at?: string;
}

interface SessionView {
  id: string;
  agent?: string;
  title?: string;
  status?: string;
  updatedAt?: string;
  events?: number;
}

interface EventView {
  kind?: string;
  payload?: unknown;
  createdAt?: string;
}

const headers = (scope: Scope): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${scope.token}`,
  // Cloud re-mints the tenant from the verified bearer; the header is honored
  // only for a global admin acting cross-org (same posture as forwardProjects).
  ...(scope.crossOrg ? { 'X-Org-Id': scope.org } : {}),
});

const sessions = () => `${cloudBase()}/v1/agents/sessions`;

const toConversation = (s: SessionView): Conversation => ({
  id: s.id,
  title: s.title || 'New chat',
  updatedAt: s.updatedAt || '',
  messageCount: s.events ?? 0,
});

/** List the caller's chat conversations, newest first. */
export async function listConversations(scope: Scope): Promise<Conversation[]> {
  const res = await fetch(`${sessions()}?limit=200`, { headers: headers(scope) });
  if (!res.ok) throw new UpstreamError(res.status, await res.text().catch(() => ''));
  const body = (await res.json()) as { sessions?: SessionView[] };
  return (body.sessions ?? [])
    .filter((s) => s.agent === CHAT_AGENT)
    .map(toConversation)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** Create a conversation (a chat-tagged session). */
export async function createConversation(scope: Scope, title: string): Promise<Conversation> {
  const res = await fetch(sessions(), {
    method: 'POST',
    headers: headers(scope),
    body: JSON.stringify({ agent: CHAT_AGENT, title: title.slice(0, 200) }),
  });
  if (!res.ok) throw new UpstreamError(res.status, await res.text().catch(() => ''));
  return toConversation((await res.json()) as SessionView);
}

/** One conversation + its messages (the session's ordered message events). */
export async function getConversation(
  scope: Scope,
  id: string,
): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  const res = await fetch(`${sessions()}/${encodeURIComponent(id)}`, { headers: headers(scope) });
  if (!res.ok) throw new UpstreamError(res.status, await res.text().catch(() => ''));
  const body = (await res.json()) as SessionView & { recentEvents?: EventView[] };
  const messages: ChatMessage[] = [];
  for (const e of body.recentEvents ?? []) {
    if (e.kind !== 'message') continue;
    const p = e.payload as Partial<ChatMessage> | undefined;
    if (!p || typeof p.content !== 'string') continue;
    const role = p.role === 'assistant' || p.role === 'system' ? p.role : 'user';
    messages.push({ role, content: p.content, model: p.model, at: e.createdAt });
  }
  return { conversation: toConversation(body), messages };
}

/** Rename a conversation. */
export async function renameConversation(scope: Scope, id: string, title: string): Promise<void> {
  const res = await fetch(`${sessions()}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers(scope),
    body: JSON.stringify({ title: title.slice(0, 200) }),
  });
  if (!res.ok) throw new UpstreamError(res.status, await res.text().catch(() => ''));
}

/** Append one message to the conversation's ordered log. */
export async function appendMessage(scope: Scope, id: string, m: ChatMessage): Promise<void> {
  const res = await fetch(`${sessions()}/${encodeURIComponent(id)}/events`, {
    method: 'POST',
    headers: headers(scope),
    body: JSON.stringify({
      kind: 'message',
      payload: { role: m.role, content: m.content, ...(m.model ? { model: m.model } : {}) },
    }),
  });
  if (!res.ok) throw new UpstreamError(res.status, await res.text().catch(() => ''));
}

/** An upstream cloud refusal, carried with its actionable status. */
export class UpstreamError extends Error {
  constructor(
    public status: number,
    detail: string,
  ) {
    super(detail || `cloud replied ${status}`);
  }
}

/** Map an upstream failure to the status this BFF answers with (401/402/403/429 pass, else 502). */
export const relayStatus = (status: number): number =>
  [401, 402, 403, 404, 429].includes(status) ? status : 502;
