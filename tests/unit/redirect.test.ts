import assert from "node:assert/strict";
import {
  loginRedirectDestination,
  DEFAULT_DESTINATION,
} from "../../lib/auth/redirect.ts";

test("defaults to dashboard when no stored path", () => {
  assert.equal(loginRedirectDestination(null), DEFAULT_DESTINATION);
  assert.equal(loginRedirectDestination(undefined), DEFAULT_DESTINATION);
  assert.equal(loginRedirectDestination(""), DEFAULT_DESTINATION);
});

test("never bounces back into the auth flow", () => {
  for (const p of ["/", "/login", "/signup", "/auth/callback"]) {
    assert.equal(loginRedirectDestination(p), DEFAULT_DESTINATION);
  }
});

test("honors a real in-app destination", () => {
  assert.equal(loginRedirectDestination("/new"), "/new");
  assert.equal(loginRedirectDestination("/projects/abc"), "/projects/abc");
  assert.equal(loginRedirectDestination("/dashboard"), "/dashboard");
});

test("rejects non-path / external values", () => {
  assert.equal(loginRedirectDestination("https://evil.example"), DEFAULT_DESTINATION);
  assert.equal(loginRedirectDestination("new"), DEFAULT_DESTINATION);
});
