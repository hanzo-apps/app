/**
 * Code mode's wiring — the tests that go red when the silent bug comes back.
 *
 * THE BUG. `/v1/agents/runs` has spoken sandboxes since the day it was written:
 * name a `project` and the agent edits a real checkout on a real pod. Nothing in
 * the UI ever named one. `runAgent` falls back to an in-memory map when it is
 * handed no filesystem, SILENTLY, so every run a person actually started looked
 * perfect and edited nothing that survived the request. It hid for weeks because
 * every other observable — the tool calls, the changed-file list, the done event,
 * the happy bubble — is identical either way.
 *
 * So these assertions are chosen for one property: they fail if the caller stops
 * naming a project, and they fail if a run that saves nothing is allowed to look
 * like one that saves. A test that merely watched the bubble could not do either.
 *
 * `startAgentRun` is mocked and not the network: what is under test is the
 * DECISION — what this module puts in the request and what it does with the
 * answer — and a fetch mock would only re-assert the shape of a stub.
 */

import { codeTurn } from "@/components/editor/ask-ai/code-turn";
import type { AgentEvent } from "@/lib/agent/types";
import type { StartRunOptions } from "@/lib/agent/client";

jest.mock("@/lib/agent/client", () => ({ startAgentRun: jest.fn() }));
const { startAgentRun } = jest.requireMock("@/lib/agent/client") as {
  startAgentRun: jest.Mock;
};

/** Feed a scripted stream to whatever `codeTurn` handed the client. */
const stream = (...events: AgentEvent[]) => {
  startAgentRun.mockImplementation(
    async (_opts: StartRunOptions, on: (e: AgentEvent) => void) => {
      for (const e of events) on(e);
    },
  );
};

const sent = (): StartRunOptions => startAgentRun.mock.calls[0][0] as StartRunOptions;

/** The sinks a caller supplies, collected. */
const sinks = () => {
  const where: Array<{ durable: boolean; sandbox?: string; reason?: string }> = [];
  const activity: string[] = [];
  let text = "";
  return {
    where,
    activity,
    get text() {
      return text;
    },
    onWhere: (w: { durable: boolean; sandbox?: string; reason?: string }) => where.push(w),
    onActivity: (l: string) => activity.push(l),
    onText: (t: string) => {
      text += t;
    },
  };
};

const DONE: AgentEvent = { type: "done", finishReason: "stop", turns: 1, files: [], changed: [] };

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  delete (window as { __projectSlug?: string }).__projectSlug;
});

describe("a run names the project it edits", () => {
  it("sends the OPEN PROJECT as `project` — the thing nothing did", async () => {
    (window as { __projectSlug?: string }).__projectSlug = "luxquest";
    stream(DONE);

    await codeTurn({ prompt: "add a footer", ...sinks() });

    expect(sent().project).toBe("luxquest");
  });

  it("mints a per-workspace id when the project is unsaved, never a shared constant", async () => {
    stream(DONE);
    await codeTurn({ prompt: "x", ...sinks() });
    const first = sent().project;

    // Two unsaved workspaces sharing one name would edit each other's checkout.
    expect(first).toMatch(/^site-[a-z0-9]+$/);
    expect(first).not.toBe("untitled-site");
  });

  it("reuses the sandbox a previous turn opened INSTEAD of asking for a second pod", async () => {
    (window as { __projectSlug?: string }).__projectSlug = "luxquest";
    stream(DONE);

    await codeTurn({ prompt: "and a header", sandbox: "m_abc123", ...sinks() });

    expect(sent().id).toBe("m_abc123");
    // Both would be two claims on one RWO volume; `id` is the specific one.
    expect(sent().project).toBeUndefined();
  });
});

describe("a run that saves nothing SAYS SO", () => {
  it("reports not-durable, with the reason, when no sandbox was had", async () => {
    const s = sinks();
    stream(
      {
        type: "sandbox",
        durable: false,
        project: "luxquest",
        reason: "No sandbox for luxquest — the sandbox service did not give one out.",
      },
      DONE,
    );

    const result = await codeTurn({ prompt: "x", ...s });

    expect(result.durable).toBe(false);
    expect(result.reason).toMatch(/did not give one out/);
    expect(s.where[0]).toMatchObject({ durable: false });
  });

  it("does NOT remember a sandbox that could not be written to", async () => {
    stream(
      {
        type: "sandbox",
        durable: false,
        id: "m_broken",
        reason: "The sandbox opened but its project directory is not writable",
      },
      DONE,
    );

    // Remembering it would make every later turn reuse the same dead pod, and
    // the reason would only be told once.
    expect((await codeTurn({ prompt: "x", ...sinks() })).sandbox).toBeUndefined();
  });

  it("marks the whole answer, so the summary cannot read like a save", async () => {
    stream({ type: "sandbox", durable: false, reason: "No project named" }, DONE);
    const r = await codeTurn({ prompt: "x", ...sinks() });
    expect(r.durable).toBe(false);
  });

  it("a durable run says durable and hands back the sandbox to reuse", async () => {
    const s = sinks();
    stream({ type: "sandbox", durable: true, id: "m_live", project: "luxquest" }, DONE);

    const r = await codeTurn({ prompt: "x", ...s });

    expect(r.durable).toBe(true);
    expect(r.sandbox).toBe("m_live");
    expect(s.where[0]).toMatchObject({ durable: true, sandbox: "m_live" });
  });

  it("a run that could not START is an error the person sees, not a silent no-op", async () => {
    startAgentRun.mockRejectedValue(new Error("Agent run refused (402)"));
    const r = await codeTurn({ prompt: "x", ...sinks() });
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/402/);
  });
});

describe("the terminal", () => {
  it("puts the command in the console when the model issues it, before it returns", async () => {
    const { entries, clearLog } = jest.requireActual("@/components/editor/console/log") as {
      entries: unknown;
      clearLog: () => void;
    };
    void entries;
    clearLog();

    const s = sinks();
    stream(
      { type: "sandbox", durable: true, id: "m_live", project: "p" },
      { type: "tool_call", id: "t1", name: "run_command", arguments: '{"command":"pnpm test"}' },
      { type: "tool_result", id: "t1", name: "run_command", result: "Exit code 0\n12 passed", isError: false },
      DONE,
    );

    await codeTurn({ prompt: "run the tests", ...s });

    // The activity line names the command, which is what tells the person the
    // agent is doing something rather than thinking about it.
    expect(s.activity).toContain("Running pnpm test");
  });
});
