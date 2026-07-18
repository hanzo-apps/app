/**
 * /v1/agent — Track B agentic coding harness (D1), flag-gated.
 *
 * A server-side, tool-using agent loop over a project's files. Unlike
 * `/v1/generate` (single-shot HTML streaming, no tools), this endpoint runs a
 * bounded reason→act loop: the model calls a minimal MCP-shaped toolset
 * (list_files / read_file / search_files / write_file / apply_patch) against an
 * in-memory project snapshot, and we stream its reasoning + tool use + result
 * back as Server-Sent Events. See docs/AGENTIC-CODING.md for the full harness
 * (per-project sandbox pods + hanzo MCP + hanzo/dev exec-server) this seeds.
 *
 * NOT wired into the live builder UI yet — it is gated behind the server env
 * flag `AGENT_SERVER_ENABLED` (returns 404 when off), so it ships dark until the
 * chat panel opts in behind `NEXT_PUBLIC_AGENT_SERVER`.
 *
 * Auth mirrors `/v1/generate` exactly: same-origin CSRF guard + the caller's
 * IAM bearer (`hanzo_token` cookie) forwarded to the gateway. Billing is
 * per-user; there is no shared server key. Tenant isolation is the
 * gateway-minted `X-Org-Id` derived from that bearer — never client-supplied.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { requireSameOrigin } from "@/lib/org/csrf";
import { resolveModelId } from "@/lib/providers";
import { runAgent, type AgentEvent, type AgentFile } from "@/lib/agent";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

/** D1 ships dark: the loop only serves when explicitly enabled server-side. */
function agentEnabled(): boolean {
  const v = (process.env.AGENT_SERVER_ENABLED || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

const notFound = () => NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

const unauthorized = () =>
  NextResponse.json(
    { ok: false, openLogin: true, message: "Sign in to run the agent" },
    { status: 401 }
  );

interface AgentRequestBody {
  prompt?: unknown;
  model?: unknown;
  files?: unknown;
  maxTurns?: unknown;
}

/** Validate and normalize the incoming project file list. */
function parseFiles(raw: unknown): AgentFile[] {
  if (!Array.isArray(raw)) return [];
  const out: AgentFile[] = [];
  for (const f of raw) {
    if (f && typeof f === "object") {
      const path = (f as { path?: unknown }).path;
      const content = (f as { content?: unknown }).content;
      if (typeof path === "string" && typeof content === "string") {
        out.push({ path, content });
      }
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  if (!agentEnabled()) return notFound();

  // Cookie-authenticated + spends AI credit — refuse cross-origin before work.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return unauthorized();

  let body: AgentRequestBody;
  try {
    body = (await request.json()) as AgentRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ ok: false, message: "Missing prompt" }, { status: 400 });
  }

  const model = resolveModelId(typeof body.model === "string" ? body.model : undefined);
  const files = parseFiles(body.files);
  const maxTurns =
    typeof body.maxTurns === "number" && Number.isFinite(body.maxTurns)
      ? body.maxTurns
      : undefined;

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  // Each AgentEvent is one SSE `data:` frame of JSON — the UI reads `type` to
  // pick a card (reasoning / tool_call / tool_result / text), same event shapes
  // the client orchestrator already renders.
  const emit = async (event: AgentEvent) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };

  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });

  (async () => {
    try {
      await runAgent(
        {
          token,
          baseUrl: HANZO_AI_BASE_URL,
          model,
          prompt,
          files,
          maxTurns,
          signal: request.signal,
        },
        emit
      );
    } catch (error) {
      try {
        await emit({
          type: "error",
          message: error instanceof Error ? error.message : "Agent run failed",
        });
      } catch {
        // stream already broken
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return response;
}
