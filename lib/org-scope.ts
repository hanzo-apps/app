/**
 * Active org scope — which organization the builder is currently acting in.
 *
 * The CANONICAL contract is `orgScope`/`filterOrgs` in `@hanzo/ui@8` (hoisted
 * per hanzoai/ui#36); this module matches it. It stays LOCAL here (recorded
 * debt) because the hoisted factory
 * fixes `brandOrg` at construction while hanzo.app's default is the signed-in
 * user's HOME org (the first entry of their signed `orgs` claim — NOT the IAM
 * `owner` claim, which carries the APPLICATION's org), seeded late by the
 * OrgProvider via `setHomeOrg`. Behavior is identical: `currentOrg()` reads a localStorage
 * override, else the home org; switching persists + reloads so every module
 * refetches under the new `X-Org-Id` (the server honors it only for a global
 * admin — a normal user is pinned to their home org).
 */

import { resolveOrgLogo } from '@/lib/avatar';

const KEY = 'hanzo.app.org';

/** The user's home org (`orgs[0].org`), seeded from /v1/orgs. Module-level default. */
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

/**
 * An org as the CHROME shows it — the one place the app's org row is turned
 * into the value `OrgSwitcher` and `OrgMark` read.
 *
 * It exists to enforce two rules the package cannot know:
 *
 *  - the label is the title-cased SLUG, never the server's `displayName`. The
 *    cloud fills that field from the signed-in *user's* display-name claim, so
 *    handing the row through untouched paints a person's name where an org's
 *    belongs. `OrgMark` reads `displayName || name` and `OrgSwitcher` reads it
 *    for every row, so the rule has to hold HERE or it holds nowhere.
 *  - the logo is `resolveOrgLogo`'s answer, which layers the user's local emoji
 *    override and the known defaults over whatever `/v1/orgs` supplied — IAM
 *    does not carry the field yet, and the override is how a workspace gets a
 *    mark today.
 */
export function display(org: { name: string; logo?: string }): {
  name: string;
  displayName: string;
  logo?: string;
} {
  return {
    name: org.name,
    displayName: titleCase(org.name),
    logo: resolveOrgLogo(org.name, org.logo),
  };
}

/**
 * The active-org contract `@hanzo/ui`'s `OrgSwitcher` reads, bound to this app's
 * scope.
 *
 * It is an object over the functions above rather than a call to the package's
 * `orgScope` factory, and the reason is timing: the factory fixes `brandOrg` at
 * construction, while hanzo.app's default scope is the signed-in user's HOME org
 * — which arrives LATE, from `/v1/orgs`, via `setHomeOrg`. Reading through these
 * functions defers every answer to call time, so the switcher is correct on the
 * first paint after the session resolves instead of pinned to whatever was known
 * when the module loaded.
 */
export const scope = {
  currentOrg,
  setCurrentOrg,
  isScopedAway,
  switchOrg,
  /** A scope resolves as soon as a home org is seeded; this app has no picker. */
  hasSelectedOrg: (): boolean => Boolean(currentOrg()),
  enterOrg(org: string): void {
    setCurrentOrg(org);
    if (typeof window !== 'undefined') window.location.assign('/');
  },
  /** Back to the home org — the de-scope this app can honestly offer. */
  leaveOrg(): void {
    setCurrentOrg('');
    if (typeof window !== 'undefined') window.location.assign('/');
  },
};
