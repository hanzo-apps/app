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
 *   402  CREDIT. Already had a home; kept here so all four live together.
 *   else the SERVICE. The ONLY case where "try again" is honest.
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

const CREDENTIAL =
  "Your API credential was rejected. Mint a new key at https://cloud.hanzo.ai/keys";
const FORBIDDEN =
  "Your account doesn't have access to this model.";
const CREDIT = "You're out of credits.";

/**
 * The one sentence that promises the user waiting will help — so it is the one
 * sentence that must never be shown for a credential or a permission. The
 * client imports it for the failures it detects itself (a dead socket, a
 * bodyless response) so both sides of the boundary say this in one voice.
 */
export const UNAVAILABLE =
  "The AI service is unavailable — try again in a minute.";

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

  // Anything else is the service failing, not the caller. One status (502) and
  // one sentence, because the client cannot act on the difference between a
  // gateway 500 and a gateway 504.
  return { body: { ok: false, message: stated || UNAVAILABLE }, status: 502 };
}
