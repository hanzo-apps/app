/**
 * The agent run, as a session on the canonical `/v1/agents` registry.
 *
 * A run used to be invisible: it streamed to whichever browser started it and
 * existed nowhere else, so nothing could list it, watch it, or stop it. cloud
 * already owns that registry — sessions, events, and a control queue — and
 * tabs.hanzo.ai already reads it. This is the client, not a second registry.
 *
 * Two directions, which is the whole point:
 *
 *   out   every AgentEvent is appended to `/sessions/:id/events`, so the run
 *         shows up wherever sessions show up rather than only in one tab.
 *   in    between turns the loop drains `/sessions/:id/control`, so pause,
 *         resume, stop and message posted from ANY surface reach a run already
 *         in flight. Steering is the reason the loop checks between turns
 *         rather than at the end: a turn boundary is the one place the
 *         conversation can absorb a new instruction without being torn.
 *
 * Everything here is best-effort by construction. The registry is where a run
 * is *observed*, not where it is *executed* — if cloud is unreachable the run
 * must still finish and still stream to the caller who asked for it. A failed
 * publish degrades observability; it must never fail the user's work.
 */

import type { AgentEvent } from "./types";

/** A steering command, as the control queue hands it over. */
export interface ControlCommand {
  seq: number;
  command: string;
  message?: string;
}

/** What a drain tells the loop to do, already reduced from the raw commands. */
export interface ControlDecision {
  /** Stop cleanly at this turn boundary. */
  stop: boolean;
  /** Hold here until a resume (or a stop) arrives. */
  paused: boolean;
  /** Steering text to inject as a user turn, oldest first. */
  messages: string[];
}

export interface SessionClientOptions {
  baseUrl: string;
  /** The caller's own IAM bearer. There is no shared server key. */
  token: string;
  /** Label shown in the fleet views — which agent this is. */
  agent: string;
  title?: string;
  /** Where it runs: a sandbox id, a host, the project. All optional. */
  host?: string;
  cwd?: string;
  repo?: string;
  target?: string;
}

/** AgentEvent → the registry's closed `kind` vocabulary. */
function kindOf(e: AgentEvent): "message" | "tool-call" | "log" | "status" {
  switch (e.type) {
    case "tool_call":
    case "tool_result":
      return "tool-call";
    case "text":
    case "reasoning":
      return "message";
    case "done":
    case "error":
      return "status";
    default:
      return "log";
  }
}

export class AgentSession {
  private id: string | null = null;
  private cursor = 0;
  /** Publishes are serialized so events land in the order they happened. */
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly opts: SessionClientOptions) {}

  get sessionId(): string | null {
    return this.id;
  }

  private async call(method: "GET" | "POST" | "PATCH", path: string, body?: unknown) {
    return fetch(`${this.opts.baseUrl}/agents/sessions${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.opts.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  }

  /** Register. Returns the session id, or null when the registry is unreachable. */
  async open(): Promise<string | null> {
    try {
      const res = await this.call("POST", "", {
        agent: this.opts.agent,
        title: this.opts.title ?? "",
        status: "running",
        host: this.opts.host ?? "",
        cwd: this.opts.cwd ?? "",
        repo: this.opts.repo ?? "",
        target: this.opts.target ?? "",
      });
      if (!res.ok) return null;
      const v = (await res.json()) as { id?: string };
      this.id = v.id ?? null;
      return this.id;
    } catch {
      return null;
    }
  }

  /**
   * Append one event. Returns immediately — the caller is streaming to a user
   * and must not wait on the registry, so publishes queue behind each other on
   * an internal tail and failures are swallowed.
   */
  publish(e: AgentEvent): void {
    if (!this.id) return;
    this.tail = this.tail
      .then(() =>
        this.call("POST", `/${this.id}/events`, {
          kind: kindOf(e),
          payload: JSON.stringify(e),
        })
      )
      .catch(() => undefined);
  }

  /** Wait for queued publishes, so a finished run is fully recorded. */
  async flush(): Promise<void> {
    await this.tail.catch(() => undefined);
  }

  /**
   * Read what was posted since the last drain and reduce it to a decision.
   *
   * The reduction is order-sensitive and deliberately so: a pause followed by a
   * resume in one page is not paused, and a stop anywhere wins over everything
   * — once someone has asked for a stop, no later command should revive the run.
   */
  async drainControl(): Promise<ControlDecision> {
    const decision: ControlDecision = { stop: false, paused: false, messages: [] };
    if (!this.id) return decision;

    let res: Response;
    try {
      res = await this.call("GET", `/${this.id}/control?after=${this.cursor}`);
    } catch {
      return decision;
    }
    if (!res.ok) return decision;

    const page = (await res.json()) as { commands?: ControlCommand[]; cursor?: number };
    this.cursor = page.cursor ?? this.cursor;

    for (const c of page.commands ?? []) {
      switch (c.command) {
        case "stop":
          decision.stop = true;
          break;
        case "pause":
          decision.paused = true;
          break;
        case "resume":
          decision.paused = false;
          break;
        case "message":
          if (c.message) decision.messages.push(c.message);
          break;
      }
    }
    return decision;
  }

  /** Mark the run finished. `status` is the registry's vocabulary. */
  async close(status: "done" | "error" | "paused"): Promise<void> {
    if (!this.id) return;
    await this.flush();
    try {
      await this.call("PATCH", `/${this.id}`, { status });
    } catch {
      // The run is over either way; a registry that missed the last word is a
      // stale row, not a lost result.
    }
  }
}
