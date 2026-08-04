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

import { IamError, adminConfigured, iam } from '@/lib/iam-admin';

/**
 * True when the confidential client is wired (so routes can 501 honestly).
 * The transport moved to `lib/iam-admin` once the profile writer needed the same
 * client; this name stays because `app/onboard/route.ts` asks the question in
 * its own vocabulary.
 */
export const onboardConfigured = adminConfigured;

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
