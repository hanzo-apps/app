/**
 * /v1/agents — the console's per-org agent registry BFF.
 *
 * Proxies the single Hanzo Cloud agents surface (`${HANZO_AI_BASE_URL}/agents`,
 * the canonical `/v1/agents` registry) so the console never talks to the cloud
 * from the browser. Tenant isolation is the gateway-minted `X-Org-Id`
 * (HIP-0026) derived from the validated IAM token — NEVER a client-supplied
 * header — so we forward only the bearer and let the gateway scope the org.
 *
 * Auth is per-user: we forward the signed-in user's IAM token (the
 * `hanzo_token` cookie mirrored from the @hanzo/iam SDK). No token → honest
 * 401 with `openLogin` so the client opens the login flow. No shared server
 * key fallback — reads and runs are always the caller's own org.
 *
 * The response is per-user org data, so it is marked `no-store`: no shared or
 * edge cache may ever serve one org's agent list to another.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import MY_TOKEN_KEY from "@/lib/get-cookie-name";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

const NO_STORE = { "Cache-Control": "no-store" } as const;

const unauthorized = () =>
  NextResponse.json(
    { ok: false, openLogin: true, message: "Sign in to view agents" },
    { status: 401, headers: NO_STORE }
  );

export async function GET(request: NextRequest) {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return unauthorized();

  let gateway: Response;
  try {
    gateway = await fetch(`${HANZO_AI_BASE_URL}/agents`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to reach the agents service." },
      { status: 502, headers: NO_STORE }
    );
  }

  if (!gateway.ok) {
    if (gateway.status === 401 || gateway.status === 403) return unauthorized();
    return NextResponse.json(
      { ok: false, message: `Gateway error (${gateway.status})` },
      { status: 502, headers: NO_STORE }
    );
  }

  // The cloud contract is {agents:[...]}; forward it verbatim so the client
  // consumes the canonical shape directly.
  const data = await gateway.json().catch(() => ({ agents: [] }));
  const agents = Array.isArray(data?.agents) ? data.agents : [];
  return NextResponse.json({ ok: true, agents }, { headers: NO_STORE });
}
