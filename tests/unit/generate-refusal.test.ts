/**
 * @jest-environment node
 */
import assert from "node:assert/strict";

/**
 * /v1/generate, the builder's inference BFF, against a refusing gateway.
 *
 * gateway-refusal.test.ts pins the translation; this pins the WIRING — that the
 * route actually calls it, with a session in hand, and that what reaches the
 * builder is the gateway's own sentence rather than the generic it used to be
 * replaced with. The route previously read the upstream body into a `detail`
 * local and then returned `unauthorized()`, discarding it.
 *
 * A real IAM session (JWKS-verified) is the precondition that makes the
 * distinction meaningful, so it is mocked as present: this is the case where
 * the user IS signed in and the gateway still says no.
 */

jest.mock("@/lib/iam", () => ({
  session: async () => ({ token: "a-verified-iam-token", sub: "u_1", owner: "hanzo" }),
}));
jest.mock("@/lib/org/csrf", () => ({ requireSameOrigin: () => undefined }));

import { NextRequest } from "next/server";

import { POST } from "@/app/v1/generate/route";
import { UNAVAILABLE } from "@/lib/gateway";

// Verbatim from api.hanzo.ai for a key that was revoked or replaced.
const REVOKED = JSON.stringify({
  status: "error",
  msg: "API key validation failed: API key hk-902abd… is not recognized — it was revoked or replaced. Mint a new one at https://cloud.hanzo.ai/keys",
  data: null,
  data2: null,
});

/** Make the gateway answer `status` with `body`, and run one build request. */
async function build(status: number, body: string) {
  global.fetch = jest.fn(async () =>
    new Response(body, { status, headers: { "content-type": "application/json" } })
  ) as unknown as typeof fetch;

  const res = await POST(
    new NextRequest("https://hanzo.app/v1/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "build me a landing page" }),
      headers: { "content-type": "application/json" },
    })
  );
  return { status: res.status, body: await res.json() };
}

test("a revoked key reaches the builder as the revoked key, not an outage", async () => {
  const { status, body } = await build(401, REVOKED);

  assert.equal(status, 401);
  assert.match(body.message, /revoked or replaced/);
  assert.match(body.message, /hk-902abd/);
  assert.match(body.message, /https:\/\/cloud\.hanzo\.ai\/keys/);

  // The three ways the old behaviour lied, each pinned:
  assert.notEqual(body.message, UNAVAILABLE); // the service is healthy
  assert.doesNotMatch(body.message, /try again/i); // waiting fixes nothing
  assert.equal(body.openLogin, undefined); // signing in again fixes nothing
});

test("403 is permission, and says so under its own status", async () => {
  const { status, body } = await build(
    403,
    JSON.stringify({ status: "error", msg: "model enso-ultra is not enabled for this org" })
  );

  assert.equal(status, 403);
  assert.match(body.message, /not enabled for this org/);
  assert.doesNotMatch(body.message, /try again/i);
});

test("402 still raises the credit modal", async () => {
  const { status, body } = await build(402, JSON.stringify({ msg: "balance exhausted" }));
  assert.equal(status, 402);
  assert.equal(body.needCredits, true);
});

test("a real outage is the one case that says try again", async () => {
  for (const s of [500, 502, 503]) {
    const { status, body } = await build(s, "<html>Bad Gateway</html>");
    assert.equal(status, 502);
    assert.equal(body.message, UNAVAILABLE);
  }
});
