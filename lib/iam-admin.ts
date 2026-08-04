/**
 * The server's PRIVILEGED IAM client — one transport, one error convention.
 *
 * Distinct from `lib/iam.ts`, which is the request-time READER: it verifies the
 * caller's session against JWKS and answers "who is this". This module is the
 * WRITER, authenticating as the app's confidential OAuth client (Basic auth) to
 * reach IAM's privileged `/v1/iam/*` primitives. The browser never holds this
 * credential.
 *
 * It lives here rather than inside `lib/org/onboard.ts` because it is not about
 * orgs. Onboarding needed it first and owned it privately; the profile writer
 * needs the same three-way error contract, and a second copy is how two callers
 * come to disagree about what a 403 means. One transport, two callers.
 *
 * EVERY caller must bind its target to the resolved session. This client can
 * address any row in IAM, so the authorization boundary is the route that calls
 * it — never a value that arrived from the browser.
 */
import 'server-only';

const trim = (s: string) => s.replace(/\/+$/, '');

/** IAM host serving the privileged `/v1/iam/*` primitives. */
const IAM_ADMIN_URL = trim(
  process.env.IAM_ADMIN_URL || process.env.IAM_URL || 'https://iam.hanzo.ai',
);
const CLIENT_ID = process.env.IAM_MINT_CLIENT_ID || process.env.IAM_CLIENT_ID || '';
const CLIENT_SECRET =
  process.env.IAM_MINT_CLIENT_SECRET || process.env.IAM_CLIENT_SECRET || '';

/** True when the confidential client is wired (so routes can 501 honestly). */
export function adminConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

function basicAuth(): string {
  return 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
}

/**
 * IAM's genuine-absence answer, verbatim (`internal/compat/aliases.go`
 * getHandler). It arrives as HTTP **200**: `httpx.Err` is 200 by contract — the
 * SDK is told to "branch on status, not HTTP code" — so absence is an ENVELOPE
 * fact and never a 404.
 */
export const ABSENT = 'the entity does not exist';

/**
 * Upstream timeout. A reachable-but-silent IAM would otherwise wedge the calling
 * route until the caller gave up. Non-positive opts out.
 */
const TIMEOUT_MS = Number(process.env.IAM_TIMEOUT_MS || 10_000);

/** An IAM answer we could not act on. `absent` marks the ONE benign kind. */
export class IamError extends Error {
  constructor(
    message: string,
    readonly absent = false,
  ) {
    super(message);
  }
}

/**
 * THE IAM call — it returns data or throws.
 *
 * IAM answers three DIFFERENT things and they must stay three:
 *
 *   hit      200 `{status:"ok", data}`                       → the data
 *   absence  200 `{status:"error", msg:"<ABSENT>"}`          → throw, `absent`
 *   refusal  403 `{status:"error", msg:"forbidden: …"}`      → throw (authz.Deny)
 *
 * plus an unreachable IAM and a malformed envelope, which are also throws. Only
 * a caller for whom "no such row" is a legitimate answer may soften `absent`.
 * Collapsing a refusal or a network error into "it does not exist" is how a
 * caller decides a taken slug is free and writes over it, so this never does it.
 *
 * A body makes it a POST; without one it is a GET.
 */
export async function iam<T>(
  path: string,
  query: Record<string, string>,
  body?: unknown,
): Promise<T> {
  if (!adminConfigured()) {
    throw new IamError(`IAM ${path} refused: no confidential client is configured`);
  }
  const qs = new URLSearchParams(query).toString();
  const write = body !== undefined;
  let res: Response;
  try {
    res = await fetch(`${IAM_ADMIN_URL}${path}${qs ? `?${qs}` : ''}`, {
      ...(write ? { method: 'POST', body: JSON.stringify(body) } : {}),
      headers: {
        Authorization: basicAuth(),
        Accept: 'application/json',
        ...(write ? { 'Content-Type': 'application/json' } : {}),
      },
      cache: 'no-store',
      signal: TIMEOUT_MS > 0 ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
    });
  } catch (e) {
    throw new IamError(`IAM ${path} unreachable: ${e instanceof Error ? e.message : String(e)}`);
  }
  const json = (await res.json().catch(() => null)) as
    | { status?: string; msg?: string; data?: T }
    | null;
  // A non-2xx is an authorization or transport verdict, never a statement about
  // whether the row exists.
  if (!res.ok) throw new IamError(json?.msg || `IAM ${path} failed (HTTP ${res.status})`);
  if (!json || json.status !== 'ok') {
    const msg = json?.msg || `IAM ${path} returned an unreadable response`;
    throw new IamError(msg, msg === ABSENT);
  }
  return (json.data ?? null) as T;
}
