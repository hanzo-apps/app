import { BRAND_ORGS, isSuperAdmin, isStaffAdmin } from '@/lib/org/policy';

/**
 * The admin predicate — the ONE statement of "who may edit live" and "who may
 * cross tenants". These are PURE over already-VALIDATED claims; the trust
 * decision (bearer is IAM-signed and minted for this app) belongs to the single
 * caller in lib/org/server.ts and is not re-litigated here.
 *
 * Regression pinned: the previous predicate ANDed `owner === 'admin'` with a
 * phantom super-admin claim IAM never emits, while hanzo.app's IAM app lives in
 * the `hanzo` org — so it was FALSE for everyone and live edit could never open
 * for anybody.
 */
describe('isStaffAdmin — who may edit live', () => {
  it('the real owner identity is staff (the regression that was false for everyone)', () => {
    expect(isStaffAdmin({ owner: 'hanzo', email: 'z@hanzo.ai' })).toBe(true);
  });

  it('ANY person in the admin org is staff — membership alone, no claim', () => {
    expect(isStaffAdmin({ owner: 'admin' })).toBe(true);
  });

  it('an IAM org-admin of any brand org is staff', () => {
    for (const org of BRAND_ORGS) {
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

describe('isSuperAdmin — who may cross tenants', () => {
  it('ANY person in the admin org, with no further claim', () => {
    expect(isSuperAdmin({ owner: 'admin' })).toBe(true);
  });

  it('ONLY the admin org — no brand org, org-admin flag, or staff email grants it', () => {
    expect(isSuperAdmin({ owner: 'hanzo', isAdmin: true, email: 'z@hanzo.ai' })).toBe(false);
    for (const org of BRAND_ORGS) {
      expect(isSuperAdmin({ owner: org, isAdmin: true, email: `x@${'hanzo.ai'}` })).toBe(false);
    }
    expect(isSuperAdmin({})).toBe(false);
  });

  it('is strictly narrower than staff — widening edit never widens scope', () => {
    const staffNotSudo = { owner: 'hanzo', email: 'z@hanzo.ai' };
    expect(isStaffAdmin(staffNotSudo)).toBe(true);
    expect(isSuperAdmin(staffNotSudo)).toBe(false);
  });
});
