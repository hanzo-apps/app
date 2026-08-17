/**
 * @jest-environment node
 *
 * The head is the first thing that leaves /v1/generate.
 *
 * hanzo.app is fronted by Cloudflare, which answers for the origin if the origin
 * has not answered — and it answers with its own HTML, under a status none of
 * this app's envelopes use. A route that waits for the gateway before it
 * constructs anything sets its streaming headers on a response nothing ever
 * reaches, so the only thing that can keep a long build alive is sending the
 * head first and writing the body as it arrives.
 *
 * These pin that ordering at the route, where it is decided. `sse.test.ts` pins
 * the pieces it is built from.
 */
import assert from "node:assert/strict";

jest.mock("@/lib/iam", () => ({
  session: async () => ({ token: "a-verified-iam-token", sub: "u_1", owner: "hanzo" }),
}));
jest.mock("@/lib/org/csrf", () => ({ requireSameOrigin: () => undefined }));

import { NextRequest } from "next/server";

import { POST, PUT } from "@/app/v1/generate/route";
import { BEAT_MS } from "@/lib/sse";

const build = () =>
  new NextRequest("https://hanzo.app/v1/generate", {
    method: "POST",
    body: JSON.stringify({ prompt: "build me a landing page" }),
    headers: { "content-type": "application/json" },
  });

const catalog = () =>
  new Response(JSON.stringify({ data: [{ id: "enso", context_window: 1_000_000 }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

/**
 * A gateway whose catalog answers and whose completions call does what the slow
 * one does: holds its head. `settle` releases it.
 */
function holding() {
  let settle!: (r: Response) => void;
  const held = new Promise<Response>((r) => (settle = r));
  global.fetch = jest.fn(async (input: unknown) =>
    String(input).includes("/models") ? catalog() : held
  ) as unknown as typeof fetch;
  return { settle, held };
}

/** Everything written to the body, once it closes. */
async function read(r: Response): Promise<string> {
  const reader = r.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text;
    text += decoder.decode(value, { stream: true });
  }
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick"] });
});
afterEach(() => {
  jest.useRealTimers();
});

test("the head reaches the edge while the gateway is still holding its own", async () => {
  const { settle } = holding();

  const pending = POST(build());
  let answered = false;
  void pending.then(() => (answered = true));

  await jest.advanceTimersByTimeAsync(BEAT_MS + 1);
  assert.equal(answered, true, "the route must answer without the gateway having");

  const res = await pending;
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("X-Accel-Buffering"), "no");
  assert.equal(res.headers.get("Cache-Control"), "no-cache, no-transform");

  // And the body is a stream, so the wait happens on an open connection.
  settle(new Response("data: [DONE]\n\n", { status: 200 }));
  await read(res);
});

test("the connection carries bytes long before the edge would give up", async () => {
  // Cloudflare closes a silent origin around 100s. Nothing here may be quieter
  // than one beat.
  const { settle } = holding();

  const res = await (async () => {
    const p = POST(build());
    await jest.advanceTimersByTimeAsync(BEAT_MS + 1);
    return p;
  })();

  const reader = res.body!.getReader();
  const beat = reader.read();
  await jest.advanceTimersByTimeAsync(BEAT_MS + 1);
  const { value } = await beat;
  assert.equal(new TextDecoder().decode(value), " ");

  settle(new Response("data: [DONE]\n\n", { status: 200 }));
  for (;;) if ((await reader.read()).done) break;
});

test("a refusal that lands after the head keeps its sentence and its modal", async () => {
  // Past the head there is no status line left, so the whole envelope travels in
  // the body — `needCredits` included, or a funded org reads a flat refusal with
  // no way forward.
  const { settle } = holding();

  const p = POST(build());
  await jest.advanceTimersByTimeAsync(BEAT_MS + 1);
  const res = await p;
  assert.equal(res.status, 200);

  settle(
    new Response(JSON.stringify({ msg: "Monthly spend cap reached for org acme." }), {
      status: 402,
    })
  );

  const envelope = JSON.parse((await read(res)).trim());

  assert.equal(envelope.ok, false);
  assert.equal(envelope.needCredits, true);
  assert.equal(envelope.message, "Monthly spend cap reached for org acme.");
});

/**
 * An SSE body carrying `content` as deltas, framed the way the gateway frames
 * it. Every ask streams — an edit collects the fragments rather than relaying
 * them, but it asks for them the same way a build does.
 */
function sse(content: string, model = "enso", id = "chatcmpl-9"): Response {
  const frames =
    [...content.match(/[\s\S]{1,40}/g)!]
      .map((c) => `data: ${JSON.stringify({ id, model, choices: [{ delta: { content: c } }] })}\n\n`)
      .join("") + "data: [DONE]\n\n";
  return new Response(frames, { status: 200, headers: { "content-type": "text/event-stream" } });
}

/** One follow-up edit against a page the builder already has. */
const edit = () =>
  new NextRequest("https://hanzo.app/v1/generate", {
    method: "PUT",
    body: JSON.stringify({
      prompt: "make the hero say Order for pickup",
      pages: [{ path: "index.html", html: "<html><body><h1>Bakery</h1></body></html>" }],
    }),
    headers: { "content-type": "application/json" },
  });

test("an edit hands over its head too, and applies the pages down the body", async () => {
  // An edit answers whole rather than in fragments, so it is the turn most able
  // to stay silent — and silence is what the edge answers for.
  const { settle } = holding();

  const pending = PUT(edit());
  let answered = false;
  void pending.then(() => (answered = true));

  await jest.advanceTimersByTimeAsync(BEAT_MS + 1);
  assert.equal(answered, true, "the edit must answer without the gateway having");

  const res = await pending;
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("X-Accel-Buffering"), "no");

  settle(sse("<<<<<<< SEARCH\n<h1>Bakery</h1>\n=======\n<h1>Order for pickup</h1>\n>>>>>>> REPLACE"));

  const answer = JSON.parse((await read(res)).trim());
  assert.equal(answer.ok, true);
  assert.match(answer.pages[0].html, /Order for pickup/);
  assert.equal(answer.model, "enso");
  assert.equal(answer.id, "chatcmpl-9");
});

