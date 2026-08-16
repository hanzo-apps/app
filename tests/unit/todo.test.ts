/**
 * The work-item client's pure half — the three functions that decide what a
 * value MEANS, with no network under them.
 *
 * Each one exists because the todo board and this app speak slightly
 * different dialects, and every mistranslation here is silent: a board that
 * resolves to nothing renders as "no board yet" over a board full of work, and a
 * proposed key outside cloud's `^[A-Z][A-Z0-9]{1,7}$` is a create that always
 * 400s. So the rules are pinned rather than trusted.
 */
import {
  boardFor,
  proposeKey,
  refSession,
  sessionRef,
  type Board,
} from "@/lib/api/todo";

/** Cloud's key validator, verbatim from apps/todo/todo.go. */
const KEY_RE = /^[A-Z][A-Z0-9]{1,7}$/;

const board = (key: string, name: string): Board => ({
  id: `id_${key}`,
  org: "acme",
  key,
  name,
  createdAt: 0,
  updatedAt: 0,
});

describe("the agent link", () => {
  it("round-trips a session id through extRef", () => {
    expect(refSession(sessionRef("sess_123"))).toBe("sess_123");
  });

  it("reads nothing out of an extRef that anchors elsewhere", () => {
    // extRef is shared with the git binding — a PR branch lives here too, and
    // reading it as a session id would render a bogus agent chip on every PR.
    expect(refSession("feat/tracker-board")).toBeNull();
    expect(refSession(undefined)).toBeNull();
    expect(refSession("")).toBeNull();
    expect(refSession("session:")).toBeNull();
  });
});

describe("resolving a board from a URL handle", () => {
  const boards = [board("ENG", "platform"), board("MYSITE", "my-site")];

  it("matches a key, case-insensitively", () => {
    expect(boardFor(boards, "ENG")?.key).toBe("ENG");
    expect(boardFor(boards, "eng")?.key).toBe("ENG");
  });

  it("matches a project slug by name", () => {
    expect(boardFor(boards, "my-site")?.key).toBe("MYSITE");
  });

  it("prefers a key over a name, so one handle never means two boards", () => {
    const ambiguous = [board("ENG", "other"), board("OTHER", "ENG")];
    expect(boardFor(ambiguous, "ENG")?.key).toBe("ENG");
  });

  it("answers null rather than guessing", () => {
    expect(boardFor(boards, "nothing-like-this")).toBeNull();
    expect(boardFor(boards, "")).toBeNull();
    expect(boardFor([], "ENG")).toBeNull();
  });
});

describe("proposing a board key", () => {
  it("takes the leading alphanumerics, uppercased, capped at four", () => {
    expect(proposeKey("platform")).toBe("PLAT");
    expect(proposeKey("my-site")).toBe("MYSI");
    expect(proposeKey("Engineering")).toBe("ENGI");
  });

  it("falls back when a name cannot start a key", () => {
    // Cloud's own fallback: empty, or leading with a digit, becomes PRJ.
    expect(proposeKey("")).toBe("PRJ");
    expect(proposeKey("---")).toBe("PRJ");
    expect(proposeKey("2fa")).toBe("PRJ");
  });

  it("never proposes a key cloud would refuse", () => {
    // The one-character case is the trap: "a" derives "A", which is a legal
    // START but fails keyRE's {1,7} tail, so cloud 400s a create the user was
    // told would work. Widen it here, at the proposal, not after the refusal.
    for (const name of ["a", "x", "", "9", "my-site", "platform", "a-b", "Z2"]) {
      expect(proposeKey(name)).toMatch(KEY_RE);
    }
  });
});
