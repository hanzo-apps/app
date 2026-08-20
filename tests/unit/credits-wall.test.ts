
import { widget } from "../widget";

import { read } from "../source";

/**
 * "You have no credits" is a claim about MONEY, and only a balance we actually
 * read may make it.
 *
 * The server already knows this. `lib/billing/server.ts` answers a REASON
 * (`ok` | `noauth` | `unavailable`) rather than a bare number precisely because
 * collapsing them once told a funded customer to pay — an answer that is both
 * wrong and blames them, while the real fault (their token) went unlogged.
 * `/v1/edit` keeps the same three apart: 401 for a refused balance, 503 for an
 * unreadable one, and 402 ONLY for a balance it read and found empty.
 *
 * The widget then put them back together. `public/edit.js` read `hasCredits`
 * alone — one boolean that is false for all three — and rendered the top-up CTA
 * for every one of them. Measured in production while this was live:
 * `/v1/billing/balance` answers 401 "sign in to view billing" interleaved with
 * 200s, so this was not hypothetical.
 *
 * These are source assertions because `edit.js` is a served IIFE with no export
 * — the same shape `builder-has-no-contribute-widget` uses. What they defend is
 * cheap to undo in one line and invisible when broken: the widget still renders,
 * still looks right, and quietly bills the customer for our outage.
 */
describe("the credits wall names the right remedy", () => {
  const js = widget();

  const cta = (() => {
    const at = js.indexOf("function cta()");
    expect(at).toBeGreaterThan(-1);
    return js.slice(at, js.indexOf("\n  }", at));
  })();

  it("carries the reason, not just the boolean", () => {
    // Without this the widget cannot tell the three cases apart at all.
    expect(js).toMatch(/ME\.balanceState\s*=/);
    expect(js).toMatch(/d\.balanceState/);
  });

  it("treats an ABSENT reason as unknown, never as a zero", () => {
    // A server that predates the field must not be read as "this person is broke".
    expect(js).toMatch(/typeof d\.balanceState === 'string' \? d\.balanceState : 'unavailable'/);
  });

  it("offers to top up ONLY for a balance that was actually read", () => {
    // Both failure states must be decided BEFORE the bare `authenticated` fallback,
    // which is the branch that renders "Top up" — order is the whole fix.
    const noauth = cta.indexOf("'noauth'");
    const unavailable = cta.indexOf("'unavailable'");
    const topUp = cta.indexOf("top: true");
    expect(noauth).toBeGreaterThan(-1);
    expect(unavailable).toBeGreaterThan(-1);
    expect(topUp).toBeGreaterThan(-1);
    expect(noauth).toBeLessThan(topUp);
    expect(unavailable).toBeLessThan(topUp);
  });

  it("sends a stale session to sign-in, not to checkout", () => {
    expect(cta).toMatch(/balanceState === 'noauth'[\s\S]{0,120}stale: true/);
    expect(js).toMatch(/c\.stale[\s\S]{0,240}Sign in again/);
    // The remedy is the login page. Pointing a stale session at /billing is the bug.
    const stale = js.slice(js.indexOf("c.stale"), js.indexOf("c.stale") + 300);
    expect(stale).toContain("/login");
    expect(stale).not.toContain("/billing");
  });

  it("owns an outage instead of charging for it", () => {
    expect(cta).toMatch(/balanceState === 'unavailable'[\s\S]{0,120}down: true/);
    const down = js.slice(js.indexOf("c.down"), js.indexOf("c.down") + 300);
    expect(down).toMatch(/on us/);
    expect(down).not.toContain("/billing");
  });
});

describe("the server keeps the three answers apart", () => {
  const srv = read("lib/billing/server.ts");

  it("only a KNOWN positive balance is funded", () => {
    // Fail-closed: `noauth` and `unavailable` must never satisfy a paid gate.
    expect(srv).toMatch(/state === 'ok' && s\.cents > 0/);
  });

  it("a 200 carrying no amount is unknown, not zero", () => {
    // This is how a refusal used to be laundered into "$0.00".
    expect(srv).toMatch(/carried no amount/);
    expect(srv).toMatch(/state: 'unavailable'/);
  });
});
