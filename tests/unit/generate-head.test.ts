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

import { POST } from "@/app/v1/generate/route";
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
