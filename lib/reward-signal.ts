/**
 * Content-free reward-signal client — router-training feedback for the Hanzo
 * gateway.
 *
 * Two orthogonal concerns live here, both about the SAME join key (the gateway
 * response id, `chatcmpl-…`, that the routing ledger on api.hanzo.ai keys on):
 *
 *   1. The last-generation id store (app-local). `/v1/generate` returns the
 *      gateway's real response id; `hooks/useCallAi.ts` captures it and writes it
 *      here. It is the ONE place every builder surface reads "which generation
 *      are we acting on" — so the disjoint deploy / regenerate / accept moments
 *      can attach the right id without threading props through unrelated trees.
 *
 *   2. `sendRewardSignal` — a THIN adapter over the shared `@hanzo/ai`
 *      `sendFeedback` client (one implementation, N surfaces). It posts to the
 *      same-origin BFF (`/v1/feedback`, `baseUrl: ""`), which forwards to
 *      `${gateway}/feedback` under the user's identity. The SDK owns the
 *      whitelisted `{request_id, signal, rating?}` body, the dedupe, and the
 *      fire-and-forget transport (sendBeacon → keepalive fetch). No prompt,
 *      response, filename, code or HTML can ever transit; it never blocks UX and
 *      is silent on any failure.
 */
import { sendFeedback, type FeedbackSignal } from "@hanzo/ai";

/** Content-free reward signals (re-exported from the shared SDK). */
export type RewardSignal = FeedbackSignal;

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

/**
 * Emit a content-free reward signal for a generation. No-op when `requestId` is
 * falsy (never fabricate an id). Fire-and-forget: it delegates to the shared SDK
 * and returns; the SDK never throws and never touches UX. `baseUrl: ""` targets
 * the same-origin BFF, which injects the user's IAM token from the httpOnly
 * cookie — so no token is passed here.
 */
export async function sendRewardSignal(
  requestId: string | null | undefined,
  signal: RewardSignal,
  rating?: 1 | 2 | 3,
): Promise<void> {
  if (!requestId) return;
  if (signal === "rating") {
    if (rating !== 1 && rating !== 2 && rating !== 3) return;
    sendFeedback({ requestId, signal, rating }, { baseUrl: "" });
    return;
  }
  sendFeedback({ requestId, signal }, { baseUrl: "" });
}
