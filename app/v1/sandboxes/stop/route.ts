/**
 * /v1/sandboxes/stop — stop the work, keep the box.
 *
 * Two verbs exist upstream and they are not the same act: `stop` interrupts what
 * a sandbox is RUNNING; `end` releases the sandbox itself. A person watching a
 * command go wrong wants the first — the checkout, the half-written file and
 * everything the run has said so far are the reason they are watching — and a
 * Stop button wired to the second would take all of it with the command.
 *
 * So this relays `stop` and nothing else. Releasing a sandbox already has its own
 * caller (`releaseSandbox`, on the run's own way out) and no button.
 *
 * Cookie-authenticated and it acts on a resource, so it refuses cross-origin
 * before doing anything. The sandbox named is checked against the caller's org by
 * cloud, from the bearer — a stranger's id is a 404 there, never a stop here.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { refusal } from "@/lib/gateway";
import { session } from "@/lib/iam";
import { requireSameOrigin } from "@/lib/org/csrf";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = (await session(request))?.token;
  if (!token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: "Sign in to stop a run" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ ok: false, message: "id required" }, { status: 400 });
  }

  const gateway = await fetch(`${HANZO_AI_BASE_URL}/sandboxes/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
    signal: request.signal,
  }).catch(() => null);

  if (!gateway?.ok) {
    const detail = gateway ? await gateway.text().catch(() => "") : "";
    const { body: refused, status } = refusal(gateway?.status ?? 502, detail);
    return NextResponse.json(refused, { status });
  }

  // `{stopped: N}`, and zero is an ANSWER: a command that ended a moment ago is
  // one there was nothing left to stop. The caller renders that as stopped, not
  // as a failure.
  const stopped = (await gateway.json().catch(() => ({}))) as { stopped?: number };
  return NextResponse.json(
    { ok: true, stopped: stopped.stopped ?? 0 },
    { headers: { "Cache-Control": "no-store" } }
  );
}
