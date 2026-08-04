/**
 * /v1/chat/conversations/:id — one conversation: messages (GET) + rename (PATCH).
 * Persistence is cloud /v1/agents/sessions (lib/chat/server.ts).
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { resolveScope } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';
import { getConversation, renameConversation, UpstreamError, relayStatus } from '@/lib/chat/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const unauthorized = () =>
  NextResponse.json({ ok: false, openLogin: true, message: 'Sign in to chat' }, { status: 401 });

const upstream = (err: unknown) =>
  err instanceof UpstreamError
    ? NextResponse.json({ ok: false, message: err.message }, { status: relayStatus(err.status) })
    : NextResponse.json({ ok: false, message: 'Chat history is unavailable.' }, { status: 502 });

export async function GET(request: NextRequest, { params }: RouteParams) {
  const scope = await resolveScope(request);
  if (!scope?.token) return unauthorized();
  const { id } = await params;
  try {
    const { conversation, messages } = await getConversation(scope, id);
    return NextResponse.json({ ok: true, conversation, messages });
  } catch (err) {
    return upstream(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const scope = await resolveScope(request);
  if (!scope?.token) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ ok: false, message: 'title required' }, { status: 400 });
  try {
    await renameConversation(scope, id, title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return upstream(err);
  }
}
