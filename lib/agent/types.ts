/**
 * Track B — agentic coding harness (D1): shared types.
 *
 * The harness is a bounded, tool-using agent loop that edits a project's files
 * and streams its reasoning + tool use back to the caller. D1 runs the loop
 * SERVER-SIDE against an in-memory project snapshot with a minimal MCP-shaped
 * toolset. Later increments (see docs/AGENTIC-CODING.md) swap the in-memory FS
 * for a real per-project sandbox (hanzo/dev exec-server → gVisor/Kata pod) and
 * the bespoke toolset for the canonical hanzo MCP surface — the event and file
 * contracts defined here stay stable across that migration.
 */

/** One file in a project snapshot. `path` is absolute-from-root (leading `/`). */
export interface AgentFile {
  path: string;
  content: string;
}

/**
 * A single streamed step of an agent run. This is the wire contract the UI
 * renders (tool-use + reasoning cards) — it is deliberately transport-agnostic
 * so the same events can ride SSE (D1), a dev app-server JSON-RPC relay (D4), or
 * an in-process callback (tests).
 */
export type AgentEvent =
  /** Incremental chain-of-thought / thinking tokens. */
  | { type: "reasoning"; text: string }
  /** Incremental assistant answer tokens (the prose the model streams). */
  | { type: "text"; text: string }
  /** The model decided to call a tool; `arguments` is the raw JSON string. */
  | { type: "tool_call"; id: string; name: string; arguments: string }
  /** Result of executing a tool call, fed back to the model next turn. */
  | { type: "tool_result"; id: string; name: string; result: string; isError: boolean }
  /** A new reasoning/act turn of the bounded loop began. */
  | { type: "turn"; turn: number; maxTurns: number }
  /** The run failed (gateway error, abort, etc.). Terminal. */
  | { type: "error"; message: string }
  /** The run finished. Carries the final file snapshot + list of changed paths. */
  | {
      type: "done";
      finishReason: string;
      turns: number;
      files: AgentFile[];
      changed: string[];
    };

/** Sink an agent run pushes events to (SSE writer, test collector, …). */
export type EmitEvent = (event: AgentEvent) => void | Promise<void>;
