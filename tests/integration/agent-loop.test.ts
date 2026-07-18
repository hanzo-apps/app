/**
 * Behavioral verification for the Track B (D1) agent loop: drive `runAgent`
 * against a mocked OpenAI-compatible gateway and assert it (1) streams reasoning
 * + tool events, (2) actually edits the project files via the toolset, and
 * (3) ends with a `done` event reporting the changed paths. Node env (web
 * streams / fetch Response).
 */
import { runAgent, InMemoryProjectFs, executeAgentTool, type AgentEvent } from "@/lib/agent";

/** Build an SSE `Response` from OpenAI-style chunk objects. */
function sseResponse(chunks: unknown[]): Response {
  const body =
    chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("InMemoryProjectFs", () => {
  it("applies a unique update and reports it changed", () => {
    const fs = new InMemoryProjectFs([{ path: "/index.html", content: "<h1>Hi</h1>" }]);
    const res = fs.applyPatch("/index.html", [{ type: "update", oldStr: "Hi", newStr: "Hello" }]);
    expect(res.applied).toBe(true);
    expect(fs.read("/index.html")).toBe("<h1>Hello</h1>");
    expect(fs.changedPaths()).toEqual(["/index.html"]);
  });

  it("refuses a non-unique update", () => {
    const fs = new InMemoryProjectFs([{ path: "/a.txt", content: "x x" }]);
    const res = fs.applyPatch("/a.txt", [{ type: "update", oldStr: "x", newStr: "y" }]);
    expect(res.applied).toBe(false);
    expect(res.warnings.join()).toMatch(/not unique/);
  });

  it("search finds matches with path:line", () => {
    const fs = new InMemoryProjectFs([{ path: "/a.txt", content: "one\ntwo\nthree" }]);
    const hits = fs.search("two");
    expect(hits).toEqual([{ path: "/a.txt", line: 2, text: "two" }]);
  });
});

describe("executeAgentTool", () => {
  it("write_file creates a file; read_file returns it", () => {
    const fs = new InMemoryProjectFs();
    const w = executeAgentTool(fs, "write_file", JSON.stringify({ path: "/x.js", content: "1" }));
    expect(w.isError).toBe(false);
    const r = executeAgentTool(fs, "read_file", JSON.stringify({ path: "/x.js" }));
    expect(r.result).toBe("1");
  });

  it("apply_patch tolerates operations passed as a JSON string", () => {
    const fs = new InMemoryProjectFs([{ path: "/a.txt", content: "foo" }]);
    const o = executeAgentTool(
      fs,
      "apply_patch",
      JSON.stringify({ path: "/a.txt", operations: JSON.stringify([{ type: "rewrite", content: "bar" }]) })
    );
    expect(o.isError).toBe(false);
    expect(fs.read("/a.txt")).toBe("bar");
  });

  it("returns an error string (never throws) for an unknown tool", () => {
    const fs = new InMemoryProjectFs();
    const o = executeAgentTool(fs, "nope", "{}");
    expect(o.isError).toBe(true);
    expect(o.result).toMatch(/unknown tool/);
  });
});

describe("runAgent", () => {
  const original = global.fetch;
  afterEach(() => {
    global.fetch = original;
  });

  it("streams reasoning + tool events and edits the project", async () => {
    let call = 0;
    global.fetch = jest.fn(async () => {
      call += 1;
      if (call === 1) {
        return sseResponse([
          { choices: [{ delta: { reasoning: "I'll create the file." } }] },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: "call_1",
                      function: {
                        name: "write_file",
                        arguments: JSON.stringify({ path: "/hello.txt", content: "hello world" }),
                      },
                    },
                  ],
                },
              },
            ],
          },
          { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
        ]);
      }
      return sseResponse([
        { choices: [{ delta: { content: "Created hello.txt." } }] },
        { choices: [{ delta: {}, finish_reason: "stop" }] },
      ]);
    }) as unknown as typeof fetch;

    const events: AgentEvent[] = [];
    await runAgent(
      { token: "t", baseUrl: "https://api.test/v1", model: "zen", prompt: "make hello.txt" },
      (e) => {
        events.push(e);
      }
    );

    const types = events.map((e) => e.type);
    expect(types).toContain("reasoning");
    expect(types).toContain("tool_call");
    expect(types).toContain("tool_result");
    expect(types).toContain("text");

    const toolCall = events.find((e) => e.type === "tool_call");
    expect(toolCall && toolCall.type === "tool_call" && toolCall.name).toBe("write_file");

    const done = events.at(-1);
    expect(done?.type).toBe("done");
    if (done?.type === "done") {
      expect(done.changed).toEqual(["/hello.txt"]);
      expect(done.files.find((f) => f.path === "/hello.txt")?.content).toBe("hello world");
      expect(done.finishReason).toBe("stop");
    }
    expect(call).toBe(2);
  });

  it("stops at maxTurns when the model keeps calling tools", async () => {
    global.fetch = jest.fn(async () =>
      sseResponse([
        {
          choices: [
            {
              delta: {
                tool_calls: [
                  { index: 0, id: "c", function: { name: "list_files", arguments: "{}" } },
                ],
              },
            },
          ],
        },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
      ])
    ) as unknown as typeof fetch;

    const events: AgentEvent[] = [];
    await runAgent(
      { token: "t", baseUrl: "https://api.test/v1", model: "zen", prompt: "loop", maxTurns: 3 },
      (e) => events.push(e)
    );
    const turnEvents = events.filter((e) => e.type === "turn");
    expect(turnEvents.length).toBe(3);
    const done = events.at(-1);
    expect(done?.type).toBe("done");
    if (done?.type === "done") expect(done.finishReason).toBe("max_turns");
  });

  it("emits an error event when the gateway fails", async () => {
    global.fetch = jest.fn(async () => new Response("boom", { status: 502 })) as unknown as typeof fetch;
    const events: AgentEvent[] = [];
    await runAgent(
      { token: "t", baseUrl: "https://api.test/v1", model: "zen", prompt: "x" },
      (e) => {
        events.push(e);
      }
    );
    const last = events.at(-1);
    expect(last?.type).toBe("error");
    if (last?.type === "error") expect(last.message).toMatch(/gateway 502/);
  });
});
