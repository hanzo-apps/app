/**
 * /v1/agents/sessions/stream — the relay for the one live feed of a run.
 *
 * Cloud keeps every run's narration in a durable ordered log and serves it as
 * Server-Sent Events, org-scoped, narrowable to one run with `?root=`. This is
 * the browser's way in, and it exists because the browser has no other: the CSP
 * (`lib/security/middleware.ts`) allows `connect-src 'self'` only, so an
 * `EventSource` pointed at api.hanzo.ai never leaves the tab. The session cookie
 * is verified here and the caller's OWN bearer is what goes upstream — same
 * posture as `/v1/chat/completions`, no shared key, no second transport.
 *
 * Only `root` is forwarded. Everything else a client appends is dropped, for the
 * same reason `/v1/agents/sessions` drops it: the tenant is cloud's to decide
 * from the bearer, and a query parameter is not evidence of anything.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { refusal } from "@/lib/gateway";
import { session } from "@/lib/iam";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

export async function GET(request: NextRequest) {
  const token = (await session(request))?.token;
  if (!token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: "Sign in to watch a run" },
      { status: 401 }
    );
  }

  const upstream = new URL(`${HANZO_AI_BASE_URL}/agents/sessions/stream`);
  const root = request.nextUrl.searchParams.get("root")?.trim();
  if (root) upstream.searchParams.set("root", root);

  const feed = await fetch(upstream, {
    headers: { Accept: "text/event-stream", Authorization: `Bearer ${token}` },
    // The caller hanging up is what ends this: cloud detects the closed socket on
    // its next write, so the subscription dies with the tab rather than living on
    // as a heartbeat nobody reads.
    signal: request.signal,
    cache: "no-store",
  }).catch(() => null);

  if (!feed?.ok || !feed.body) {
    const detail = feed ? await feed.text().catch(() => "") : "";
    const { body, status } = refusal(feed?.status ?? 502, detail);
    return NextResponse.json(body, { status });
  }

  // Verbatim passthrough — cloud's stream IS the response. `X-Accel-Buffering`
  // is what stops a proxy holding frames back until the buffer fills, which on a
  // feed whose whole value is arriving early is indistinguishable from a hang.
  return new NextResponse(feed.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
