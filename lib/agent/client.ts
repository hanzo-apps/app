/**
 * The browser's half of `/v1/agents/runs`.
 *
 * The route has spoken sandboxes correctly since the day it was written — name a
 * `project` and the agent edits a real checkout on a real pod. Nothing ever
 * named one. Every occurrence of `project` or `id` outside `lib/agent` lived
 * inside the route file itself, so the endpoint was an API-only affordance and
 * every run a person actually started fell through to an in-memory map.
 *
 * This is the missing caller, and it is deliberately the ONLY one: a surface that
 * wants an agent run calls `startAgentRun`, and where the run edits is decided
 * here from the project the person has open, not re-derived per component.
 *
 * Same-origin `fetch`, cookie-authenticated, no token in the browser's hands:
 * `/v1/agents/runs` verifies the IAM session server-side and forwards THAT
 * bearer to the gateway. There is no shared key anywhere on this path — the run
 * bills the person who started it.
 */

import type { AgentEvent, AgentFile } from "./types";

export interface StartRunOptions {
  /** What to do. */
  prompt: string;
  /**
   * The project this run edits. Cloud gets or creates its sandbox, and the agent
   * edits a REAL checkout with a real toolchain it can run. Omit it and the run
   * is a scratch run — which the first `sandbox` event says out loud.
   */
  project?: string;
  /** A sandbox already held (from a previous run's `sandbox` event). Wins over
   *  `project`: reuse the pod rather than asking for a second one. */
  id?: string;
  /** Resolved model id, or undefined for the caller's default. */
  model?: string;
  /** Seed files, for a scratch run that starts from what is on screen. Ignored
   *  when the run gets a sandbox — a checkout already has its own files. */
  files?: AgentFile[];
  maxTurns?: number;
  signal?: AbortSignal;
}

/**
 * Run the agent and deliver every event as it arrives.
 *
 * Resolves when the stream ends. It does not throw for a run that FAILED — a
 * failure is an `error` event, which is data the caller renders like any other.
 * It throws only when the run could not be STARTED (no session, refused,
 * unreachable), because there is no stream to put an event on.
 */
export async function startAgentRun(
  opts: StartRunOptions,
  onEvent: (event: AgentEvent) => void,
): Promise<void> {
  const res = await fetch("/v1/agents/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      ...(opts.id ? { id: opts.id } : {}),
      ...(opts.project ? { project: opts.project } : {}),
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.files?.length ? { files: opts.files } : {}),
      ...(opts.maxTurns ? { maxTurns: opts.maxTurns } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    // The route answers a refusal as JSON with a sentence in it; that sentence
    // is what the person needs, so it is what the error carries.
    const detail = await res.text().catch(() => "");
    let message = `Agent run refused (${res.status})`;
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed?.message) message = parsed.message;
    } catch {
      /* not a JSON envelope — the status stands on its own */
    }
    const err = new Error(message);
    (err as { status?: number }).status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by a blank line; keep the trailing partial.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          onEvent(JSON.parse(data) as AgentEvent);
        } catch {
          // A keepalive or a non-JSON comment — the stream stays live.
        }
      }
    }
  }
}