test("an edit refused after its head keeps the sentence and the modal", async () => {
  const { settle } = holding();
  const p = PUT(edit());
  await jest.advanceTimersByTimeAsync(BEAT_MS + 1);
  const res = await p;
  assert.equal(res.status, 200);

  settle(new Response(JSON.stringify({ msg: "balance exhausted" }), { status: 402 }));

  const envelope = JSON.parse((await read(res)).trim());
  assert.equal(envelope.ok, false);
  assert.equal(envelope.needCredits, true);
  assert.equal(envelope.message, "balance exhausted");
});

test("every ask streams, so no bound can mean two different things", async () => {
  // A non-streaming request withholds its head until the whole completion is
  // done, which silently turns the bound on the head into a bound on the
  // generation — generous for one, a guillotine for the other. Both turns ask
  // the same way and the edit collects what it is sent.
  const asked: unknown[] = [];
  global.fetch = jest.fn(async (input: unknown, init?: RequestInit) => {
    if (String(input).includes("/models")) return catalog();
    asked.push(JSON.parse(String(init?.body)));
    return sse("<h1>hi</h1>");
  }) as unknown as typeof fetch;

  await read(await POST(build()));
  await read(await PUT(edit()));

  assert.equal(asked.length, 2);
  for (const body of asked) assert.equal((body as { stream: boolean }).stream, true);
});

test("a refusal the gateway states promptly still keeps its own status", async () => {
  // The status line is available while nothing has been sent, and every refusal
  // is decided before a byte is generated — so this is the ordinary path.
  global.fetch = jest.fn(async (input: unknown) =>
    String(input).includes("/models")
      ? catalog()
      : new Response(JSON.stringify({ msg: "balance exhausted" }), { status: 402 })
  ) as unknown as typeof fetch;

  const res = await POST(build());
  assert.equal(res.status, 402);
  assert.equal((await res.json()).needCredits, true);
});
