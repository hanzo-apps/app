/**
 * Content-free reward-signal client — router-training feedback for the Hanzo
 * gateway.
 *
 * Two orthogonal concerns live here, both about the SAME join key (the gateway
 * response id, `chatcmpl-…`, that the routing ledger on api.hanzo.ai keys on):
 *
 *   1. The last-generation id store. `/v1/generate` returns the gateway's real
 *      response id; `hooks/useCallAi.ts` captures it and writes it here. It is
 *      the ONE place every builder surface reads "which generation are we acting
 *      on" — so the disjoint deploy / regenerate / accept moments can attach the
 *      right id without threading props through unrelated component trees.
 *
 *   2. `sendRewardSignal` — a fire-and-forget POST to the same-origin BFF
 *      (`/v1/feedback`), which forwards to `${gateway}/feedback` under the
 *      user's identity. The payload carries ONLY {request_id, signal, rating?} —
 *      NEVER any prompt, response, filename, code, or HTML. It NEVER blocks UX
 *      and is SILENT on any failure.
 */

export type RewardSignal =
  | "up"
  | "down"
  | "regenerate"
  | "switch"
  | "abandon"
  | "accept"
  | "revert"
  | "rating";

// The most recent gateway response id captured from a `/v1/generate` call. Null
// until a generation with an id has completed — dependent signals no-op then.
let lastRequestId: string | null = null;

/** Record the gateway response id of the most recent generation. Ignores falsy. */
export function setLastGenerationRequestId(id?: string | null): void {
  if (id) lastRequestId = id;
}

/** The most recent gateway response id, or null if no generation carried one. */
export function getLastGenerationRequestId(): string | null {
  return lastRequestId;
}

// Natural dedupe: the same (id, signal, rating) is emitted at most once, so a
// double-click deploy or a re-render never double-counts a moment.
const sent = new Set<string>();

/**
 * Emit a content-free reward signal for a generation. No-op when `requestId` is
 * falsy (a generation that produced no gateway id — never fabricate one).
 * Fire-and-forget: the promise resolves regardless of transport outcome and
 * never throws, so callers can ignore it inline without touching UX.
 */
export async function sendRewardSignal(
  requestId: string | null | undefined,
  signal: RewardSignal,
  rating?: 1 | 2 | 3
): Promise<void> {
  if (!requestId) return;

  const key = `${requestId}:${signal}:${rating ?? ""}`;
  if (sent.has(key)) return;
  sent.add(key);

  // Payload is whitelisted to exactly these fields — no content can transit.
  const body: { request_id: string; signal: RewardSignal; rating?: 1 | 2 | 3 } = {
    request_id: requestId,
    signal,
  };
  if (signal === "rating" && rating) body.rating = rating;

  try {
    await fetch("/v1/feedback", {
      method: "POST",
      credentials: "include",
      keepalive: true, // survive the navigation a deploy/accept often triggers
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Fire-and-forget: a failed signal must never surface to the user.
  }
}
