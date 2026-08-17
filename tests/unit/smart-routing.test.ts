import assert from "node:assert/strict";

import { AUTO_MODEL, isSmartRouting, resolveSmartRouting } from "../../lib/providers";

/**
 * resolveSmartRouting — the ONE precedence rule for a NEW session's smart
 * routing, mirrored (not abstracted) across chat/app/console. `localPref` is the
 * user override (true=on, false=off, null=follow org default); `defaults` is the
 * server-driven org policy (null = unknown / older cloud-api).
 */

test("fail-soft: no org policy → local preference only, default OFF", () => {
  // A fresh session with no org policy opens on DEFAULT_MODEL (Enso), not on
  // the separate `auto` router — otherwise the stated product default is never
  // what a new user actually gets.
  assert.deepEqual(resolveSmartRouting(null, null), {
    enabled: false,
    toggleDisabled: false,
  });
  assert.deepEqual(resolveSmartRouting(true, null), {
    enabled: true,
    toggleDisabled: false,
  });
  assert.deepEqual(resolveSmartRouting(false, null), {
    enabled: false,
    toggleDisabled: false,
  });
});

test("org disables routing → off and locked, ignoring local preference", () => {
  const off = { autoRoutingActive: false, defaultSessionRouting: true };
  for (const pref of [null, true, false] as const) {
    assert.deepEqual(resolveSmartRouting(pref, off), {
      enabled: false,
      toggleDisabled: true,
    });
  }
});

test("org active, no local override → follows the org default", () => {
  assert.deepEqual(
    resolveSmartRouting(null, {
      autoRoutingActive: true,
      defaultSessionRouting: true,
    }),
    { enabled: true, toggleDisabled: false }
  );
  assert.deepEqual(
    resolveSmartRouting(null, {
      autoRoutingActive: true,
      defaultSessionRouting: false,
    }),
    { enabled: false, toggleDisabled: false }
  );
});

test("org active, local override wins over the org default", () => {
  const defaultOn = { autoRoutingActive: true, defaultSessionRouting: true };
  const defaultOff = { autoRoutingActive: true, defaultSessionRouting: false };
  assert.equal(resolveSmartRouting(false, defaultOn).enabled, false);
  assert.equal(resolveSmartRouting(true, defaultOff).enabled, true);
  assert.equal(resolveSmartRouting(false, defaultOn).toggleDisabled, false);
});

/**
 * Unset is NOT routing.
 *
 * It used to be: `isSmartRouting("")` answered true, so every fresh session —
 * the builder's first prompt, a new chat, any untouched picker — was routed.
 * Routing resolves to the gateway's `best`, whose every arm is one provider;
 * measured live, that provider answered 429 "Platform overloaded", all five arms
 * failed, and the surface said "That model didn't respond." Meanwhile enso and
 * zen5 answered 200 throughout.
 *
 * A default that one vendor can take out is not a default. Routing is something
 * a person turns ON.
 */
test("unset is the default model, not smart routing", () => {
  assert.equal(isSmartRouting(""), false);
  assert.equal(isSmartRouting(null), false);
  assert.equal(isSmartRouting(undefined), false);
  assert.equal(isSmartRouting(AUTO_MODEL), true);
  assert.equal(isSmartRouting("enso"), false);
});
