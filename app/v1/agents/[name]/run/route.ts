/**
 * /v1/agents/:name/run — run one agent on command.
 *
 * Proxies the canonical Hanzo Cloud `POST /v1/agents/:name/run {input}`, which
 * executes one real chat completion through the gateway and records the run.
 * Every returned run reflects an execution that actually happened — the cloud
 * records inference failures as error runs, so we surface the upstream status
 * (200 ok, 502 upstream failure, 503 no inference configured) rather than
 * hiding or fabricating a result.
 *
 * Auth + tenancy identical to the list route: forward the signed-in user's
 * IAM token (the `hanzo_token` cookie); the gateway mints `X-Org-Id`
 * (HIP-0026) from it, so one org can never run another's agent. No token →
 * 401 with `openLogin`.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import MY_TOKEN_KEY from "@/lib/get-cookie-name";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

// Matches the cloud's org-unique handle AND the URL path segment — the
// traversal guard at the boundary (mirrors agents.nameRE server-side).
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

const unauthorized = () =>
  NextResponse.json(
    { ok: false, openLogin: true, message: "Sign in to run agents" },
    { status: 401 }
  );

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return unauthorized();

  const { name } = await params;
  if (!NAME_RE.test(name)) {
    return NextResponse.json(
      { ok: false, message: "Invalid agent name" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const input = typeof body?.input === "string" ? body.input : "";

  let gateway: Response;
  try {
    gateway = await fetch(
      `${HANZO_AI_BASE_URL}/agents/${encodeURIComponent(name)}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input }),
        cache: "no-store",
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to reach the agents service." },
      { status: 502 }
    );
  }

  if (gateway.status === 401 || gateway.status === 403) return unauthorized();

  // The run body (runView) is meaningful on success AND on recorded failure
  // (502 from the cloud). Forward it with the upstream status so the client
  // can show the real output or the real error. 404/503/etc. carry the
  // cloud's honest message.
  const run = await gateway.json().catch(() => null);
  if (run) {
    return NextResponse.json(run, { status: gateway.status });
  }
  return NextResponse.json(
    { ok: false, message: `Gateway error (${gateway.status})` },
    { status: gateway.status >= 400 ? gateway.status : 502 }
  );
}
