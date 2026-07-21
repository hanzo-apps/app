/**
 * /v1/routing-defaults — server-driven smart-routing policy for the caller's
 * org.
 *
 * Proxies the single Hanzo AI gateway's `GET /v1/router/defaults`
 * (authenticated, caller-org-scoped) so ops can enable routing per-default in
 * production from admin.hanzo.ai. Mirrors the fail-soft shape of `/v1/models`:
 * it ALWAYS returns HTTP 200. When the policy is unknown — no session, gateway
 * error, an older cloud-api that 404s this endpoint, or a non-`ok` body — it
 * returns `{ present: false }` so the client falls back to the user's local
 * preference only (exactly today's behavior). Never blocks, never crashes.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import MY_TOKEN_KEY from "@/lib/get-cookie-name";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

// No org policy known → client uses local preference only. `no-store` so the
// client retries once the gateway/endpoint becomes available.
function absent() {
  return NextResponse.json(
    { ok: true, present: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Cloud-api standard wrapper: `{ status, msg, data }` (see controllers/util.go).
type CloudResp = {
  status?: string;
  data?: {
    auto_routing_active?: boolean;
    default_session_routing?: boolean;
  };
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return absent();

  let body: CloudResp;
  try {
    // Per-user, authorized request — never share across users in Next's data
    // cache. Throttled by the response Cache-Control below.
    const res = await fetch(`${HANZO_AI_BASE_URL}/router/defaults`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return absent(); // 404 on older cloud-api → fail-soft
    body = (await res.json()) as CloudResp;
  } catch {
    return absent();
  }

  if (body.status !== "ok" || !body.data) return absent();

  return NextResponse.json(
    {
      ok: true,
      present: true,
      autoRoutingActive: body.data.auto_routing_active === true,
      defaultSessionRouting: body.data.default_session_routing === true,
    },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
