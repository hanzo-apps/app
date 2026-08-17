import assert from "node:assert/strict";

import { MAX_TOKENS, MIN_TOKENS, estimate, outputCap } from "../../lib/output-cap";

/**
 * A model's window holds its INPUT and its OUTPUT together, so an output ceiling
 * sized for the largest model refuses every smaller one before a byte is
 * generated. Measured live against the whole picker: the gateway answered
 * "maximum context length is 128000 tokens. However, you requested about 131205
 * (3205 of text input, 128000 in the output)" — half of every failing model, and
 * the builder reported it as the AI being unavailable.
 */

const msgs = (chars: number) => [
  { role: "system" as const, content: "x".repeat(chars) },
];

describe("the output ceiling is bounded by the model's window", () => {
  it("leaves the big windows exactly where they were", () => {
    // Enso and the Zen ladder state 1M, so the ceiling still decides.
    assert.equal(outputCap(1_000_000, msgs(10_000)), MAX_TOKENS);
  });

  it("asks a small-window model for less than the ceiling, which is what it refused", () => {
    const cap = outputCap(32_000, msgs(12_820)); // ~3205 tokens, the measured input
    assert.ok(cap < MAX_TOKENS, `${cap} must be under the ceiling`);
    assert.ok(cap + 3_205 < 32_000, "input + output must fit the window");
  });

  it("fits a build inside the window a 128k model states", () => {
    // The ask is sized to what a build produces, so the commonest window in the
    // catalog holds a whole one with the prompt still in it.
    assert.ok(outputCap(128_000, msgs(12_820)) + 3_205 < 128_000);
  });

  it("keeps a floor, so a tiny window refuses honestly rather than truncating", () => {
    assert.equal(outputCap(4_000, msgs(200_000)), MIN_TOKENS);
  });

  it("grows the reservation with the input, because pages travel in it", () => {
    // Inside a window the ceiling does not already decide.
    const small = outputCap(60_000, msgs(4_000));
    const large = outputCap(60_000, msgs(40_000));
    assert.ok(large < small, "a bigger prompt must leave less room for output");
  });

  it("keeps the ceiling when the catalog states no window", () => {
    // The gateway is then the one that knows, and it says so in its refusal.
    assert.equal(outputCap(undefined, msgs(10_000)), MAX_TOKENS);
  });

  it("a ceiling standing alone is still an ask a 128k model accepts", () => {
    // A catalog read that misses leaves the ceiling in charge, so the ceiling
    // itself has to fit the commonest window with a builder prompt beside it.
    const prompt = msgs(12_820);
    assert.ok(
      outputCap(undefined, prompt) + estimate(prompt) < 128_000,
      "the fallback ask must not exceed the window it will most often meet"
    );
  });
});
