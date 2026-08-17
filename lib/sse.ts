/**
 * Reading an OpenAI-compatible SSE stream, and re-asking a turn that broke.
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
 * One streamed turn, re-asked while the reader has seen nothing.
 *
 * `open` is the stream the caller already checked, so an up-front refusal keeps
 * its real HTTP status at the call site; from here on the response headers are
 * sent and everything — including a later refusal — can only travel in the body.
 * `reopen` asks the gateway again and must throw {@link Broke} if that ask is
 * itself refused.
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
