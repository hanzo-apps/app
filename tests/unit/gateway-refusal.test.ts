import assert from "node:assert/strict";

import { reason, refusal, UNAVAILABLE } from "../../lib/gateway";

/**
 * The gateway's refusal, translated once (lib/gateway.ts).
 *
 * The defect these pin: every 401 and 403 used to collapse into
 * `{ openLogin: true, message: "Sign in to build" }` and everything else into a
 * 502 the builder renders as "unavailable — try again in a minute", while the
 * reason the gateway actually stated was read into a local and dropped. A
 * revoked key therefore read as an outage, and the platform owner spent an
 * afternoon waiting for a healthy service to come back.
 *
 * The bodies below are VERBATIM from api.hanzo.ai — captured live, not invented.
 */

// The real body for a key that was revoked or replaced.
const REVOKED = JSON.stringify({
  status: "error",
  msg: "API key validation failed: API key hk-902abd… is not recognized — it was revoked or replaced. Mint a new one at https://cloud.hanzo.ai/keys",
  data: null,
  data2: null,
});

// The real body when no bearer reaches the gateway at all.
const MALFORMED = JSON.stringify({
  status: "error",
  msg: "Invalid API key format. Expected 'Bearer API_KEY'",
  data: null,
  data2: null,
});

test("a revoked key keeps its reason, its key prefix and its remedy", () => {
  const { body, status } = refusal(401, REVOKED);

  assert.equal(status, 401);
  assert.match(body.message, /revoked or replaced/);
  assert.match(body.message, /hk-902abd/);
  assert.match(body.message, /https:\/\/cloud\.hanzo\.ai\/keys/);
});

test("a 401 never tells the user to wait, and never reopens login", () => {
  for (const detail of [REVOKED, MALFORMED, "", "<html>502 Bad Gateway</html>"]) {
    const { body, status } = refusal(401, detail);

    assert.equal(status, 401, "a credential failure is not a 502");
    // The whole defect in one assertion: waiting cannot mint a key.
    assert.notEqual(body.message, UNAVAILABLE);
    assert.doesNotMatch(body.message, /try again/i);
    // A verified IAM session got the request this far, so a login loop is the
    // exact dead end that wasted the afternoon.
    assert.equal("openLogin" in body, false);
  }
});

test("a 401 with nothing stated still names the remedy", () => {
  const { body } = refusal(401, "");
  assert.match(body.message, /https:\/\/cloud\.hanzo\.ai\/keys/);
});

test("403 is permission — a separate status, and never retry advice", () => {
  const { body, status } = refusal(403, "");
  assert.equal(status, 403);
  assert.doesNotMatch(body.message, /try again/i);
  assert.doesNotMatch(body.message, /sign in/i);
});

test("402 keeps the structured credit signal the modal reads", () => {
  const { body, status } = refusal(402, "");
  assert.equal(status, 402);
  assert.equal(body.needCredits, true);
});

test("5xx is the ONLY case that promises retrying helps", () => {
  for (const s of [500, 502, 503, 504]) {
    const { body, status } = refusal(s, "");
    assert.equal(status, 502);
    assert.equal(body.message, UNAVAILABLE);
  }
});

test("a full key is redacted to a prefix, never printed whole", () => {
  const leak = JSON.stringify({
    msg: "rejected key hk-902abd7f3c1e55aa90b2d4 for org acme",
  });
  const { body } = refusal(401, leak);

  assert.match(body.message, /hk-902abd…/);
  assert.doesNotMatch(body.message, /hk-902abd7f3c1e55aa90b2d4/);
});

test("reason reads the shapes the upstreams actually send", () => {
  assert.equal(reason(JSON.stringify({ msg: "hanzo shape" })), "hanzo shape");
  assert.equal(
    reason(JSON.stringify({ error: { message: "openai shape" } })),
    "openai shape"
  );
  assert.equal(reason(JSON.stringify({ error: "bare string" })), "bare string");
  assert.equal(reason(JSON.stringify({ message: "plain" })), "plain");
});

test("an HTML error page states nothing, so it is not quoted at the user", () => {
  // Dumping markup into a toast is worse than the honest generic.
  for (const junk of ["", "<html><body>502</body></html>", "null", "[1,2]"]) {
    assert.equal(reason(junk), "");
  }
});

test("a runaway upstream message is capped, not truncated mid-escape", () => {
  const long = reason(JSON.stringify({ msg: "x".repeat(5000) }));
  assert.ok(long.length <= 301, `capped, got ${long.length}`);
  assert.ok(long.endsWith("…"));
});
