import { test } from "node:test";
import assert from "node:assert/strict";

import { isDeadModelId, resolveModelId, DEFAULT_MODEL } from "../../lib/providers.ts";

/**
 * isDeadModelId / resolveModelId — the ONE guard that keeps a stale model
 * selection from breaking the builder. The Hanzo gateway serves the Zen ladder
 * (+ connected providers), NOT OpenAI `gpt-*` / `o1|o3` / legacy `-codex` ids. A
 * dead id persisted in `localStorage["model"]` by an older build was sent verbatim
 * → gateway "model … is not available" → empty stream → the user saw "The model
 * didn't return a usable page." These tests pin the exact ids we must remap and,
 * just as importantly, the real ids + smart-routing sentinel we must NOT touch.
 */

test("dead OpenAI / codex ids are flagged", () => {
  for (const id of [
    "gpt-5.3-codex", // the exact id that broke editing
    "gpt-5-codex",
    "gpt-5.1-codex-mini",
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
    "o1",
    "o1-preview",
    "o3-mini",
    "text-davinci-003",
    "some-vendor-codex", // any `-codex` id the gateway doesn't serve
  ]) {
    assert.equal(isDeadModelId(id), true, `${id} should be dead`);
  }
});

test("real gateway ids and the smart-routing sentinel pass through", () => {
  for (const id of [
    "zen5-coder",
    "zen5-flash",
    "zen5",
    "zen5-pro",
    "zen5-max",
    "zen5-nano",
    "qwen3-coder",
    "qwen3-coder-flash",
    "anthropic-claude-5-sonnet",
    "anthropic-claude-opus-4.7",
    "auto", // smart routing — MUST survive so the gateway can route
  ]) {
    assert.equal(isDeadModelId(id), false, `${id} should be servable`);
  }
});

test("empty / null / undefined are not 'dead' but resolve to the default", () => {
  // isDeadModelId is false for blanks (nothing to flag)…
  assert.equal(isDeadModelId(""), false);
  assert.equal(isDeadModelId(null), false);
  assert.equal(isDeadModelId(undefined), false);
  // …while resolveModelId still coerces a blank to the canonical default.
  assert.equal(resolveModelId(""), DEFAULT_MODEL);
  assert.equal(resolveModelId(null), DEFAULT_MODEL);
  assert.equal(resolveModelId(undefined), DEFAULT_MODEL);
});

test("resolveModelId remaps dead ids to the default, preserves real ids and auto", () => {
  assert.equal(resolveModelId("gpt-5.3-codex"), DEFAULT_MODEL);
  assert.equal(resolveModelId("gpt-4o"), DEFAULT_MODEL);
  assert.equal(resolveModelId("o3-mini"), DEFAULT_MODEL);
  // real ids and smart-routing are returned untouched
  assert.equal(resolveModelId("zen5-coder"), "zen5-coder");
  assert.equal(resolveModelId("qwen3-coder"), "qwen3-coder");
  assert.equal(resolveModelId("auto"), "auto");
  // surrounding whitespace is trimmed, not treated as a distinct id
  assert.equal(resolveModelId("  zen5-pro  "), "zen5-pro");
  assert.equal(resolveModelId("  gpt-5.3-codex "), DEFAULT_MODEL);
});
