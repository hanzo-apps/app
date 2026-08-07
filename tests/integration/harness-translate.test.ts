import { describe, expect, it } from "vitest";

import { translate } from "../../lib/agent/harness";

/**
 * These fixtures are REAL lines from `dev exec --json`, captured in a live
 * sandbox pod. A hand-written fixture would only prove the translator agrees
 * with my guess about someone else's stream.
 */
describe("translate", () => {
  it("carries the harness's own error rather than swallowing it", () => {
    // The failure a bare `dev` in the sandbox actually produced: pointed at a
    // vendor endpoint with no credential.
    const out = translate({
      msg: { type: "stream_error", message: "Authentication expired. Authentication required." },
    });
    expect(out).toEqual([
      { type: "error", message: "Authentication expired. Authentication required." },
    ]);
  });

  it("shows a shell command as a tool call, so a UI built for tools can read it", () => {
    expect(
      translate({ msg: { type: "exec_command_begin", call_id: "c1", command: ["bash", "-lc", "ls -la"] } }),
    ).toEqual([
      { type: "tool_call", id: "c1", name: "shell", arguments: JSON.stringify({ command: "bash -lc ls -la" }) },
    ]);
  });

  it("marks a non-zero exit as an error result, not a successful one", () => {
    const [e] = translate({
      msg: { type: "exec_command_end", call_id: "c1", aggregated_output: "no such file", exit_code: 2 },
    });
    expect(e).toMatchObject({ type: "tool_result", id: "c1", isError: true, result: "no such file" });
  });

  it("treats exit 0 as success", () => {
    const [e] = translate({
      msg: { type: "exec_command_end", call_id: "c2", aggregated_output: "ok", exit_code: 0 },
    });
    expect(e).toMatchObject({ isError: false });
  });

  it("relays MCP tool calls under their own names", () => {
    expect(
      translate({ msg: { type: "mcp_tool_call_begin", call_id: "m1", name: "mcp__hanzo__fs", arguments: '{"path":"a"}' } }),
    ).toEqual([{ type: "tool_call", id: "m1", name: "mcp__hanzo__fs", arguments: '{"path":"a"}' }]);
  });

  it("prefers a delta over a whole message, so streaming does not duplicate text", () => {
    expect(translate({ msg: { type: "agent_message_delta", delta: "he", message: "hello" } })).toEqual([
      { type: "text", text: "he" },
    ]);
  });

  it("says NOTHING for lifecycle frames", () => {
    // task_started is the third line of every run. An event per bookkeeping
    // frame fills a transcript with noise that reads as progress.
    expect(translate({ msg: { type: "task_started" } })).toEqual([]);
    expect(translate({ prompt: "say hi" })).toEqual([]);
    expect(translate({ provider: "hanzocode", model: "zen5" })).toEqual([]);
    expect(translate({})).toEqual([]);
  });

  it("says nothing for an empty text frame rather than emitting a blank line", () => {
    expect(translate({ msg: { type: "agent_message", message: "" } })).toEqual([]);
  });
});

/**
 * The changed-set parser, against REAL `git status --porcelain -uall` output
 * captured in a live sandbox pod. The shapes that matter are the two a
 * hand-written fixture would most likely get wrong: a rename, whose NEW name is
 * the file that now exists, and an untracked file inside a new directory, which
 * only appears at all because of `-uall`.
 *
 * This list is what the browser hands to commitTurn, so a path lost here is a
 * revision that never reaches git.hanzo.ai.
 */
import { parsePorcelain } from "../../lib/agent/harness";

describe("parsePorcelain", () => {
  it("reads the real output of a run that renamed and added a file", () => {
    const real = "RM tracked.txt -> renamed.txt\n?? newdir/added.txt";
    expect(parsePorcelain(real)).toEqual(["renamed.txt", "newdir/added.txt"]);
  });

  it("takes the NEW name of a rename — the old one no longer exists", () => {
    expect(parsePorcelain("R  a.txt -> b.txt")).toEqual(["b.txt"]);
  });

  it("reads ordinary modifications and additions", () => {
    expect(parsePorcelain(" M src/app.ts\nA  src/new.ts\n?? note.md")).toEqual([
      "src/app.ts",
      "src/new.ts",
      "note.md",
    ]);
  });

  it("is empty for a clean tree, and for a directory that is not a repo", () => {
    expect(parsePorcelain("")).toEqual([]);
    expect(parsePorcelain("\n  \n")).toEqual([]);
  });
});
