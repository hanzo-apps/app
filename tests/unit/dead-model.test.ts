import assert from "node:assert/strict";

import { isDeadModelId, resolveModelId, DEFAULT_MODEL } from "../../lib/providers";

/**
 * isDeadModelId / resolveModelId — the ONE guard that keeps a stale model
 * selection from breaking the builder. The Hanzo gateway serves the Zen/Enso
 * ladder, connected providers, AND — since DO GenAI funded the proprietary
 * catalog — a curated set of modern Anthropic/OpenAI ids (`claude-*`, `gpt-4o`,
 * `gpt-4.1`, `gpt-5*`, `gpt-*-codex`). What it does NOT serve is the
 * genuinely-dead legacy families an OLDER build may have persisted in
 * `localStorage["model"]`: the o1/o3 reasoning line, davinci/cushman, gpt-3.x,
 * and the pre-4o gpt-4 line. Sending one of those verbatim → gateway "model …
 * is not available" → empty stream → "The model didn't return a usable page."
 * These tests pin the exact ids we must remap and, just as importantly, the
 * live ids + smart-routing sentinel we must NOT touch.
 */

test("genuinely-dead legacy ids are flagged", () => {
  for (const id of [
    "o1",
    "o1-preview",
    "o3-mini",
    "text-davinci-003",
    "davinci",
    "cushman",
    "code-davinci-002",
    "code-cushman-001",
    "gpt-3.5-turbo",
    "gpt-4", // pre-4o gpt-4 line
    "gpt-4-turbo",
  ]) {
    assert.equal(isDeadModelId(id), true, `${id} should be dead`);
  }
});

test("live gateway ids and the smart-routing sentinel pass through", () => {
  for (const id of [
    "enso", // Hanzo's frontier orchestrator — the trial+ rung
    "enso-flash", // its free rung, and the builder's default

    "enso-ultra",
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
    // DO GenAI proprietary catalog — live on the gateway, must NOT be remapped
    "gpt-4o",
    "gpt-4.1",
    "gpt-5.2",
    "gpt-5.3-codex",
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

test("resolveModelId remaps dead ids to the default, preserves live ids and auto", () => {
  assert.equal(resolveModelId("gpt-4-turbo"), DEFAULT_MODEL);
  assert.equal(resolveModelId("o3-mini"), DEFAULT_MODEL);
  assert.equal(resolveModelId("text-davinci-003"), DEFAULT_MODEL);
  // live ids and smart-routing are returned untouched
  assert.equal(resolveModelId("zen5-coder"), "zen5-coder");
  assert.equal(resolveModelId("qwen3-coder"), "qwen3-coder");
  assert.equal(resolveModelId("gpt-5.3-codex"), "gpt-5.3-codex");
  assert.equal(resolveModelId("auto"), "auto");
  // surrounding whitespace is trimmed, not treated as a distinct id
  assert.equal(resolveModelId("  zen5-pro  "), "zen5-pro");
  assert.equal(resolveModelId("  gpt-4-turbo "), DEFAULT_MODEL);
});

/**
 * The gateway serves the SAME family under a bare id and a provider-prefixed one
 * (`gpt-3.5-turbo` and `openai/gpt-3.5-turbo`). The guard anchored at the start
 * of the string, so a prefix carried every dead family straight past it and into
 * the picker, where the gateway answers 502 and the builder reports the AI
 * service as unavailable.
 */
test("a provider prefix does not smuggle a dead family past the guard", () => {
  for (const id of [
    "openai/gpt-3.5-turbo",
    "openai/gpt-3.5-turbo-16k",
    "openai/gpt-4-turbo",
    "openai/gpt-4-turbo-preview",
    "openai/o1-preview",
    "openai/text-davinci-003",
  ]) {
    assert.equal(isDeadModelId(id), true, `${id} should be dead`);
  }
});

/**
 * `:batch` is the Batch API route, not a chat route: it takes no streaming
 * completion, and the gateway answers 502 for every one. Measured against
 * production, all 49 of the `:batch` ids the picker offered failed this way.
 */
test("a :batch route is never a chat model", () => {
  for (const id of [
    "anthropic/claude-opus-4.8:batch",
    "anthropic/claude-sonnet-4.6:batch",
    "anthropic/claude-haiku-4.5:batch",
  ]) {
    assert.equal(isDeadModelId(id), true, `${id} should be dead`);
  }
});

/** A prefix must not make a LIVE id look dead either. */
test("provider-prefixed live ids still pass", () => {
  for (const id of [
    "openai/gpt-4o",
    "openai/gpt-5.2",
    "openai/gpt-5.1-codex",
    "anthropic/claude-opus-4.8",
    "anthropic/claude-sonnet-4.6",
  ]) {
    assert.equal(isDeadModelId(id), false, `${id} should be servable`);
  }
});
