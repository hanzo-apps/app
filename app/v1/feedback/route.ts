/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * /v1/feedback — the content-free reward-signal BFF.
 *
 * Router training needs production feedback keyed on the gateway response id
 * (the `chatcmpl-…` the routing ledger on api.hanzo.ai keys on). The gateway's
 * `/v1/feedback` handler is ORG-SCOPED to the caller principal, so we preserve
 * the user's identity exactly like `/v1/generate`: forward the signed-in user's
 * IAM token (`hanzo_token` cookie) as `Authorization: Bearer <token>`.
 *
 * Guarantees:
 *  - The payload is whitelisted to EXACTLY {request_id, signal, rating?} — any
 *    other field is stripped, so no prompt/response/filename/code/HTML can ever
 *    transit this route.
 *  - Fire-and-forget: it returns 204 quickly and swallows every upstream error;
 *    a feedback failure never surfaces to the client and never blocks UX.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { requireSameOrigin } from "@/lib/org/csrf";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

const SIGNALS = new Set([
  "up",
  "down",
  "regenerate",
  "switch",
  "abandon",
  "accept",
  "revert",
  "rating",
]);

const noContent = () => new NextResponse(null, { status: 204 });

/**
 * `HANZO_FEEDBACK` = "0" | "false" | "off" is the LOCAL kill-switch that no-ops
 * this route. The preferred enforcement is server-side org/user training opt-in
 * on the gateway itself; this env is only the deployment-level off switch.
 */
function feedbackDisabled(): boolean {
  const v = (process.env.HANZO_FEEDBACK || "").trim().toLowerCase();
  return v === "0" || v === "false" || v === "off";
}

export async function POST(request: NextRequest) {
  // CSRF: cookie-authenticated + org-scoped write — refuse cross-origin first.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);

  // Validate + whitelist to exactly {request_id, signal, rating?}. Anything the
  // client sent beyond these three keys is dropped here and never forwarded.
  const requestId =
    typeof body?.request_id === "string" ? body.request_id.trim() : "";
  const signal = body?.signal;
  if (!requestId || typeof signal !== "string" || !SIGNALS.has(signal)) {
    return NextResponse.json(
      { ok: false, message: "Invalid feedback signal" },
      { status: 400 }
    );
  }

  const payload: { request_id: string; signal: string; rating?: number } = {
    request_id: requestId,
    signal,
  };
  if (signal === "rating") {
    const rating = body?.rating;
    if (rating !== 1 && rating !== 2 && rating !== 3) {
      return NextResponse.json(
        { ok: false, message: "rating must be 1-3 for a rating signal" },
        { status: 400 }
      );
    }
    payload.rating = rating;
  }

  // Local kill-switch: accept the request but do not forward.
  if (feedbackDisabled()) return noContent();

  // No signed-in user → nothing to attribute; no-op silently (never a 401).
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return noContent();

  // Fire-and-forget: await so the request is actually sent, but swallow every
  // outcome (network error OR a non-2xx upstream) and always answer 204.
  try {
    await fetch(`${HANZO_AI_BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Swallow: a feedback failure must never surface to the client.
  }

  return noContent();
}
