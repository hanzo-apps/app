import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { reason, refusal, BUSY, UNAVAILABLE } from "../../lib/gateway";

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

/**
 * A 429 is the one refusal where waiting is the whole remedy, and it used to
 * share a sentence with 5xx. The 5xx sentence has to cover an unroutable model
 * — the gateway answers 502 for a model it lists but cannot reach — where
 * waiting never helps and switching model does. Two conditions, two sentences.
 */
test("a rate limit is a wait; a 5xx is not necessarily", () => {
  const busy = refusal(429, "");
  assert.equal(busy.status, 429);
  assert.equal(busy.body.message, BUSY);
  assert.notEqual(busy.body.message, UNAVAILABLE);
});

test("the 5xx sentence does not promise that a minute fixes it", () => {
  const { body } = refusal(502, "");
  assert.equal(body.message, UNAVAILABLE);
  assert.ok(!/try again in a minute/i.test(UNAVAILABLE), UNAVAILABLE);
});

/**
 * The gateway refuses a REQUEST with a 4xx, and it says which part it could not
 * take. Verbatim from api.hanzo.ai: the builder's system prompt shows a Leaflet
 * tile template, the vision path fetches every image URL it finds in the text,
 * and `{s}` is not a host — so the whole completion is refused, identically,
 * every time. Folding that into a 502 hid the sentence behind the client's
 * `status >= 500` branch and told the reader to wait for a request that will
 * never be accepted.
 */
const UNPARSEABLE = JSON.stringify({
  status: "error",
  msg: 'parse "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png": invalid character "{" in host name',
  data: null,
  data2: null,
});

test("a refused request keeps its status and its reason", () => {
  const { body, status } = refusal(400, UNPARSEABLE);

  assert.equal(status, 400, "a refused request is not an outage");
  assert.match(body.message, /invalid character/);
  assert.notEqual(body.message, UNAVAILABLE);
});

test("a 4xx with nothing stated still does not claim the model answered", () => {
  for (const s of [400, 404, 410, 422]) {
    assert.equal(refusal(s, "").status, s);
  }
});

/**
 * The write half is worth nothing if the last consumer substitutes a generic,
 * and that is where this class dies every time: `refusal` puts the gateway's
 * sentence in `message`, then the browser answers `message: UNAVAILABLE` and the
 * sentence is gone. Nothing else notices — the types are identical, the build is
 * green, and the screen says "try again shortly" about a request that will be
 * refused the same way forever. So the read is checked at the source.
 */
test("the browser quotes a refusal rather than replacing it", () => {
  const src = readFileSync(
    join(__dirname, "..", "..", "hooks", "useCallAi.ts"),
    "utf8"
  );
  const flat = [...src.matchAll(/error:\s*"api_error",\s*message:\s*([^\n}]+)/g)].map(
    (m) => m[1].trim()
  );

  assert.ok(flat.length >= 4, `expected the generate paths, found ${flat.length}`);
  for (const message of flat) {
    assert.match(
      message,
      /said\(|\.message/,
      `an api_error must read the response, got \`${message}\``
    );
  }
});
