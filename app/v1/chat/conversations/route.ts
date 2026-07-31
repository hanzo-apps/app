/**
 * /v1/chat/conversations — list + create chat conversations.
 *
 * A conversation is a cloud `/v1/agents/sessions` row tagged `agent: "chat"`
 * (lib/chat/server.ts). Cloud owns persistence — this route only scopes the
 * call to the verified caller and maps shapes.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { resolveScope } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';
import { listConversations, createConversation, UpstreamError, relayStatus } from '@/lib/chat/server';

const unauthorized = () =>
  NextResponse.json({ ok: false, openLogin: true, message: 'Sign in to chat' }, { status: 401 });

const upstream = (err: unknown) =>
  err instanceof UpstreamError
    ? NextResponse.json({ ok: false, message: err.message }, { status: relayStatus(err.status) })
    : NextResponse.json({ ok: false, message: 'Chat history is unavailable.' }, { status: 502 });

export async function GET(request: NextRequest) {
  const scope = await resolveScope(request);
  if (!scope?.token) return unauthorized();
  try {
    return NextResponse.json({ ok: true, conversations: await listConversations(scope) });
  } catch (err) {
    return upstream(err);
  }
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const scope = await resolveScope(request);
  if (!scope?.token) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  try {
    const conversation = await createConversation(scope, title || 'New chat');
    return NextResponse.json({ ok: true, conversation }, { status: 201 });
  } catch (err) {
    return upstream(err);
  }
}
