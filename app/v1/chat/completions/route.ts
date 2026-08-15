/**
 * /v1/chat/completions — the chat mode's ONE inference relay.
 *
 * Same posture as /v1/generate (the builder's relay): the signed-in user's
 * verified IAM bearer is forwarded to the single Hanzo AI gateway
 * (`${HANZO_AI_BASE_URL}/chat/completions`) — the gateway debits the per-user
 * hk- key and owns all provider routing. No shared server key, no fallback:
 * billing is per-user by design, so no session is an honest 401.
 *
 * Unlike /v1/generate (which strips the stream to plain text for the page
 * parser), chat relays the gateway's OpenAI-compatible SSE VERBATIM — the
 * client renders deltas as they arrive and needs nothing re-encoded.
 */
import { DATA_COLLECTION_HEADER } from '@hanzo/ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { session } from '@/lib/iam';
import { resolveModelId } from '@/lib/providers';
import { requireSameOrigin } from '@/lib/org/csrf';

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || 'https://api.hanzo.ai/v1';

// Bounds — cost inputs on the caller's own key, clamped before anything leaves
// this process. Cloud clamps too; we still never forward an unbounded body.
const MAX_MESSAGES = 200;
const MAX_CONTENT = 256 * 1024;

type Role = 'system' | 'user' | 'assistant';
const ROLES = new Set<Role>(['system', 'user', 'assistant']);

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = (await session(request))?.token;
  if (!token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: 'Sign in to chat' },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const raw = Array.isArray(body?.messages) ? body.messages : null;
  if (!raw?.length) {
    return NextResponse.json({ ok: false, message: 'messages required' }, { status: 400 });
  }
  if (raw.length > MAX_MESSAGES) {
    return NextResponse.json({ ok: false, message: 'too many messages' }, { status: 400 });
  }
  const messages: { role: Role; content: string }[] = [];
  for (const m of raw) {
    const role = m?.role as Role;
    const content = m?.content;
    if (!ROLES.has(role) || typeof content !== 'string' || content.length > MAX_CONTENT) {
      return NextResponse.json({ ok: false, message: 'invalid message' }, { status: 400 });
    }
    messages.push({ role, content });
  }

  const gateway = await fetch(`${HANZO_AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: resolveModelId(typeof body.model === 'string' ? body.model : undefined),
      messages,
      stream: true,
    }),
    signal: request.signal,
  });

  if (!gateway.ok || !gateway.body) {
    const detail = await gateway.text().catch(() => '');
    if (gateway.status === 401 || gateway.status === 403) {
      return NextResponse.json(
        { ok: false, openLogin: true, message: 'Sign in to chat' },
        { status: 401 },
      );
    }
    if (gateway.status === 402) {
      return NextResponse.json(
        { ok: false, needCredits: true, message: detail || "You're out of credits." },
        { status: 402 },
      );
    }
    // 503 is the gateway saying no paid provider can serve. It is relayed as
    // itself rather than flattened into 502, because the client answers an
    // outage the free route clears differently from one it does not.
    if (gateway.status === 503) {
      return NextResponse.json(
        { ok: false, message: detail || 'No paid model can serve right now.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, message: detail || `Gateway error (${gateway.status})` },
      { status: 502 },
    );
  }

  // Verbatim SSE passthrough — the gateway's stream IS the response. The
  // data-collection header rides along: the gateway states whether a reply was
  // served on a data-shared route, and only the client can act on it.
  const collection = gateway.headers.get(DATA_COLLECTION_HEADER);
  return new NextResponse(gateway.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...(collection ? { [DATA_COLLECTION_HEADER]: collection } : {}),
    },
  });
}
