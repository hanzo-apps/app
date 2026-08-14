/**
 * What the live feed is allowed to say.
 *
 * Two decisions in `watchRuns` are load-bearing and neither is visible from the
 * outside, so they are asserted here rather than trusted:
 *
 *   (1) A frame is routed by its `event:` name, not guessed from its payload —
 *       `session` rows and `event` lines are different shapes and a reader that
 *       sniffed them would eventually mistake one for the other.
 *   (2) A payload carrying a `type` is an AgentEvent this app published itself,
 *       and the caller already has it from the run's own stream. Rendering it
 *       here would print the whole build log TWICE. That filter is the entire
 *       reason two streams can coexist without duplicating each other, and it
 *       is one `if` — exactly the kind that gets "simplified" away.
 */

import { watchRuns, type Line, type Row } from "@/lib/agent/watch";

/** A body that emits the given chunks and then ends, like a closed SSE stream. */
function body(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * Run one connection's worth of feed and collect what the caller was told.
 *
 * The feed reconnects by design — cloud hangs up on a subscriber that fell
 * behind — so the signal is aborted as soon as the stream is drained, which is
 * what a caller unmounting does and what stops this from looping forever.
 */
async function collect(...chunks: string[]) {
  const rows: Row[] = [];
  const lines: [string, Line][] = [];
  const gone = new AbortController();

  const realFetch = globalThis.fetch;
  let asked = "";
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    asked = String(input);
    // One connection, then the caller is done: the body ends, and the abort
    // lands before the retry sleep resolves.
    setTimeout(() => gone.abort(), 0);
    return new Response(body(...chunks), { status: 200 });
  }) as unknown as typeof fetch;

  try {
    await watchRuns({
      signal: gone.signal,
      onSession: (r) => rows.push(r),
      onLine: (id, l) => lines.push([id, l]),
    });
  } finally {
    globalThis.fetch = realFetch;
  }
  return { rows, lines, asked };
}

describe("watching a run", () => {
  it("reads a session row and a narration line from one feed", async () => {
    const { rows, lines } = await collect(
      frame("session", { session: { id: "s1", status: "running", events: 3 } }),
      frame("event", { event: { sessionId: "s1", kind: "log", payload: { message: "npm install\n" } } })
    );
    expect(rows).toEqual([{ id: "s1", status: "running", events: 3 }]);
    expect(lines).toEqual([["s1", { step: "", message: "npm install\n" }]]);
  });

  it("keeps the step a lifecycle event names", async () => {
    const { lines } = await collect(
      frame("event", { event: { sessionId: "s1", kind: "tool-call", payload: { step: "exit", message: "exit 1" } } })
    );
    expect(lines).toEqual([["s1", { step: "exit", message: "exit 1" }]]);
  });

  it("does NOT hand back this app's own published events", async () => {
    // The double-render guard. These are the exact payloads `AgentSession`
    // publishes, and every one of them already reached the caller over the run's
    // own stream. If this list ever shrinks, a build prints twice.
    const { lines } = await collect(
      frame("event", { event: { sessionId: "s1", kind: "message", payload: { type: "text", text: "hello" } } }),
      frame("event", {
        event: { sessionId: "s1", kind: "tool-call", payload: { type: "tool_call", id: "t1", name: "run_command", arguments: "{}" } },
      }),
      frame("event", {
        event: { sessionId: "s1", kind: "tool-call", payload: { type: "tool_result", id: "t1", name: "run_command", result: "Exit code 0", isError: false } },
      })
    );
    expect(lines).toEqual([]);
  });

  it("survives a heartbeat, a malformed frame and an empty payload", async () => {
    const { lines } = await collect(
      ": ping\n\n",
      "event: event\ndata: {not json\n\n",
      frame("event", { event: { sessionId: "s1", kind: "log", payload: {} } }),
      frame("event", { event: { sessionId: "s1", kind: "log", payload: { message: "still here" } } })
    );
    expect(lines).toEqual([["s1", { step: "", message: "still here" }]]);
  });

  it("delivers a frame split across two chunks", async () => {
    // A stream is bytes, not messages: an 8 KiB burst of build output arrives in
    // pieces, and a reader that assumed one chunk was one frame would drop the
    // tail of every long line.
    const whole = frame("event", { event: { sessionId: "s1", kind: "log", payload: { message: "compiled" } } });
    const at = whole.indexOf("kind");
    const { lines } = await collect(whole.slice(0, at), whole.slice(at));
    expect(lines).toEqual([["s1", { step: "", message: "compiled" }]]);
  });

  it("narrows to one run when asked, and to the org when not", async () => {
    const one = await collect(frame("session", { session: { id: "s1" } }));
    expect(one.asked).toBe("/v1/agents/sessions/stream");

    const gone = new AbortController();
    const realFetch = globalThis.fetch;
    let asked = "";
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
      asked = String(input);
      setTimeout(() => gone.abort(), 0);
      return new Response(body(), { status: 200 });
    }) as unknown as typeof fetch;
    try {
      await watchRuns({ root: "s 1/2", signal: gone.signal });
    } finally {
      globalThis.fetch = realFetch;
    }
    // Encoded, so an id with a slash in it addresses a query value rather than
    // another path segment.
    expect(asked).toBe("/v1/agents/sessions/stream?root=s%201%2F2");
  });

  it("raises a refusal instead of retrying it forever", async () => {
    // A 401 is not a dropped connection. Reopening it on a timer is a spinner
    // that never resolves and a request loop nobody asked for.
    const realFetch = globalThis.fetch;
    globalThis.fetch = jest.fn(async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
    try {
      await expect(watchRuns({})).rejects.toThrow(/sign in/i);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
