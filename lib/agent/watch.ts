/**
 * Watching runs.
 *
 * Cloud keeps every run in a durable ordered log and serves it live. This is the
 * browser's one reader of it, and it answers both questions a surface asks:
 *
 *   which runs exist and how are they doing   → `onSession`, the row
 *   what is this run saying right now         → `onLine`, the narration
 *
 * One reader for both because it is one feed: `?root=<id>` narrows it to a
 * single run's tree, and omitting it gives the org's own. Two hooks would be two
 * connections to the same socket for no reason.
 *
 * ONE FEED, AND IT IS NOT THE RUN'S OWN STREAM. `/v1/agents/runs` streams the
 * run it is driving back to whoever started it — its prose, its tool calls, and
 * the finished files, which is a result and not narration. This is the other
 * half: what the SANDBOX says while a command is running, which no caller can
 * have any other way because the command has not returned yet. Nothing is
 * rendered from both, and `line()` below is where that is enforced.
 */

/** One thing a run said. */
export interface Line {
  /**
   * The lifecycle step, when this is one: `leased`, `clone`, the tool's own
   * name, `exit`, `ended`. Empty for streamed command output, which is most of
   * the volume and belongs to whatever step is currently running.
   */
  step: string;
  message: string;
}

/** A run, as the registry lists it. Only the fields a watcher renders. */
export interface Row {
  id: string;
  org?: string;
  agent?: string;
  title?: string;
  status?: string;
  project?: string;
  published?: boolean;
  events?: number;
  updatedAt?: string;
}

export interface WatchOptions {
  /** Narrow to one run and its subagents. Omit for the caller's whole org. */
  root?: string;
  /** A run appeared or changed. */
  onSession?: (row: Row) => void;
  /** A run said something. */
  onLine?: (sessionId: string, line: Line) => void;
  signal?: AbortSignal;
}

/** How long to wait before reopening a feed that ended on its own. */
const RETRY_MS = 2_000;

/**
 * The narration, or nothing.
 *
 * Two producers write to one log and they do not speak the same payload. The
 * SANDBOX writes `{step, message}` — the vocabulary the log is defined in. This
 * app ALSO publishes its own `AgentEvent`s there so a run is visible from other
 * surfaces, and those are tagged with a `type`. The caller already has every one
 * of those from the run's own stream, so rendering them here would print the
 * whole conversation twice.
 *
 * `type` is the discriminator, and it is a fact about the payload rather than a
 * flag anyone has to remember to set: an AgentEvent cannot exist without one and
 * a narration line never has one.
 */
function line(payload: unknown): Line | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as { type?: unknown; step?: unknown; message?: unknown };
  if (typeof p.type === "string") return null;
  const message = typeof p.message === "string" ? p.message : "";
  const step = typeof p.step === "string" ? p.step : "";
  if (!message && !step) return null;
  return { step, message };
}

/**
 * Tail the feed until the caller aborts.
 *
 * Resolves only when the signal is aborted. It does not throw for a feed that
 * dropped — cloud hangs up on a subscriber that fell behind, deliberately, and
 * expects it back — so a drop is a reconnect, not an error the caller has to
 * handle. It throws only if the caller is not allowed to watch at all, because
 * retrying a 401 forever is a spinner that never resolves.
 */
export async function watchRuns(opts: WatchOptions): Promise<void> {
  const url = opts.root
    ? `/v1/agents/sessions/stream?root=${encodeURIComponent(opts.root)}`
    : "/v1/agents/sessions/stream";

  while (!opts.signal?.aborted) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "text/event-stream" },
        signal: opts.signal,
        cache: "no-store",
      });
    } catch {
      if (opts.signal?.aborted) return;
      await pause(RETRY_MS, opts.signal);
      continue;
    }

    if (res.status === 401 || res.status === 403) {
      const err = new Error("Sign in to watch a run");
      (err as { status?: number }).status = res.status;
      throw err;
    }
    if (!res.ok || !res.body) {
      await pause(RETRY_MS, opts.signal);
      continue;
    }

    try {
      await read(res.body, opts);
    } catch {
      // A torn connection. The next loop reopens it; the GET endpoints remain
      // the truth, so nothing is lost by having missed a frame.
    }
    if (opts.signal?.aborted) return;
    await pause(RETRY_MS, opts.signal);
  }
}

/** Consume one connection's frames until it ends. */
async function read(body: ReadableStream<Uint8Array>, opts: WatchOptions): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) deliver(frame, opts);
  }
}

/**
 * One SSE frame.
 *
 * `event:` names which of the two shapes the `data:` carries, so both are read
 * here rather than guessed from the payload. A frame that is neither — the
 * heartbeat, which is an SSE comment — has no `data:` line and falls out.
 */
function deliver(frame: string, opts: WatchOptions): void {
  let kind = "";
  let data = "";
  for (const raw of frame.split("\n")) {
    if (raw.startsWith("event:")) kind = raw.slice(6).trim();
    else if (raw.startsWith("data:")) data += raw.slice(5).trim();
  }
  if (!data) return;

  let parsed: { session?: Row; event?: { sessionId?: string; payload?: unknown } };
  try {
    parsed = JSON.parse(data);
  } catch {
    return; // A malformed frame is skipped; the feed stays open.
  }

  if (kind === "session" && parsed.session?.id) {
    opts.onSession?.(parsed.session);
    return;
  }
  if (kind === "event" && parsed.event) {
    const said = line(parsed.event.payload);
    if (said && parsed.event.sessionId) opts.onLine?.(parsed.event.sessionId, said);
  }
}

/** Sleep, unless the caller has already given up. */
function pause(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    }
    signal?.addEventListener("abort", done, { once: true });
  });
}
