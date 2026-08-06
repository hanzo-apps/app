/**
 * Track B — the D1 bounded agent loop.
 *
 * A server-side reason→act loop over an OpenAI-compatible chat endpoint
 * (the Hanzo AI gateway, `${baseUrl}/chat/completions`). Each turn:
 *   1. stream a completion with the toolset enabled,
 *   2. emit reasoning + text deltas as they arrive,
 *   3. if the model called tools, execute them against the project FS, emit
 *      tool_call + tool_result, feed results back, and loop,
 *   4. otherwise the model answered → finish.
 *
 * The loop is bounded by `maxTurns` (abuse/cost guard) and forwards the caller's
 * IAM bearer verbatim — billing is per-user, exactly like `/v1/generate`. It
 * owns no orchestrator state of its own beyond the message list: this is the
 * proven client-side pattern (`lib/llm/multi-agent-orchestrator.ts`) moved
 * server-side, not a third agent engine. D4 replaces the body of this function
 * with a relay of hanzo/dev app-server events; the `AgentEvent` contract holds.
 */

import type { AgentFile, EmitEvent } from "./types";
import { InMemoryProjectFs, type ProjectFs } from "./fs";
import type { AgentSession, ControlDecision } from "./session";
import { agentToolDefs, executeAgentTool, type OpenAITool } from "./tools";

export interface RunAgentOptions {
  /** The caller's verified IAM bearer, forwarded to the gateway. */
  token: string;
  /** Gateway base URL, e.g. `https://api.hanzo.ai/v1`. */
  baseUrl: string;
  /** Resolved model id. */
  model: string;
  /** The user's instruction. */
  prompt: string;
  /** Initial project snapshot the agent edits (defaults to empty project).
   *  Ignored when `fs` is supplied — a sandbox already has its own files. */
  files?: AgentFile[];
  /** Where the agent edits. Defaults to an in-memory project built from
   *  `files`; pass a `Sandbox` to edit a real checkout on a box. The
   *  loop is identical either way — that is the whole point of the seam. */
  fs?: ProjectFs;
  /** Max reason→act turns before the loop stops. Default 8. */
  maxTurns?: number;
  /** Per-completion output cap. Default 8000. */
  maxTokens?: number;
  /** Abort the run (client disconnect). */
  signal?: AbortSignal;
  /** The `/v1/agents` session this run is recorded against. Supplying it makes
   *  the run visible to every surface AND steerable from them — events go out,
   *  pause/resume/stop/message come back in at each turn boundary. Omit it and
   *  the run is exactly what it was before: private to its caller. */
  session?: AgentSession;
}

/**
 * The system prompt, DERIVED from the tools actually being sent.
 *
 * The tool list used to be typed out here as well as declared in `tools.ts`,
 * which is one fact in two places — and the two now genuinely differ per run,
 * because a box gets `run_command` and an in-memory project does not. A prompt
 * that promises a tool the model was never given produces a model that keeps
 * calling it; a prompt that omits one it WAS given produces a box whose tests
 * are never run. Deriving the sentence from the array makes both impossible.
 */
function systemPrompt(tools: OpenAITool[]): string {
  const names = tools.map((t) => t.function.name);
  const canRun = names.includes("run_command");
  return `You are Hanzo's coding agent. You edit a small web project by CALLING TOOLS — never paste file contents in prose.

Available tools: ${names.join(", ")}.

Workflow:
1. Call list_files to see the project, and read_file on anything you will change.
2. Make the change with write_file (new/whole file) or apply_patch (surgical edit — oldStr must be an exact, unique substring).
${
  canRun
    ? `3. Verify with run_command — this project is a real checkout in a box, so build it and run its tests rather than assuming they pass.
4. When the task is fully done, STOP calling tools and reply with a one-paragraph summary of what you changed.`
    : `3. When the task is fully done, STOP calling tools and reply with a one-paragraph summary of what you changed.`
}

Rules: make the smallest change that satisfies the request; keep existing structure and style; do not invent files the user did not ask for; verify with read_file after a non-trivial edit.${
    canRun ? "" : " You cannot run commands here — do not claim you built or tested anything."
  }`;
}

type ToolCallAccum = { id: string; name: string; args: string };

interface AssistantToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type ChatMsg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: AssistantToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface TurnResult {
  content: string;
  toolCalls: ToolCallAccum[];
  finishReason: string;
}

/**
 * One streamed completion. Emits `reasoning`/`text` deltas via `emit` and
 * returns the assembled assistant content + tool calls + finish reason.
 */
