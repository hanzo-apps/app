/**
 * Server-only org onboarding — create the signed-in user's org + move them in.
 *
 * Mirrors console2's `src/lib/server/identity.ts` org-onboarding calls so both
 * surfaces provision orgs the SAME way (one-and-only-one-way). The browser never
 * holds an admin credential: this runs on the server as the confidential IAM
 * client (Basic auth) and can only ever move the SIGNED-IN user (the route binds
 * the target id to the resolved session).
 *
 * Ground truth: an IAM user belongs to exactly ONE org (`user.owner`), and IAM
 * already has a first-class personal-org concept (`Organization.IsPersonal` +
 * `CreatePersonalOrganization`). Giving a zero-org user their own org therefore
 * means creating an org and MOVING them into it as admin (owner=slug,
 * isAdmin=true) so their next JWT carries the new owner.
 *
 * Confidential client: prefer the dedicated IAM_MINT_CLIENT_ID/SECRET; fall back
 * to the app's own IAM_CLIENT_ID/SECRET. Either app MUST be allowlisted in IAM's
 * IAM_ORG_ADMIN_APPS + IAM_USER_ADMIN_APPS for these ops to succeed — when
 * unwired, callers return an honest 501 (never a fabricated success).
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
export function onboardConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

function basicAuth(): string {
  return 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
}

/** An IAM organization (only the fields we read/clone). */
interface IamOrganization {
  owner?: string;
  name?: string;
  displayName?: string;
  passwordType?: string;
  passwordSalt?: string;
  passwordObfuscatorType?: string;
  passwordObfuscatorKey?: string;
  passwordOptions?: string[];
  countryCodes?: string[];
  languages?: string[];
  defaultAvatar?: string;
  accountItems?: unknown[];
  [k: string]: unknown;
}

/**
 * IAM's genuine-absence answer, verbatim (`internal/compat/aliases.go`
 * getHandler). It arrives as HTTP **200**: `httpx.Err` is 200 by contract — the
 * SDK is told to "branch on status, not HTTP code" — so absence is an ENVELOPE
 * fact and never a 404.
 */
const ABSENT = 'the entity does not exist';

/**
 * Upstream timeout. The console's twin of this client bounds every request-time
 * fetch; this one did not, so a reachable-but-silent IAM would wedge the
 * onboarding route until the caller gave up. A timeout surfaces as an
 * unreachable IAM — which is a throw, never an absence. Non-positive opts out.
 */
const TIMEOUT_MS = Number(process.env.IAM_TIMEOUT_MS || 10_000);

/** An IAM answer we could not act on. `absent` marks the ONE benign kind. */
class IamError extends Error {
  constructor(
    message: string,
    readonly absent = false,
  ) {
    super(message);
  }
}

/**
 * THE IAM call — one transport, one error convention: it returns data or throws.
 *
 * IAM answers three DIFFERENT things and they must stay three (v1.33.31 made org
 * scoping honour-or-refuse in `internal/authz/authz.go` `Scope`):
 *
 *   hit      200 `{status:"ok", data}`                       → the data
 *   absence  200 `{status:"error", msg:"<ABSENT>"}`          → throw, `absent`
 *   refusal  403 `{status:"error", msg:"forbidden: …"}`      → throw (authz.Deny)
 *
 * plus an unreachable IAM and a malformed envelope, which are also throws. Only
 * a caller for whom "no such row" is a legitimate answer may soften `absent` —
 * see {@link getOrganization}. Collapsing a refusal or a network error into "it
 * does not exist" is how a caller decides a taken slug is free and writes over
 * it, so this function never does it.
 *
 * A body makes it a POST; without one it is a GET.
 */
async function iam<T>(path: string, query: Record<string, string>, body?: unknown): Promise<T> {
  if (!onboardConfigured()) {
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

/**
 * Read an organization (owned by the `admin` org) by name.
 *
 * The ONE place a missing row is a legitimate answer, so the ONE place `absent`
 * becomes `null` — every other failure propagates. `null` here therefore means
 * "IAM says there is no such org", not "we could not find out".
 */
export async function getOrganization(name: string): Promise<IamOrganization | null> {
  try {
    return await iam<IamOrganization | null>('/v1/iam/get-organization', { id: `admin/${name}` });
  } catch (e) {
    if (e instanceof IamError && e.absent) return null;
    throw e;
  }
}

/**
 * Create a customer organization. Clones password + locale settings from the
 * caller's org (so the moved user's login is unaffected) and clears all
 * instance-specific material. Owned by the `admin` org; `personal` marks a
 * personal workspace (personal billing).
 */
export async function createOrganization(opts: {
  name: string;
  displayName: string;
  personal: boolean;
  sourceOwner: string;
}): Promise<void> {
  // BEST-EFFORT clone. Unlike the existence probe — whose answer decides whether
  // we write at all — this read only picks password/locale DEFAULTS, and the
  // documented fallbacks below are already what an absent source yields. So an
  // unreadable source org (a confidential client scoped to another org is
  // refused here under IAM v1.33.31) must not block onboarding. Tolerated at
  // this ONE call site, deliberately and locally — the transport still reports.
  const src = opts.sourceOwner
    ? await getOrganization(opts.sourceOwner).catch(() => null)
    : null;
  const org: IamOrganization = {
    owner: 'admin',
    name: opts.name,
    displayName: opts.displayName,
    createdTime: new Date().toISOString(),
    isPersonal: opts.personal,
    passwordType: src?.passwordType || 'bcrypt',
    passwordSalt: src?.passwordSalt || '',
    passwordObfuscatorType: src?.passwordObfuscatorType || 'Plain',
    passwordObfuscatorKey: src?.passwordObfuscatorKey || '',
    passwordOptions: src?.passwordOptions ?? ['AtLeast6'],
    countryCodes: src?.countryCodes ?? ['US'],
    languages: src?.languages ?? ['en'],
    defaultAvatar: src?.defaultAvatar || 'https://cdn.hanzo.ai/img/hanzo-cloud-user.png',
    accountItems: src?.accountItems ?? [],
    defaultApplication: '',
    logo: '',
    logoDark: '',
    favicon: '',
    masterPassword: '',
    defaultPassword: '',
    masterVerificationCode: '',
    mfaItems: [],
    tags: [],
    websiteUrl: '',
    enableSoftDeletion: false,
    isProfilePublic: false,
  };
  await iam('/v1/iam/add-organization', {}, org);
}

/**
 * Move a user into `org` as that org's admin. Sends the FULL current user object
 * (IAM's update-user overwrites the default column set) with owner + isAdmin
 * changed. `id` is the `<owner>/<name>` composite the route binds to the session,
 * so this can only ever move the signed-in user.
 */
export async function moveUserToOrg(id: string, org: string): Promise<void> {
  const current = await iam<Record<string, unknown> | null>('/v1/iam/get-user', { id });
  // An `ok` envelope carrying no row: never seen from get-user, but a partial
  // object here would blank the user's columns on update, so refuse it.
  if (!current) throw new Error(`IAM returned no user for ${id}`);
  const moved = { ...current, owner: org, isAdmin: true };
  await iam('/v1/iam/update-user', { id }, moved);
}
