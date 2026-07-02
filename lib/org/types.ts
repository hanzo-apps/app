/**
 * Org-scoping types — the shared vocabulary for hanzo.app's multi-tenant model.
 *
 * Ground truth (Hanzo IAM / cloud): an IAM user belongs to exactly ONE org
 * (`user.owner`), and the cloud gateway derives the tenant STRICTLY from the
 * bearer's `owner` claim (a non-admin bearer can never widen scope). So a
 * hanzo.app session is scoped to one org — the user's home org, which is either
 * their auto-provisioned PERSONAL org or a REAL org they belong to. Every
 * project/deploy/billing call is attributed to that org. A global admin (member
 * of the `admin` org) is the one principal that may act across orgs.
 *
 * This module is transport-free and safe to import from both client and server.
 */

/** An organization the signed-in user can act in. */
export interface Org {
  /** Org slug — the IAM owner / X-Org-Id. Stable, DNS/identifier-safe. */
  name: string;
  /** Human display name (falls back to `name`). */
  displayName: string;
  /** True for an auto-provisioned personal workspace (personal billing). */
  isPersonal: boolean;
}

/**
 * The resolved org context for a request/session. `orgs` is the honest set the
 * user can act in — exactly one for a normal user (their home org), the full
 * tenant list for a global admin. Never fabricated.
 */
export interface OrgContext {
  /** Orgs the user can act in (>=1 for a signed-in user, or [] when zero-org). */
  orgs: Org[];
  /** The org all scoped calls attribute to (the selected/effective org). */
  currentOrg: string;
  /** The user's IAM home org (bearer `owner` claim); '' when unassigned. */
  homeOrg: string;
  /** True when the caller is an `admin`-org member (may cross orgs). */
  isGlobalAdmin: boolean;
  /** True when the user has NO home org yet → must onboard before building. */
  needsOnboarding: boolean;
}
