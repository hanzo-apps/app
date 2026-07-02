/**
 * /v1/models — Hanzo-native model discovery.
 *
 * Proxies the single Hanzo AI gateway's OpenAI-compatible `GET /v1/models`.
 * The gateway's provider registry owns which models are reachable (Zen/DO
 * internal, BYOK, linked clouds, custom providers), so the builder never
 * fans out to per-provider APIs — it asks the gateway once.
 *
 * Auth is per-user: we forward the signed-in user's IAM token (the
 * `hanzo_token` cookie). No token → honest 401.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEFAULT_MODEL } from "@/lib/providers";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: "Sign in to build" },
      { status: 401 }
    );
  }

  const gateway = await fetch(`${HANZO_AI_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!gateway.ok) {
    if (gateway.status === 401 || gateway.status === 403) {
      return NextResponse.json(
        { ok: false, openLogin: true, message: "Sign in to build" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { ok: false, message: `Gateway error (${gateway.status})` },
      { status: 502 }
    );
  }

  const data = await gateway.json();
  const models: string[] = (data.data ?? [])
    .map((m: { id?: string }) => m.id)
    .filter(Boolean);

  return NextResponse.json({ ok: true, defaultModel: DEFAULT_MODEL, models });
}
