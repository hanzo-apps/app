/**
 * Answering with a stream: the response body, the beat that keeps it open,
 * reading an OpenAI-compatible SSE stream, and re-asking a turn that broke.
 *
 * It lives here rather than in `app/v1/generate/route.ts` because importing
 * that route pulls in the IAM session and its crypto: a suite that imports it
 * dies at import and reports `Tests: 0 total`, which reads as a pass. Same
 * reason `lib/output-cap.ts` sits beside it.
 */
import { UNAVAILABLE } from "@/lib/gateway";

/**
 * A turn that reached the model and then produced nothing usable.
 *
 * Distinct from a refusal (`lib/gateway.ts`), which is the gateway declining
 * before it started. This one is transient by nature — the upstream accepted the
 * request, answered `200`, streamed a chunk or two of envelope and then broke —
 * so it is the one failure worth simply asking again about.
 */
export class Broke extends Error {}

/** The upstream's own sentence, out of an in-stream error frame. */
function stated(err: unknown): string {
  if (typeof err === "string") return err;
  const m = (err as { message?: unknown } | null)?.message;
  return typeof m === "string" ? m : "";
}

/**
 * Hand each `choices[0].delta.content` fragment to `onDelta`. Returns the model
 * the gateway reports having served (echoed on every chunk — under smart routing
 * the request `model` is `"auto"`, so this is how the actually-served model
 * surfaces) and the response id (`json.id`, first non-empty wins), the routing
 * ledger's join key the client attaches to reward signals.
 *
 * **An error frame is an answer, and this used to throw it away.** A `200` SSE
 * body may carry `data: {"error":{"message":"…"}}` instead of a choice — that is
 * how an upstream reports failing after it has already committed to a stream,
 * and Enso's does it (measured: `Upstream error from Nvidia: Internal server
 * error`, intermittent, on ordinary builder prompts). The frame has no
 * `choices`, so reading only `delta.content` skipped it silently, the loop
 * reached `[DONE]`, and `/v1/generate` answered `200` with a **51-byte body**
 * holding nothing but the routed-model trailer. Every layer above then behaved
 * correctly on that emptiness and the builder said "That model didn't respond" —
 * the one sentence that is true and useless, for a fault a second attempt
 * clears.
 *
 * So an error frame throws, and so does a stream that ends having emitted no
 * content at all.
 */
export async function pipe(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: string) => Promise<unknown> | unknown
): Promise<{ model: string | null; id: string | null }> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let servedModel: string | null = null;
  let responseId: string | null = null;
  let content = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line; each may span multiple
    // `data:` lines. Process complete events, keep the remainder buffered.
    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      for (const line of rawEvent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "" || payload === "[DONE]") continue;

        let json: {
          error?: unknown;
          model?: unknown;
          id?: unknown;
          choices?: Array<{ delta?: { content?: unknown } }>;
        };
        try {
          json = JSON.parse(payload);
        } catch {
          continue; // Non-JSON keepalive / comment line.
        }
        if (json.error) throw new Broke(stated(json.error) || UNAVAILABLE);
        if (typeof json.model === "string") servedModel = json.model;
        if (!responseId && typeof json.id === "string" && json.id)
          responseId = json.id;
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) {
          content = true;
          await onDelta(delta);
        }
      }
    }
  }

  if (!content) throw new Broke(UNAVAILABLE);
  return { model: servedModel, id: responseId };
}

/**
 * How many times a broken turn is re-asked. Measured over 13 builder-sized Enso
 * prompts: one broke this way, and the immediate retry produced a whole page —
 * so the second attempt is where the value is and the third is insurance.
 */
export const ATTEMPTS = 3;

/**
 * The longest this route stays silent on an open connection.
 *
 * A reasoning model spends its first minutes thinking and does not stream the
 * thinking, so a turn can hold the line for a long time with nothing to say. A
 * proxy reads that silence as a dead origin and closes: Cloudflare fronts
 * hanzo.app and gives up around 100s of it.
 *
 * A space is the whole heartbeat. It travels before the first title marker,
 * where the page parser ignores leading whitespace, and browsers ignore it
 * ahead of the doctype — so it costs one byte and changes no output. 15s is
 * comfortably inside the shortest of those windows.
 */
