/**
 * Org policy — PURE helpers (no Next/transport/IAM), safe on client and server.
 *
 * Mirrors console2's `src/lib/server/onboarding.ts` so hanzo.app and the console
 * share ONE naming + reserved-name policy (one-and-only-one-way). Two concerns:
 *   - NAMING: turn a human org name (or a username) into a valid IAM org slug.
 *   - RESERVED: refuse names that must never become a customer org — the
 *     brand/staff orgs and IAM's system owners.
 */

/** The single global-admin org — an `admin` member may act across any tenant. */
export const ADMIN_ORG = 'admin';

/**
 * Brand/staff orgs. A member of one of these is Hanzo staff, not a customer.
 * (Subset of RESERVED_ORGS: reserved also covers IAM's system owners, which
 * are not people.)
 */
export const STAFF_ORGS: ReadonlySet<string> = new Set([
  'admin',
  'hanzo',
  'lux',
  'zoo',
  'pars',
]);

/** The staff email domain. */
export const STAFF_EMAIL_DOMAIN = 'hanzo.ai';

/**
 * The claims an admin decision is made from. Callers MUST pass values that came
 * from a VALIDATED IAM response — these predicates are pure and make no trust
 * decision of their own.
 */
export interface AdminClaims {
  /** IAM `owner` claim — the user's home org. */
  owner?: string;
  /** IAM `isAdmin` claim — org-admin within `owner`. */
  isAdmin?: boolean;
  /** Email as asserted by IAM userinfo (never a client-supplied value). */
  email?: string;
}

/**
 * STAFF — may edit any Hanzo surface live, without credit metering.
 *
 * Three ways to be staff, in narrowing order of authority:
 *   1. a member of the `admin` org (platform sudo is staff by construction),
 *   2. an IAM org-admin of a brand/staff org,
 *   3. a verified @hanzo.ai address (IAM asserted it on the validated bearer).
 *
 * Deliberately NOT the same fact as {@link isPlatformSudo}: staff is a
 * CAPABILITY (edit), sudo is a SCOPE (act across tenants). Conflating them is
 * how a widened edit permission silently becomes cross-tenant access.
 */
export function isStaffAdmin(c: AdminClaims): boolean {
  const owner = (c.owner ?? '').trim();
  if (owner === ADMIN_ORG) return true;
  if (c.isAdmin === true && STAFF_ORGS.has(owner)) return true;
  const email = (c.email ?? '').trim().toLowerCase();
  return email.endsWith(`@${STAFF_EMAIL_DOMAIN}`);
}

/** SUDO — may act ACROSS tenants. Strictly narrower than {@link isStaffAdmin}. */
export function isPlatformSudo(c: AdminClaims): boolean {
  return (c.owner ?? '').trim() === ADMIN_ORG;
}

/** Brand/staff orgs + IAM system owners — never a customer org. */
export const RESERVED_ORGS: ReadonlySet<string> = new Set([
  // IAM system owners
  'admin',
  'built-in',
  'app',
  // brand/staff orgs
  'hanzo',
  'lux',
  'zoo',
  'pars',
]);

/** Max slug length (IAM org name is varchar(100); keep it short + readable). */
export const MAX_ORG_SLUG = 60;
/** Min slug length after normalization. */
export const MIN_ORG_SLUG = 2;

/**
 * Normalize a human name to an IAM org slug: lowercase ASCII, non-alnum → `-`,
 * collapse repeats, trim leading/trailing `-`, cap at MAX_ORG_SLUG. Returns ''
 * for input with no usable characters.
 */
export function slugifyOrg(input: string): string {
  return (input ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_ORG_SLUG)
    .replace(/-+$/g, '');
}

/**
 * The default personal-org slug for a user. An email-like username collapses to
 * its local part (`dave@x.com` → `dave`) so a personal org reads as the person.
 */
export function personalOrgSlug(username: string): string {
  const at = (username ?? '').indexOf('@');
  const base = at > 0 ? username.slice(0, at) : username;
  return slugifyOrg(base ?? '');
}

/** True when the slug is a brand/staff or system org — never creatable. */
export function isReservedOrg(slug: string): boolean {
  return RESERVED_ORGS.has(slug);
}

export type OrgNameResult = { ok: true; slug: string } | { ok: false; error: string };

/**
 * Validate + normalize a requested org name into a creatable slug, or an honest
 * error. The ONE place the create rules live (route + tests share it).
 */
export function validateOrgName(input: string): OrgNameResult {
  const slug = slugifyOrg(input);
  if (slug.length < MIN_ORG_SLUG) {
    return { ok: false, error: 'Use at least 2 letters or numbers.' };
  }
  if (isReservedOrg(slug)) {
    return { ok: false, error: `"${slug}" is reserved. Choose a different name.` };
  }
  return { ok: true, slug };
}

/**
 * The slug a project is created under. A project slug is org-unique and part of
 * the public URL; mirrors the cloud projects service `slugify` (lowercase, non-alnum →
 * `-`, collapse, trim, cap 40) so the client and server agree on the slug and
 * the record is never created with `name: None` / an empty slug.
 */
export function slugifyProject(name: string): string {
  return (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}
