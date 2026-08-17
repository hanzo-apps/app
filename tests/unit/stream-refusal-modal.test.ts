/**
 * A refusal that arrives in the BODY still reaches the reader whole.
 *
 * `/v1/generate` sends its head before the gateway has answered, so a refusal
 * decided after that has no status line to travel under and arrives as the
 * envelope instead. `outcome` is the one place that reads it, and every field it
 * drops is a way forward the reader loses: `needCredits` is the credit modal,
 * and without it a funded org gets a flat sentence and no control to act on.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { UNAVAILABLE, outcome, refusal } from "@/lib/gateway";

describe("what a refusal envelope means to the builder", () => {
  it("raises the credit modal, carrying the gateway's own sentence", () => {
    // The whole envelope, exactly as the route writes it into the body.
    const { body } = refusal(402, JSON.stringify({ msg: "Monthly spend cap reached." }));
    assert.deepEqual(outcome(body), {
      error: "need_credits",
      message: "Monthly spend cap reached.",
    });
  });

  it("keeps a rejected credential out of the login loop", () => {
    // 401 is the credential behind the session, so signing in again changes
    // nothing and the envelope carries no `openLogin` to send the reader round.
    const { body } = refusal(401, JSON.stringify({ msg: "API key hk-902abd… was replaced." }));
    assert.equal(outcome(body).error, "api_error");
    assert.match(outcome(body).message!, /was replaced/);
  });

  it("sends a genuinely unauthenticated turn to sign in", () => {
    assert.deepEqual(outcome({ openLogin: true, message: "Sign in to build" }), {
      error: "login_required",
    });
  });

  it("quotes what the refusal said for everything else", () => {
    const { body } = refusal(403, JSON.stringify({ msg: "not enabled for this org" }));
    assert.deepEqual(outcome(body), {
      error: "api_error",
      message: "not enabled for this org",
    });
  });

  it("falls back to the honest generic only where nothing was stated", () => {
    // An unreadable body — an HTML error page from a proxy is the common one —
    // leaves nothing to quote, and a blank message is worse than the generic.
    assert.deepEqual(outcome({}), { error: "api_error", message: UNAVAILABLE });
    // Money keeps the gateway's own words or none: a sentence invented here is
    // what tells a funded account it is empty.
    assert.equal(outcome({ needCredits: true }).message, undefined);
  });
});

describe("every stream reads it the same way", () => {
  // Comment-stripped: the prose above a fix must not be able to satisfy the
  // check that guards it.
  const code = readFileSync(join(process.cwd(), "hooks/useCallAi.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("no stream hand-rolls its own ladder", () => {
    const handlers = [...code.matchAll(/jsonResponse && !jsonResponse\.ok\)\s*\{[\s\S]*?\n(\s*)\}/g)];
    assert.equal(handlers.length, 3, "three streams read an envelope");
    for (const [block] of handlers) {
      assert.match(block, /outcome\(jsonResponse\)/);
      assert.doesNotMatch(block, /error:\s*"/);
    }
  });

  it("the edit reads TEXT, because a beat sits in front of its JSON", () => {
    // Every turn answers on a stream now, and the whitespace that keeps a long
    // one open is not JSON. `request.json()` throws on it, and the throw lands
    // in the generic catch as a spinner that never clears.
    assert.doesNotMatch(code, /request\.json\(\)/);
    assert.match(code, /safeJsonParse\(\(await request\.text\(\)\)\.trim\(\)\)/);
  });
});
