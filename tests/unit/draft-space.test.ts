/**
 * Which project a fresh builder session stores its images under.
 *
 * An open project answers for itself. A fresh `/dev` session has no org/project
 * in its URL and no project prop at all, which is the case that used to be
 * refused outright — so it gets a key of its own, minted once and remembered,
 * and every upload in the session lands in the same place.
 */
import { space } from "@/lib/dev/draft";

jest.mock("@/lib/org-scope", () => ({ currentOrg: () => "maxpower" }));

beforeEach(() => window.localStorage.clear());

test("an open project is used as-is — no draft is invented for it", () => {
  expect(space("maxpower/landing")).toBe("maxpower/landing");
});

test("a fresh session gets a draft under the current org", () => {
  expect(space(undefined)).toMatch(/^maxpower\/draft-[0-9a-f]{12}$/);
});

test("the draft is minted once, so a session's images stay together", () => {
  const first = space(null);
  expect(space(null)).toBe(first);
  expect(space("")).toBe(first);
});

test("it survives a reload — the key is remembered, not regenerated", () => {
  const before = space(null);
  jest.resetModules();
  // A fresh module registry is what a reload looks like to this module.
  const { space: after } = require("@/lib/dev/draft") as typeof import("@/lib/dev/draft");
  expect(after(null)).toBe(before);
});

test("with no org there is genuinely nowhere to put them, and it says so", () => {
  jest.resetModules();
  jest.doMock("@/lib/org-scope", () => ({ currentOrg: () => "" }));
  const { space: unscoped } = require("@/lib/dev/draft") as typeof import("@/lib/dev/draft");
  expect(unscoped(null)).toBe("");
});
