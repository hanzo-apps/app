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

async function iamGetData<T>(path: string, query: Record<string, string>): Promise<T | null> {
  if (!onboardConfigured()) return null;
  const qs = new URLSearchParams(query).toString();
  let res: Response;
  try {
    res = await fetch(`${IAM_ADMIN_URL}${path}?${qs}`, {
      headers: { Authorization: basicAuth(), Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  const json = (await res.json().catch(() => null)) as { status?: string; data?: T } | null;
  if (!res.ok || !json || json.status !== 'ok' || json.data == null) return null;
  return json.data;
}

async function iamPostBody<T = unknown>(
  path: string,
  query: Record<string, string>,
  body: unknown,
): Promise<T> {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${IAM_ADMIN_URL}${path}${qs ? `?${qs}` : ''}`, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as
    | { status?: string; msg?: string; data?: T }
    | null;
  if (!res.ok || !json || json.status !== 'ok') {
    throw new Error(json?.msg || `IAM ${path} failed (HTTP ${res.status})`);
  }
  return (json.data ?? ({} as T));
}

/** Read an organization (owned by the `admin` org) by name; null when absent. */
export async function getOrganization(name: string): Promise<IamOrganization | null> {
  return iamGetData<IamOrganization>('/v1/iam/get-organization', { id: `admin/${name}` });
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
  const src = opts.sourceOwner ? await getOrganization(opts.sourceOwner) : null;
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
  await iamPostBody('/v1/iam/add-organization', {}, org);
}

/**
 * Move a user into `org` as that org's admin. Sends the FULL current user object
 * (IAM's update-user overwrites the default column set) with owner + isAdmin
 * changed. `id` is the `<owner>/<name>` composite the route binds to the session,
 * so this can only ever move the signed-in user.
 */
export async function moveUserToOrg(id: string, org: string): Promise<void> {
  const current = await iamGetData<Record<string, unknown>>('/v1/iam/get-user', { id });
  if (!current) throw new Error('Could not read the current user from IAM');
  const moved = { ...current, owner: org, isAdmin: true };
  await iamPostBody('/v1/iam/update-user', { id }, moved);
}