export const BEAT_MS = 15_000;

/**
 * The value if `p` settles within `ms`, otherwise `null`.
 *
 * A status line may only be sent while nothing else has been, so the choice
 * between a refusal under its own status and a stream has to be made before the
 * first byte — and it cannot be made by waiting indefinitely. The gateway gets
 * one beat to answer; past that the head leaves and the answer travels in the
 * body. A rejection reads as `null` because the caller awaits the same promise
 * again, where it has a channel to report the reason on.
 */
export function within<T>(ms: number, p: Promise<T>): Promise<T | null> {
  return new Promise((resolve) => {
    const late = setTimeout(() => resolve(null), ms);
    const settle = (v: T | null) => {
      clearTimeout(late);
      resolve(v);
    };
    p.then(settle, () => settle(null));
  });
}

/** What the client keys on when a turn cannot be answered. */
export type Envelope = { ok: false; message: string; needCredits?: true };

/**
 * A response whose head leaves now, written as the answer arrives.
 *
 * The head is what the proxy in front of this route is waiting for, and it goes
 * before the gateway has been asked anything, so the wait for a model happens on
 * an open connection rather than a silent one. `no-transform` and
 * `X-Accel-Buffering: no` keep it a stream the whole way down: an intermediary
 * left to its own judgement buffers the body whole, which shows the builder
 * nothing for the length of a generation and truncates the page if the proxy
 * gives up mid-buffer.
 *
 * `work` gets the one write, and its promise ends the body. Whitespace beats
 * while nothing has been written and stops on the first real fragment — a space
 * landing mid-document would be a space in somebody's markup. A throw becomes
 * the client's envelope, since by then the body is the only channel left.
 */
export function stream(
  work: (write: (text: string) => Promise<unknown>) => Promise<unknown>,
  beat = BEAT_MS
): Response {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const put = (text: string) => writer.write(encoder.encode(text));

  let sent = false;
  // A beat that lands on a closed stream is swallowed, not thrown: the reader
  // going away is the ordinary end of this, and an unhandled rejection from a
  // timer would take the process with it.
  const pulse =
    beat > 0
      ? setInterval(() => {
          if (!sent) void put(" ").catch(() => {});
        }, beat)
      : null;

  void (async () => {
    try {
      try {
        await work((text) => {
          sent = true;
          return put(text);
        });
      } finally {
        if (pulse) clearInterval(pulse);
      }
    } catch (error) {
      const message =
        (error as { message?: string } | null)?.message || UNAVAILABLE;
      await put(JSON.stringify({ ok: false, message } satisfies Envelope)).catch(
        () => {}
      );
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * One streamed turn, re-asked while the reader has seen nothing.
 *
 * `open` is the stream the caller already checked. `reopen` asks the gateway
 * again and must throw {@link Broke} if that ask is itself refused.
 *
 * The retry is sound only before the first byte reaches the client: once a
 * fragment has been written, restarting would splice two different generations
 * into one page. `sent` is that line, and it is why the retry lives here rather
 * than inside {@link pipe}, which cannot know what the caller did with what it
 * handed over.
 */
export async function turn(
  open: ReadableStream<Uint8Array>,
  reopen: () => Promise<ReadableStream<Uint8Array>>,
  write: (delta: string) => Promise<unknown> | unknown,
  attempts = ATTEMPTS
): Promise<{ model: string | null; id: string | null }> {
  let sent = false;
  let body: ReadableStream<Uint8Array> | null = open;

  for (let attempt = 1; ; attempt++) {
    if (!body) body = await reopen();
    try {
      return await pipe(body, (delta) => {
        sent = true;
        return write(delta);
      });
    } catch (error) {
      if (sent || attempt >= attempts || !(error instanceof Broke)) throw error;
      body = null;
    }
  }
}
