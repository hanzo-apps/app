/**
 * Active org scope — which organization the builder is currently acting in.
 *
 * MIRRORED FROM console2's `src/lib/org-scope.ts` (identical API + behavior) so
 * hanzo.app and console.hanzo.ai switch orgs the SAME way. The one adaptation:
 * console2 defaults to a fixed brand org (`config.iamOrgName`); hanzo.app is a
 * customer app, so the default is the signed-in user's HOME org (their IAM owner
 * claim), seeded once by the OrgProvider via `setHomeOrg`.
 *
 * The scope is a VALUE (Hickey): `currentOrg()` reads a localStorage override,
 * else the home org. `client.ts`-equivalent callers stamp it as `X-Org-Id`; the
 * server honors it only for a global admin (a normal user is pinned to their
 * owner), so switching is safe.
 *
 * TODO: hoist to @hanzo/ui (task #36) — share this module + <OrgSwitcher> between
 * console2 and hanzo.app instead of mirroring.
 */

const KEY = 'hanzo.app.org';

/** The user's home org (IAM owner), seeded from /v1/orgs. Module-level default. */
let homeOrg = '';

/** Seed the home org (the default scope). Called once by the OrgProvider. */
export function setHomeOrg(org: string): void {
  homeOrg = (org || '').trim();
}

/** The user's home org (the default scope). */
export function getHomeOrg(): string {
  return homeOrg;
}

/** The org the builder is currently scoped to (default: the home org). */
export function currentOrg(): string {
  if (typeof window !== 'undefined') {
    try {
      const v = window.localStorage.getItem(KEY);
      if (v) return v;
    } catch {
      // localStorage blocked (private mode / SSR) — fall back to the home org.
    }
  }
  return homeOrg;
}

/** Switch the active org scope. Passing the home org clears the override. */
export function setCurrentOrg(org: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!org || org === homeOrg) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, org);
  } catch {
    // Storage blocked — the scope simply stays at the home org.
  }
}

/** True when the builder is scoped to a non-default (switched) org. */
export function isScopedAway(): boolean {
  return currentOrg() !== homeOrg;
}

/**
 * Switch the active org scope and hard-reload so every module refetches under the
 * new `X-Org-Id`. The ONE way the builder changes org (used by the OrgSwitcher).
 */
export function switchOrg(org: string): void {
  if (!org || org === currentOrg()) return;
  setCurrentOrg(org);
  if (typeof window !== 'undefined') window.location.reload();
}

/** Case-insensitive filter over org name + display name (the switcher search). */
export function filterOrgs<T extends { name: string; displayName?: string }>(
  orgs: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return orgs;
  return orgs.filter(
    (o) => o.name.toLowerCase().includes(q) || (o.displayName ?? '').toLowerCase().includes(q),
  );
}

/** Title-case an org slug for display (`maxpower` → `Maxpower`). */
export const titleCase = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * The display name of org `id` — its title-cased slug (`maxpower` → `Maxpower`).
 * The ONE way the chrome names the org it's scoped to (the OrgSwitcher's primary
 * label, the wallet's scope tag), and it names the ORG, never the person.
 *
 * We deliberately IGNORE each org's server-supplied `displayName` (`_orgs`): the
 * cloud fills it from the signed-in IAM *user's* display-name claim, so trusting
 * it leaks the person ("Dave Lorenzini", "Z — Maxpower Admin") into the org
 * label. The slug is the org's own stable, identifier-safe identity and can never
 * carry a person, so it is the ONE honest source. '' when `id` is empty. `_orgs`
 * is kept so the call sites (OrgSwitcher + SidebarWallet) pass the list they hold.
 */
export function orgDisplayName(
  _orgs: ReadonlyArray<{ name: string; displayName?: string }>,
  id: string,
): string {
  return id ? titleCase(id) : '';
}
