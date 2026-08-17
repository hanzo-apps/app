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
 * A PROVIDER PREFIX IS NOT DECORATION — it is a different route, and the guard
 * must not strip it. Measured across all 422 models the picker offers:
 * `openai/o1`, `openai/o3`, `openai/gpt-4` and `openai/gpt-3.5-turbo-*` all
 * answer 200, while the bare ids this guard names do not. Reading the id after
 * its prefix therefore removes nine working models — the guard exists for a
 * stale BARE id persisted by an older build, which is what it already matches.
 */
test("a provider-prefixed legacy route is live, and the guard leaves it alone", () => {
  for (const id of [
    "openai/o1",
    "openai/o3",
    "openai/o3-mini",
    "openai/gpt-4",
    "openai/gpt-3.5-turbo-instruct",
  ]) {
    assert.equal(isDeadModelId(id), false, `${id} is served and must pass`);
  }
});

/**
 * `:batch` is not structurally dead either. 56 of the 61 `:batch` ids fail, and
 * five serve — `moonshotai/kimi-k2.7-code:batch`, `z-ai/glm-5.2:batch`,
 * `minimax/minimax-m3:batch`, `nvidia/nemotron-3-ultra-550b-a55b:batch` and
 * `thinkingmachines/inkling:batch`. A suffix cannot decide it, so the guard does
 * not try: which ids the gateway can reach is the gateway's to state.
 */
test("a :batch route is not dead by its suffix", () => {
  assert.equal(isDeadModelId("z-ai/glm-5.2:batch"), false);
  assert.equal(isDeadModelId("moonshotai/kimi-k2.7-code:batch"), false);
});
