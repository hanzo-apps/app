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
import { InMemoryProjectFs } from "./fs";
import { AGENT_TOOL_DEFS, executeAgentTool } from "./tools";

export interface RunAgentOptions {
  /** IAM bearer (the caller's `hanzo_token`) forwarded to the gateway. */
  token: string;
  /** Gateway base URL, e.g. `https://api.hanzo.ai/v1`. */
  baseUrl: string;
  /** Resolved model id. */
  model: string;
  /** The user's instruction. */
  prompt: string;
  /** Initial project snapshot the agent edits (defaults to empty project). */
  files?: AgentFile[];
  /** Max reason→act turns before the loop stops. Default 8. */
  maxTurns?: number;
  /** Per-completion output cap. Default 8000. */
  maxTokens?: number;
  /** Abort the run (client disconnect). */
  signal?: AbortSignal;
}

const SYSTEM_PROMPT = `You are Hanzo's coding agent. You edit a small web project by CALLING TOOLS — never paste file contents in prose.

Available tools: list_files, read_file, search_files, write_file, apply_patch.

Workflow:
1. Call list_files to see the project, and read_file on anything you will change.
2. Make the change with write_file (new/whole file) or apply_patch (surgical edit — oldStr must be an exact, unique substring).
3. When the task is fully done, STOP calling tools and reply with a one-paragraph summary of what you changed.

Rules: make the smallest change that satisfies the request; keep existing structure and style; do not invent files the user did not ask for; verify with read_file after a non-trivial edit.`;

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
      tools: AGENT_TOOL_DEFS,
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
export async function runAgent(opts: RunAgentOptions, emit: EmitEvent): Promise<void> {
  const maxTurns = Math.max(1, Math.min(opts.maxTurns ?? 8, 24));
  const fs = new InMemoryProjectFs(opts.files ?? []);

  const messages: ChatMsg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: opts.prompt },
  ];

  let finishReason = "stop";
  let turn = 0;

  try {
    for (turn = 1; turn <= maxTurns; turn++) {
      await emit({ type: "turn", turn, maxTurns });

      const { content, toolCalls, finishReason: fr } = await streamTurn(opts, messages, emit);

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
        const outcome = executeAgentTool(fs, call.name, call.args);
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
      files: fs.snapshot(),
      changed: fs.changedPaths(),
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