async function streamTurn(
  opts: RunAgentOptions,
  messages: ChatMsg[],
  tools: OpenAITool[],
  emit: EmitEvent
): Promise<TurnResult> {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: opts.maxTokens ?? 8000,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`gateway ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let content = "";
  let finishReason = "stop";
  // tool calls accumulate by streaming index (OpenAI delta.tool_calls[].index).
  const byIndex = new Map<number, ToolCallAccum>();

  const handle = async (json: {
    choices?: Array<{
      delta?: {
        content?: string;
        reasoning?: string;
        reasoning_content?: string;
        tool_calls?: Array<{
          index?: number;
          id?: string;
          function?: { name?: string; arguments?: string };
        }>;
      };
      finish_reason?: string;
    }>;
  }) => {
    const choice = json.choices?.[0];
    if (!choice) return;
    const delta = choice.delta;
    if (choice.finish_reason) finishReason = choice.finish_reason;

    const reasoning = delta?.reasoning ?? delta?.reasoning_content;
    if (reasoning) await emit({ type: "reasoning", text: String(reasoning) });

    if (delta?.content) {
      content += delta.content;
      await emit({ type: "text", text: delta.content });
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        let acc = byIndex.get(idx);
        if (!acc) {
          acc = { id: tc.id ?? `call_${idx}`, name: "", args: "" };
          byIndex.set(idx, acc);
        }
        if (tc.id) acc.id = tc.id;
        if (tc.function?.name) acc.name += tc.function.name;
        if (tc.function?.arguments) acc.args += tc.function.arguments;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of rawEvent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "" || payload === "[DONE]") continue;
        try {
          await handle(JSON.parse(payload));
        } catch {
          // keepalive / non-JSON comment — ignore
        }
      }
    }
  }

  const toolCalls = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v)
    .filter((t) => t.name);

  return { content, toolCalls, finishReason };
}

/**
 * Run the bounded agent loop. Streams events to `emit` and resolves when the
 * run finishes (a `done` or `error` event is always the last thing emitted).
 */
/**
 * Drain control, and if the run is paused, keep draining until it is not.
 *
 * A pause has to actually hold the loop — recording "paused" and continuing
 * would make the button a lie. It polls rather than subscribes because the
 * control queue is a cursor over durable commands, which survives a poller
 * that missed a beat; a socket would not. Two seconds is well inside human
 * patience and costs nothing while nobody is steering.
 *
 * `stop` beats `resume`: once a stop is seen the wait ends immediately and the
 * decision carries it out, so a stop can always end a pause.
 */
async function waitOutPause(
  session: AgentSession,
  signal?: AbortSignal
): Promise<ControlDecision> {
  let decision = await session.drainControl();
  while (decision.paused && !decision.stop && !signal?.aborted) {
    await new Promise((r) => setTimeout(r, 2000));
    const next = await session.drainControl();
    decision = {
      // A pause persists until something lifts it; messages accumulate across
      // the wait so nothing said while paused is dropped on resume.
      stop: next.stop,
      paused: next.paused,
      messages: [...decision.messages, ...next.messages],
    };
  }
  return decision;
}

export async function runAgent(opts: RunAgentOptions, emit: EmitEvent): Promise<void> {
  const maxTurns = Math.max(1, Math.min(opts.maxTurns ?? 8, 24));
  const fs: ProjectFs = opts.fs ?? new InMemoryProjectFs(opts.files ?? []);
  // The toolset is a fact about WHERE this run happens, not about the agent, so
  // it is resolved once from the filesystem we were handed.
  const tools = agentToolDefs(fs);

  const messages: ChatMsg[] = [
    { role: "system", content: systemPrompt(tools) },
    { role: "user", content: opts.prompt },
  ];

  let finishReason = "stop";
  let turn = 0;

  try {
    for (turn = 1; turn <= maxTurns; turn++) {
      // A turn boundary is the ONLY place steering can land without tearing the
      // conversation: mid-turn the model is streaming and its tool calls are
      // half-issued, so an injected instruction would interleave into a reply
      // already in flight. Checking here costs one poll per turn.
      if (opts.session) {
        const control = await waitOutPause(opts.session, opts.signal);
        if (control.stop) {
          finishReason = "stopped";
          break;
        }
        // Steering arrives as a user turn, which is what it is: someone told
        // the agent something while it was working.
        for (const m of control.messages) messages.push({ role: "user", content: m });
      }

      await emit({ type: "turn", turn, maxTurns });

      const { content, toolCalls, finishReason: fr } = await streamTurn(opts, messages, tools, emit);

      if (toolCalls.length === 0) {
        // No tools requested → the model answered. Done.
        finishReason = fr === "tool_calls" ? "stop" : fr;
        break;
      }

      // Record the assistant turn (content + the tool calls it made).
      messages.push({
        role: "assistant",
        content,
        tool_calls: toolCalls.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: t.args },
        })),
      });

      // Execute each tool call and feed the result back as a tool message.
      for (const call of toolCalls) {
        await emit({ type: "tool_call", id: call.id, name: call.name, arguments: call.args });
        const outcome = await executeAgentTool(fs, call.name, call.args);
        await emit({
          type: "tool_result",
          id: call.id,
          name: call.name,
          result: outcome.result,
          isError: outcome.isError,
        });
        messages.push({ role: "tool", tool_call_id: call.id, content: outcome.result });
      }

      if (turn === maxTurns) finishReason = "max_turns";
    }

    await emit({
      type: "done",
      finishReason,
      turns: Math.min(turn, maxTurns),
      files: await fs.changedFiles(),
      changed: await fs.changedPaths(),
    });
  } catch (e) {
    const message =
      opts.signal?.aborted && (e instanceof Error && e.name === "AbortError")
        ? "aborted"
        : e instanceof Error
          ? e.message
          : String(e);
    await emit({ type: "error", message });
  }
}
