import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveSmartRouting } from "../../lib/providers.ts";

/**
 * resolveSmartRouting — the ONE precedence rule for a NEW session's smart
 * routing, mirrored (not abstracted) across chat/app/console. `localPref` is the
 * user override (true=on, false=off, null=follow org default); `defaults` is the
 * server-driven org policy (null = unknown / older cloud-api).
 */

test("fail-soft: no org policy → local preference only, default on", () => {
  // prior behavior: smart routing was the default when nothing is set
  assert.deepEqual(resolveSmartRouting(null, null), {
    enabled: true,
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
