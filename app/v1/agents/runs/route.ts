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
  /** Run in this existing sandbox. */
  id?: unknown;
  /** Run in a sandbox for this project, creating one if there is none. */
  project?: unknown;
}

/**
 * Where this run edits.
 *
 * Three cases, in order of how specific the caller was:
 *
 *   id    a sandbox the caller already holds — reuse it, do not create a second.
 *   project  a named project — cloud gets or creates its sandbox, and the agent
 *            edits a REAL checkout with a real toolchain it can run.
 *   neither  the scratch case: a handful of files in this process. Most runs.
 *            It stays in memory deliberately — a throwaway HTML page does not
 *            need a pod, and paying for one would make the fast path slow.
 *
 * A sandbox that cannot be reached still falls back to memory rather than failing
 * the user's run — but it SAYS SO. The fallback itself was never the defect; the
 * silence was. `Where.durable` is the fact, it is emitted as the first frame of
 * every run, and the UI marks the run not-durable from it. A person who thought
 * their code was saved and finds nothing is worse than an error.
 *
 * `agentToolDefs` derives the toolset from whichever filesystem comes back, so the
 * model is never offered a capability the fallback does not have.
 *
 * `opened` records which of the two sandbox cases we are in, because it decides who
 * hangs the sandbox up at the end. A caller-supplied `id` belongs to the caller
 * and must outlive the run; a sandbox opened here for `project` has no other owner.
 */
interface Where {
  fs?: ProjectFs;
  id?: string;
  project?: string;
  opened?: boolean;
  durable: boolean;
  reason?: string;
}

/**
 * Can this sandbox actually be written to?
 *
 * "We got a sandbox" and "this run's edits will survive" are DIFFERENT FACTS, and
 * conflating them reproduces the exact defect this endpoint exists to end. Live,
 * today: `POST /v1/sandboxes {project}` answers 201 with a running pod whose
 * project volume is mounted root-owned into a container that runs as uid 1000,
 * so every write returns `Permission denied` — a sandbox that opens perfectly and
 * saves nothing. Reporting that as durable is the silent-fallback bug wearing a
 * pod.
 *
 * One `exec`, no litter: `test -w .` asks the directory the same question the run
 * is about to ask it, and writes nothing to answer it. A failure carries the
 * sandbox's own words rather than a code, because the person reading it is the
 * one who has to decide whether to keep going.
 */
async function writable(fs: Sandbox): Promise<string> {
  try {
    const r = await fs.exec("test -w . || { ls -ld . ; exit 1; }", 20);
    if (r.exitCode === 0) return "";
    return (
      `The sandbox opened but its project directory is not writable, so nothing this run does is saved. ` +
      `${(r.stdout || r.stderr).trim() || "the sandbox refused the check"}`
    );
  } catch (e) {
    return `The sandbox opened but did not answer a write check: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function resolveFs(token: string, body: AgentRequestBody): Promise<Where> {
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const project = typeof body.project === "string" ? body.project.trim() : "";

  if (id) {
    const fs = new Sandbox({ baseUrl: HANZO_AI_BASE_URL, id, token });
    const why = await writable(fs);
    if (!why) return { fs, id, project, durable: true };
    // THE ID IS A HINT AND THE PROJECT IS THE FACT, and getting that backwards
    // broke the second message of every conversation. This route RELEASES the
    // sandbox it opened when the run ends — the pod goes, the disk stays — so the
    // id a turn hands back is dead by the time the next turn quotes it, and
    // measuring it gives 404 on the write check. Preferring the id and stopping
    // there turned "your warm pod went away" into "nothing you do is saved", for
    // a project whose checkout was sitting right there.
    //
    // So a dead id falls through to the project rather than to memory. Falling
    // back to MEMORY is reserved for having nowhere to work at all.
    if (!project) return { id, durable: false, reason: why };
  }

  if (project) {
    const sandbox = await openSandbox({ baseUrl: HANZO_AI_BASE_URL, token, project });
    if (sandbox) {
      const fs = new Sandbox({ baseUrl: HANZO_AI_BASE_URL, id: sandbox.id, token });
      const why = await writable(fs);
      // `opened` either way: the pod exists and this run is the only thing that
      // knows about it, so it still has to be given back.
      return why
        ? { id: sandbox.id, project, opened: true, durable: false, reason: why }
        : { fs, id: sandbox.id, project, opened: true, durable: true };
    }
    // A project WAS named and it did not get one. This is the case that used to
    // disappear: the run continued against a map and reported success.
    return {
      project,
      durable: false,
      reason: `No sandbox for ${project} — the sandbox service did not give one out. This run edits a scratch copy in memory and nothing it writes is saved.`,
    };
  }

  // Nothing named: the scratch case, and legitimately so — a throwaway page does
  // not need a pod, and paying for one would make the fast path slow. Still said
  // out loud, because "cheap" and "invisible" are different things.
  return {
    durable: false,
    reason: "No project named — this run edits a scratch copy in memory and nothing it writes is saved.",
  };
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
  const where = await resolveFs(token, body);
  const { fs, id, opened } = where;

  const agentSession = new AgentSession({
    baseUrl: HANZO_AI_BASE_URL,
    token,
    agent: "hanzo-app",
    title: prompt.slice(0, 120),
    // Where it runs, so the fleet views show a sandbox run as a sandbox run rather than
    // as an anonymous stream from a browser tab.
    ...(id ? { host: id, repo: where.project } : {}),
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
      // WHERE, before anything else. The client marks the run from this frame,
      // so it has to precede the first token the user could mistake for work
      // being saved.
      await emit({
        type: "sandbox",
        durable: where.durable,
        ...(where.id ? { id: where.id } : {}),
        ...(where.project ? { project: where.project } : {}),
        ...(where.reason ? { reason: where.reason } : {}),
      });
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
      // Give back only what this run took out. Nothing else releases a sandbox:
      // `apps/sandbox` has no reaper, so a sandbox leaked here holds a pod and an
      // RWO volume until a human notices. Suspending frees the pod and keeps
      // the checkout, which is also what clears the one-live-sandbox-per-project
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
