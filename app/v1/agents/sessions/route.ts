/**
 * /v1/agents/sessions — the signed-in user's own agent sessions.
 *
 * The account surface: "the chats behind my projects". Reads the canonical
 * `/v1/agents/sessions` registry with the caller's own IAM token, so the org is
 * the gateway-minted `X-Org-Id` (HIP-0026) derived from that token and never a
 * client-supplied header. No shared server key: you see your org's sessions or
 * you see a 401.
 *
 * This route exists — unlike the public /builds pages, which fetch the cloud
 * directly — for exactly one reason: these reads are CREDENTIALED, and the
 * browser must never hold a cloud token. Per-user data, so `no-store`: no shared
 * or edge cache may serve one org's sessions to another.
 *
 * `?project=` narrows to one product's sessions, which is how a project page
 * shows its own chat history.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { session } from "@/lib/iam";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const token = (await session(request))?.token;
  if (!token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: "Sign in to see your builds" },
      { status: 401, headers: NO_STORE }
    );
  }

  // Only the filters this surface owns are forwarded; anything else a client
  // appends is dropped rather than passed through to the cloud.
  const project = request.nextUrl.searchParams.get("project");
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";

  let gateway: Response;
  try {
    gateway = await fetch(`${HANZO_AI_BASE_URL}/agents/sessions${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to reach the sessions service." },
      { status: 502, headers: NO_STORE }
    );
  }

  const body = await gateway.text();
  return new NextResponse(body, {
    status: gateway.status,
    headers: {
      ...NO_STORE,
      "Content-Type": gateway.headers.get("Content-Type") || "application/json",
    },
  });
}
