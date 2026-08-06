/**
 * /v1/agents/runs — the agentic coding harness.
 *
 * A server-side, tool-using agent loop over a project's files. Unlike
 * `/v1/generate` (single-shot HTML streaming, no tools), this endpoint runs a
 * bounded reason→act loop: the model calls a minimal MCP-shaped toolset
 * (list_files / read_file / search_files / write_file / apply_patch) against an
 * in-memory project snapshot, and we stream its reasoning + tool use + result
 * back as Server-Sent Events. See docs/AGENTIC-CODING.md for the full harness
 * (per-project sandbox pods + hanzo MCP + hanzo/dev exec-server) this seeds.
 *
 * Serves unconditionally. It spent its life behind an env flag that was set in
 * no deployment anywhere, which is not caution — it is an endpoint nobody can
 * reach, written and reviewed and then never run. Auth and billing already
 * carry the real weight here; the flag added nothing they do not.
 *
 * Auth mirrors `/v1/generate` exactly: same-origin CSRF guard + the caller's
 * verified IAM bearer forwarded to the gateway. Billing is
 * per-user; there is no shared server key. Tenant isolation is the
 * gateway-minted `X-Org-Id` derived from that bearer — never client-supplied.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { session } from "@/lib/iam";
import { requireSameOrigin } from "@/lib/org/csrf";
import { resolveModelId } from "@/lib/providers";
import { runAgent, type AgentEvent, type AgentFile, type ProjectFs } from "@/lib/agent";
import { AgentSession } from "@/lib/agent/session";
import { Sandbox, openSandbox, releaseSandbox } from "@/lib/agent/sandbox";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

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
  /** Run in this existing box. */
  id?: unknown;
  /** Run in a box for this project, creating one if there is none. */
  project?: unknown;
}

/**
 * Where this run edits.
 *
 * Three cases, in order of how specific the caller was:
 *
 *   id    a box the caller already holds — reuse it, do not create a second.
 *   project  a named project — cloud gets or creates its box, and the agent
 *            edits a REAL checkout with a real toolchain it can run.
 *   neither  the scratch case: a handful of files in this process. Most runs.
 *            It stays in memory deliberately — a throwaway HTML page does not
 *            need a pod, and paying for one would make the fast path slow.
 *
 * A box that cannot be reached falls back to memory rather than failing the
 * user's run: the agent does less (no `run_command`, and it is told so), but
 * the work still happens. `agentToolDefs` derives the toolset from whichever
 * filesystem comes back, so the model is never offered a capability that the
 * fallback does not have.
 *
 * `opened` records which of the two box cases we are in, because it decides who
 * hangs the box up at the end. A caller-supplied `id` belongs to the caller
 * and must outlive the run; a box opened here for `project` has no other owner.
 */
async function resolveFs(
  token: string,
  body: AgentRequestBody,
  files: AgentFile[]
): Promise<{ fs?: ProjectFs; id?: string; opened?: boolean }> {
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (id) {
    return { fs: new Sandbox({ baseUrl: HANZO_AI_BASE_URL, id, token }), id };
  }

  const project = typeof body.project === "string" ? body.project.trim() : "";
  if (project) {
    const box = await openSandbox({ baseUrl: HANZO_AI_BASE_URL, token, project });
    if (box) {
      return {
        fs: new Sandbox({ baseUrl: HANZO_AI_BASE_URL, id: box.id, token }),
        id: box.id,
        opened: true,
      };
    }
  }

  // No box: the loop builds an in-memory project from `files` itself.
  void files;
  return {};
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

  // Cookie-authenticated + spends AI credit — refuse cross-origin before work.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = (await session(request))?.token;
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

  // Register the run on the canonical registry BEFORE streaming. This is what
  // makes it a session rather than an anonymous stream: it shows up in the
  // fleet views, and its control queue is what pause/resume/stop/message from
  // any surface arrive through. Unreachable registry => `open()` returns null
  // and the run proceeds exactly as it did before, private to this caller.
  const { fs, id, opened } = await resolveFs(token, body, files);

  const agentSession = new AgentSession({
    baseUrl: HANZO_AI_BASE_URL,
    token,
    agent: "hanzo-app",
    title: prompt.slice(0, 120),
    // Where it runs, so the fleet views show a box run as a box run rather than
    // as an anonymous stream from a browser tab.
    ...(id ? { host: id, repo: typeof body.project === "string" ? body.project : undefined } : {}),
  });
  await agentSession.open();

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  // Each AgentEvent is one SSE `data:` frame of JSON — the UI reads `type` to
  // pick a card (reasoning / tool_call / tool_result / text), same event shapes
  // the client orchestrator already renders.
  const emit = async (event: AgentEvent) => {
    // Out to the caller first — they are watching — then to the registry, which
    // queues and never blocks this write.
    await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    agentSession.publish(event);
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
          fs,
          maxTurns,
          signal: request.signal,
          session: agentSession,
        },
        emit
      );
      await agentSession.close("done");
    } catch (error) {
      try {
        await emit({
          type: "error",
          message: error instanceof Error ? error.message : "Agent run failed",
        });
      } catch {
        // stream already broken
      }
      await agentSession.close("error");
    } finally {
      // Give back only what this run took out. Nothing else releases a box:
      // `apps/sandbox` has no reaper, so a box leaked here holds a pod and an
      // RWO volume until a human notices. Suspending frees the pod and keeps
      // the checkout, which is also what clears the one-live-box-per-project
      // rule for the next run.
      if (opened && id) {
        await releaseSandbox({ baseUrl: HANZO_AI_BASE_URL, token, id });
      }
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return response;
}
