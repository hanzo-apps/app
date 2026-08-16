/**
 * What to tell the user when the gateway refuses.
 *
 * The gateway states a reason, and reading it is the whole job. It used to be
 * read into a `detail` local and then dropped on the floor: every 401 and 403
 * collapsed into `{ openLogin: true, message: "Sign in to build" }`, and
 * everything else became a 502 the client renders as "temporarily
 * unavailable — try again in a minute". So a revoked key — a thing no amount of
 * waiting fixes, and which the gateway explains precisely, naming the key
 * prefix and where to mint a replacement — read to the user as an outage. That
 * cost the platform owner an afternoon of debugging a healthy service.
 *
 * The distinction this restores:
 *
 *   401  the CREDENTIAL. A verified IAM session (JWKS-checked, `exp` honored —
 *        see lib/iam.ts) is what got the request this far, so signing in again
 *        changes nothing: what the gateway rejected is the credential behind
 *        the session. Never `openLogin` here; that loop is the time-waster.
 *   403  PERMISSION. The credential is real and the service is fine, this
 *        identity simply is not allowed. Retrying cannot help, so we never
 *        suggest it.
 *   402  CREDIT. Already had a home; kept here so all five live together.
 *   429  RATE. The one status where waiting is the whole remedy.
 *   else the MODEL. The gateway answers 502 for ids it lists but cannot reach,
 *        so this names the model and offers the move that works — picking
 *        another one — rather than promising a minute will fix it.
 *
 * `openLogin` still belongs to the genuinely-unauthenticated case — no session
 * at all — which each route checks before it ever calls the gateway.
 */

/** What the client is told. `ok: false` is the envelope every caller keys on. */
export type Refusal = {
  ok: false;
  message: string;
  /** Out of credit — raises the "Need more usage?" modal. */
  needCredits?: true;
};

// An upstream may echo the key it rejected. The Hanzo gateway already truncates
// it ("hk-902abd…"), but a full one must never reach a toast, a log or a
// screenshot just because some other upstream was less careful — so this is
// enforced here, at the boundary, rather than assumed upstream.
const KEY = /\b(hk-[A-Za-z0-9]{6})[A-Za-z0-9_-]{2,}/g;

// Long enough for any sentence the gateway actually writes, short enough that a
// stack trace or an HTML page cannot become the toast.
const LIMIT = 300;

/**
 * The sentence the gateway refused with, or "" if it did not state one.
 *
 * Strictly JSON: an upstream that answers with an HTML 502 page has said
 * nothing a user can act on, and dumping its markup into a toast is worse than
 * the honest generic. "" is the signal to use the default.
 */
export function reason(detail: string): string {
  let body: unknown;
  try {
    body = JSON.parse(detail);
  } catch {
    return "";
  }
  if (!body || typeof body !== "object") return "";

  const o = body as Record<string, unknown>;
  // `msg` is the Hanzo gateway's envelope; `error.message` / `error` / `message`
  // cover the OpenAI-compatible upstreams behind it.
  const err = o.error as { message?: unknown } | string | undefined;
  const found =
    o.msg ??
    (typeof err === "string" ? err : err?.message) ??
    o.message;

  if (typeof found !== "string") return "";
  const clean = found.replace(KEY, "$1…").trim();
  return clean.length > LIMIT ? `${clean.slice(0, LIMIT).trimEnd()}…` : clean;
}

export const CREDENTIAL =
  "Your API credential was rejected. Mint a new key at https://cloud.hanzo.ai/keys";
export const FORBIDDEN =
  "Your account doesn't have access to this model.";
/** Exported so the client's fallback and the server's are one string. */
export const CREDIT = "You're out of credits.";

/**
 * The one sentence that promises waiting is the whole remedy, so it belongs to
 * the one status where that is true.
 */
export const BUSY = "Too many requests right now — try again in a minute.";

/**
 * A 5xx names the MODEL, because that is what the reader can act on. The
 * gateway answers 502 for ids it lists but cannot reach — every `:batch` route,
 * and the retired upstream snapshots — and for those a minute changes nothing
 * while picking another model works immediately. The client imports this for the
 * failures it detects itself (a dead socket, a bodyless response) so both sides
 * of the boundary say it in one voice.
 */
export const UNAVAILABLE =
  "That model didn't respond. Try another model, or try again shortly.";

/**
 * Translate a refused gateway response into what the client should be told.
 *
 * Returns the envelope and the status to send it under — never a Response, so
 * each route keeps its own headers (the agent routes send `no-store`) and so
 * this stays a pure function the tests can read directly.
 */
export function refusal(
  status: number,
  detail: string
): { body: Refusal; status: number } {
  const stated = reason(detail);

  if (status === 401) return { body: { ok: false, message: stated || CREDENTIAL }, status: 401 };
  if (status === 403) return { body: { ok: false, message: stated || FORBIDDEN }, status: 403 };
  if (status === 402)
    return { body: { ok: false, needCredits: true, message: stated || CREDIT }, status: 402 };
  if (status === 429) return { body: { ok: false, message: stated || BUSY }, status: 429 };

  // Anything else is upstream failing, not the caller. One status (502) and one
  // sentence, because the client cannot act on the difference between a gateway
  // 500 and a gateway 504 — but it CAN act on the model, which is the commonest
  // cause: the catalog lists ids the gateway cannot reach.
  return { body: { ok: false, message: stated || UNAVAILABLE }, status: 502 };
}

/**
 * What a refused RESPONSE says, read at the CLIENT.
 *
 * `refusal()` is the write half: it puts the gateway's own sentence in
 * `message` and sends it. This is the read half, and its absence is what undid
 * the whole file. Every 402 site did
 *
 *     return { error: "need_credits", message: "You're out of credits." };
 *
 * with `request.body` still unread — so the one sentence that says WHICH limit
 * was hit, for WHICH account, was fetched and discarded, and a funded org read
 * a flat "out of credits" over a balance in the six figures. The care taken on
 * the server side is worth nothing if the last consumer substitutes a generic;
 * that is where this class always dies.
 *
 * `reason()` does the parsing, so both sides read the same shapes, redact the
 * same key prefix and cap at the same length. This adds only the await and the
 * fallback — and a body that says nothing still yields the honest default.
 */
export async function said(r: Response, fallback: string): Promise<string> {
  try {
    return reason(await r.text()) || fallback;
  } catch {
    return fallback;
  }
}
