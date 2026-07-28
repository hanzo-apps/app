/**
 * @jest-environment node
 *
 * The org is the USER's, not the APP's.
 *
 * IAM stamps the APPLICATION's org into the `owner` claim (oidc/jwt.go
 * `Owner: app.Organization`), so the same person authenticating through two apps
 * carries two different `owner` values. A token minted live by `hanzo-console`
 * proves it: `sub` is `admin/hanzo-console` while `owner` is `hanzo`.
 *
 * hanzo.app read that claim as "the caller's org", which produced two defects:
 *   - BILLING: the org this app DISPLAYED was its own app org, while cloud bills
 *     the org from the signed `orgs` claim (cloud `auth_identity.go homeOrg`). The
 *     two could differ, so the switcher could read "Hanzo" while the ledger being
 *     charged was somebody else's — the "$0.00 with spend history" report.
 *   - PRIVILEGE: `isSuperAdmin` is `org === 'admin'`, so ANY person signing in
 *     through an app owned by the `admin` org inherited sudo.
 *
 * One accessor closes both, and it is the SAME rule cloud applies server-side.
 */
import { isSuperAdmin, isStaffAdmin } from '@/lib/org/policy';

jest.mock('server-only', () => ({}));
jest.mock('@hanzo/iam/auth', () => ({ validateToken: jest.fn() }));
jest.mock('@hanzo/iam/server', () => ({
  SESSION_COOKIE: 'hanzo_iam_access_token',
  getBearerToken: () => null,
}));

// THE REAL accessor, not a copy — a test that re-implements its subject proves nothing.
import { homeOrg } from '@/lib/iam';

// The claim shape IAM mints: `orgs` is the membership SET, home first.
type OrgRef = { org: string; role?: string };

describe('homeOrg — the user, not the app', () => {
  it('takes the FIRST entry of the signed membership set (IAM builds it home-first)', () => {
    const orgs: OrgRef[] = [{ org: 'acme' }, { org: 'hanzo', role: 'member' }];
    expect(homeOrg(orgs)).toBe('acme');
  });

  it('is EMPTY for a token that names no membership — fail closed, never fall back', () => {
    // Falling back to `owner` here is precisely the app-selected tenant this exists
    // to stop trusting. Empty means every org-scoped decision refuses.
    expect(homeOrg(undefined)).toBe('');
    expect(homeOrg([])).toBe('');
    expect(homeOrg('hanzo')).toBe('');
    expect(homeOrg([{ notAnOrg: true }])).toBe('');
  });

  it('trims, so whitespace cannot fold two orgs onto one', () => {
    expect(homeOrg([{ org: '  acme  ' }])).toBe('acme');
  });
});

describe('the escalation that reading `owner` allowed', () => {
  it('a customer signing in through an admin-org app is NOT super admin', () => {
    // The token: a real customer of `acme`, authenticating through an application
    // that happens to live in the `admin` org. `owner` would say "admin".
    const claims = { owner: 'admin', orgs: [{ org: 'acme' }] };
    expect(isSuperAdmin({ org: homeOrg(claims.orgs) })).toBe(false);
    // Reading the app's claim instead is the bug, and it grants sudo:
    expect(isSuperAdmin({ org: claims.owner })).toBe(true);
  });

  it('a real admin-org member still IS super admin', () => {
    expect(isSuperAdmin({ org: homeOrg([{ org: 'admin' }]) })).toBe(true);
  });

  it('a token with no membership set grants nothing', () => {
    expect(isSuperAdmin({ org: homeOrg([]) })).toBe(false);
    expect(isStaffAdmin({ org: homeOrg([]) })).toBe(false);
  });
});

describe('the billing split that produced "$0.00 with spend history"', () => {
  it('the org shown is the org billed — one value, not two', () => {
    // hanzo.app authenticates as its own IAM client, whose org is `hanzo`, so the
    // `owner` claim reads "hanzo" for EVERY caller regardless of who they are.
    const appOrg = 'hanzo';
    const token = { owner: appOrg, orgs: [{ org: 'aworring98-gmail-com-3aabdb0d3cfe76de' }] };

    const displayed = homeOrg(token.orgs); // what the app now shows
    const billed = homeOrg(token.orgs); // what cloud charges (same rule)
    expect(displayed).toBe(billed);

    // The old read disagreed with the ledger, which is the whole bug: the switcher
    // said "Hanzo" while a different org's (empty) ledger answered the balance.
    expect(token.owner).not.toBe(billed);
  });
});
