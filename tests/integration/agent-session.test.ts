/**
 * Bidirectional control: events out, steering in.
 *
 * The claims worth proving are the ones a user would notice if they were false
 * — that a stop actually stops, that a pause actually holds the loop instead of
 * recording a status and carrying on, that a message posted mid-run reaches the
 * conversation, and that an unreachable registry degrades observability rather
 * than failing the user's work.
 */
import { AgentSession } from "@/lib/agent/session";
import type { AgentEvent } from "@/lib/agent/types";

const BASE = "https://api.hanzo.ai/v1";

/** A stand-in for cloud's session registry: holds a control queue and events. */
function stubRegistry(opts: { failEverything?: boolean } = {}) {
  const events: Array<{ kind: string; payload: string }> = [];
  const queue: Array<{ seq: number; command: string; message?: string }> = [];
  let status = "running";
  let seq = 0;

  const push = (command: string, message?: string) => {
    queue.push({ seq: ++seq, command, message });
  };

  const handler = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (opts.failEverything) throw new Error("registry unreachable");
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;

    if (method === "POST" && url.pathname.endsWith("/agents/sessions")) {
      return Response.json({ id: "sess_1", status: "running" });
    }
    if (method === "POST" && url.pathname.endsWith("/events")) {
      events.push({ kind: body.kind, payload: body.payload });
      return Response.json({ ok: true });
    }
    if (method === "GET" && url.pathname.endsWith("/control")) {
      const after = Number(url.searchParams.get("after") ?? 0);
      const commands = queue.filter((c) => c.seq > after);
      const cursor = commands.length ? commands[commands.length - 1].seq : after;
      return Response.json({ commands, cursor });
    }
    if (method === "PATCH") {
      status = body.status;
      return Response.json({ ok: true });
    }
    return new Response("unhandled", { status: 500 });
  };

  return { events, push, handler, get status() { return status; } };
}

function install(handler: (i: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = handler as typeof fetch;
}

function open(reg: ReturnType<typeof stubRegistry>) {
  install(reg.handler);
  return new AgentSession({ baseUrl: BASE, token: "tok", agent: "hanzo-app" });
}

describe("AgentSession", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("registers and reports its id", async () => {
    const s = open(stubRegistry());
    expect(await s.open()).toBe("sess_1");
    expect(s.sessionId).toBe("sess_1");
  });

  it("publishes events under the registry's kind vocabulary", async () => {
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();

    const sent: AgentEvent[] = [
      { type: "reasoning", text: "thinking" },
      { type: "tool_call", id: "1", name: "write_file", arguments: "{}" },
      { type: "error", message: "boom" },
    ];
    for (const e of sent) s.publish(e);
    await s.flush();

    expect(reg.events.map((e) => e.kind)).toEqual(["message", "tool-call", "status"]);
    // The whole event travels, so a viewer reconstructs exactly what streamed.
    expect(JSON.parse(reg.events[1].payload)).toEqual(sent[1]);
  });

  it("carries a stop back to the caller", async () => {
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();
    reg.push("stop");

    expect((await s.drainControl()).stop).toBe(true);
  });

  it("delivers steering text posted mid-run", async () => {
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();
    reg.push("message", "actually use Tailwind");

    expect((await s.drainControl()).messages).toEqual(["actually use Tailwind"]);
  });

  it("does not redeliver a command it already applied", async () => {
    // The cursor is what keeps a poll cheap and an applied command final —
    // without it every drain would replay the whole queue and a single stop
    // would keep stopping every future run of the loop.
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();
    reg.push("message", "first");

    expect((await s.drainControl()).messages).toEqual(["first"]);
    expect((await s.drainControl()).messages).toEqual([]);
  });

  it("treats pause-then-resume in one page as not paused", async () => {
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();
    reg.push("pause");
    reg.push("resume");

    expect((await s.drainControl()).paused).toBe(false);
  });

  it("lets a stop end a pause", async () => {
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();
    reg.push("pause");
    reg.push("stop");

    const d = await s.drainControl();
    expect(d.stop).toBe(true);
  });

  it("keeps the run alive when the registry is unreachable", async () => {
    // Observability is not the work. A run whose events cannot be published
    // must still finish and still stream to whoever asked for it.
    const s = open(stubRegistry({ failEverything: true }));

    expect(await s.open()).toBeNull();
    s.publish({ type: "text", text: "still streaming" });
    await expect(s.flush()).resolves.toBeUndefined();
    await expect(s.close("done")).resolves.toBeUndefined();
    expect((await s.drainControl())).toEqual({ stop: false, paused: false, messages: [] });
  });

  it("marks the session done on close", async () => {
    const reg = stubRegistry();
    const s = open(reg);
    await s.open();
    await s.close("done");
    expect(reg.status).toBe("done");
  });
});
