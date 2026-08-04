/**
 * /v1/chat/conversations/:id/messages — append one turn to the conversation's
 * ordered log (a cloud session `message` event). Cloud owns the log.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { resolveScope } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';
import { appendMessage, UpstreamError, relayStatus } from '@/lib/chat/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Cloud caps an event payload at 64KiB; refuse before the round-trip.
const MAX_CONTENT = 60 * 1024;

export async function POST(request: NextRequest, { params }: RouteParams) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const scope = await resolveScope(request);
  if (!scope?.token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: 'Sign in to chat' },
      { status: 401 },
    );
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const role = body?.role === 'assistant' || body?.role === 'system' ? body.role : 'user';
  const content = typeof body?.content === 'string' ? body.content : '';
  if (!content || content.length > MAX_CONTENT) {
    return NextResponse.json({ ok: false, message: 'content required (≤60KB)' }, { status: 400 });
  }
  const model = typeof body?.model === 'string' ? body.model : undefined;
  try {
    await appendMessage(scope, id, { role, content, model });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return err instanceof UpstreamError
      ? NextResponse.json({ ok: false, message: err.message }, { status: relayStatus(err.status) })
      : NextResponse.json({ ok: false, message: 'Chat history is unavailable.' }, { status: 502 });
  }
}
