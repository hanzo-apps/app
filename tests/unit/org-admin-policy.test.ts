import { isPlatformSudo, isStaffAdmin, STAFF_ORGS } from '@/lib/org/policy';

/**
 * The admin predicate — the ONE statement of "who may edit live" and "who may
 * cross tenants". These are PURE over already-VALIDATED claims; the trust
 * decision (bearer is IAM-signed and minted for this app) belongs to the single
 * caller in lib/org/server.ts and is not re-litigated here.
 *
 * Regression pinned: the previous predicate ANDed `owner === 'admin'` with a
 * phantom `isGlobalAdmin` claim IAM never emits, while hanzo.app's IAM app
 * lives in the `hanzo` org — so it was FALSE for everyone and live edit could
 * never open for anybody.
 */
describe('isStaffAdmin — who may edit live', () => {
  it('the real owner identity is staff (the regression that was false for everyone)', () => {
    expect(isStaffAdmin({ owner: 'hanzo', email: 'z@hanzo.ai' })).toBe(true);
  });

  it('platform sudo is staff by construction', () => {
    expect(isStaffAdmin({ owner: 'admin' })).toBe(true);
  });

  it('an IAM org-admin of any brand/staff org is staff', () => {
    for (const org of STAFF_ORGS) {
      expect(isStaffAdmin({ owner: org, isAdmin: true })).toBe(true);
    }
  });

  it('a verified staff email is staff regardless of home org', () => {
    expect(isStaffAdmin({ owner: 'acme', email: 'Z@Hanzo.AI' })).toBe(true);
  });

  it('a customer is NOT staff', () => {
    expect(isStaffAdmin({ owner: 'acme', email: 'dave@acme.com' })).toBe(false);
    expect(isStaffAdmin({ owner: 'acme', isAdmin: true, email: 'dave@acme.com' })).toBe(false);
    expect(isStaffAdmin({})).toBe(false);
  });

  it('a look-alike domain is NOT staff', () => {
    expect(isStaffAdmin({ owner: 'acme', email: 'a@nothanzo.ai' })).toBe(false);
    expect(isStaffAdmin({ owner: 'acme', email: 'a@hanzo.ai.evil.com' })).toBe(false);
  });
});

describe('isPlatformSudo — who may cross tenants', () => {
  it('only the admin org', () => {
    expect(isPlatformSudo({ owner: 'admin' })).toBe(true);
    expect(isPlatformSudo({ owner: 'hanzo', isAdmin: true, email: 'z@hanzo.ai' })).toBe(false);
  });

  it('is strictly narrower than staff — widening edit never widens scope', () => {
    const staffNotSudo = { owner: 'hanzo', email: 'z@hanzo.ai' };
    expect(isStaffAdmin(staffNotSudo)).toBe(true);
    expect(isPlatformSudo(staffNotSudo)).toBe(false);
  });
});
