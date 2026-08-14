/**
 * D4 — the run is driven by the Hanzo Dev harness, inside the sandbox.
 *
 * `loop.ts` is a reason→act loop we wrote: it streams a completion, executes the
 * tool calls itself against the project filesystem, and loops. It works, and it
 * is a second coding agent. This module is the other half of the plan that file
 * already names — "D4 replaces the body of this function with a relay of
 * hanzo/dev app-server events; the `AgentEvent` contract holds" — and the reason
 * the contract was written as an event union in the first place.
 *
 * So the agent that codes on hanzo.app is the SAME agent that codes in a
 * terminal. Not a port of it, not a second implementation kept in step by
 * discipline: the actual binary, `dev`, running in the sandbox that holds the
 * project, with this module doing nothing but carrying its events out.
 *
 * ── WHAT IS ACTUALLY THERE, measured in a live pod (blue-ms-e2) ───────────────
 *
 *   dev          /usr/local/bin/dev   hanzo dev 0.6.91
 *   dev exec --json                    emits JSONL, one object per line
 *   node v24.19.0 · npm 11.17.0 · git 2.53.0
 *
 * The first frames of a real run, verbatim:
 *
 *   {"workdir":"/tmp/d4","sandbox":"read-only","approval":"never",
 *    "provider":"hanzocode","model":"…"}
 *   {"prompt":"say hi"}
 *   {"id":"1","event_seq":0,"msg":{"type":"task_started"}}
 *
 * ── IT MUST BE POINTED AT OUR OWN STACK, AND IT IS NOT BY DEFAULT ─────────────
 *
 * Run bare in the sandbox, `dev` reports `"provider":"openai"` and a
 * `gpt-5.3-codex` model, then fails with "Authentication expired". That is our
 * own coding agent quietly asking a competitor's endpoint on our infrastructure.
 * The `-c` overrides below are the same ones hanzoai/cli builds for exactly this
 * (src/commands/code/dev.rs) — one way to point dev at Hanzo, shared by the
 * terminal and by this — and they are PROVEN here: the same run then reports
 * `"provider":"hanzocode"`.
 *
 * OPENAI_* is cleared for the child for the reason dev.rs states: a stray
 * variable in the environment must not be able to silently drive it somewhere
 * else.
 */

import type { AgentEvent } from "./types";
import type { ProjectExec } from "./fs";
import { land, type Repo } from "./checkout";
import { quote } from "@/lib/shell";

/** The gateway `dev` talks to. Its own `/v1`, never a vendor's. */
const HANZO_BASE = (process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai").replace(/\/+$/, "");

/**
 * The provider block, as `-c` overrides.
 *
 * `wire_api = "responses"` because that is the protocol dev speaks and our
 * gateway serves; `env_key` names the variable dev reads the credential from,
 * which is how the caller's own token reaches the model without ever being
 * written to disk or into a command line.
 *
 * THE CREDENTIAL IS A MACHINE'S, NOT A PERSON'S. `HANZO_USER_KEY` is the bearer
 * `hanzo auth login` fills in for a human at a terminal, and no service has one:
 * a run started here carries the caller's IAM token, forwarded by the route.
 * dev's Hanzo provider reads HANZO_API_KEY and HANZO_MACHINE_TOKEN ahead of the
 * human session for exactly this (hanzoai/dev, create_hanzo_provider), so the
 * variable set below is the machine one. Reading only the human variable is what
 * made a live pod answer "Authentication expired" to an authenticated caller.
 */
/**
 * MCP, attached the way hanzoai/cli attaches it (src/commands/code/dev.rs:105):
 * `-c mcp_servers.hanzo.*`, ADDITIVE. It adds a server to whatever the harness
 * already has rather than repointing its config home, so nothing a user
 * configured is touched.
 *
 * `hanzo-mcp` ships in the sandbox image (/usr/local/bin/hanzo-mcp, verified in
 * a live pod), so this needs no install and no network — the tools run in the
 * same pod as the checkout they operate on, which is the only place they could
 * usefully run.
 *
 * `--project-dir` scopes the filesystem tools to the project. Without it the
 * server's idea of "the project" is wherever it happened to start, and a tool
 * that edits the wrong tree is worse than one that is absent.
 */
/**
 * Every `-c` value crosses a SHELL on its way to dev, because the run is a
 * script handed to the sandbox rather than an argv array. So each one is
 * single-quoted here.
 *
 * Unquoted, the shell strips the inner double quotes and dev receives
 * `mcp_servers.hanzo.args=[--project-dir,.]` — a bare string where the config
 * declares a sequence, which is exactly the error the live e2e reported:
 * `invalid type: string "[--project-dir,.]", expected a sequence`.
 *
 * The same bite is quieter one line up: `name="Hanzo Code"` splits on its space
 * into two shell words, so the provider was being named `Hanzo` with a stray
 * `Code` argument behind it. One rule fixes both, which is why this is a
 * function and not five careful string literals.
 *
 * hanzoai/cli does not need any of this (src/commands/code/dev.rs) — it execs an
 * argv array with no shell in between. The difference is the transport, not the
 * config, so the values below stay identical to the ones it passes.
 */
const cfg = (assignment: string): string[] => ["-c", quote(assignment)];

function mcpArgs(cwd: string): string[] {
  return [
    ...cfg(`mcp_servers.hanzo.command="hanzo-mcp"`),
    ...cfg(`mcp_servers.hanzo.args=["--project-dir","${cwd}"]`),
  ];
}

function providerArgs(): string[] {
  return [
    ...cfg(`model_providers.hanzocode.name="Hanzo Code"`),
    ...cfg(`model_providers.hanzocode.base_url="${HANZO_BASE}/v1"`),
    ...cfg(`model_providers.hanzocode.wire_api="responses"`),
    ...cfg(`model_providers.hanzocode.env_key="HANZO_API_KEY"`),
    ...cfg(`model_provider="hanzocode"`),
  ];
}

/** The `dev exec` argv, assembled and shell-safe. Exported so a test can read it. */
export function devArgs(cwd: string, model?: string): string[] {
  return [
    "exec", "--json", "--skip-git-repo-check",
    ...providerArgs(),
    ...mcpArgs(cwd),
    ...cfg(`approval_policy="never"`),
    ...cfg(`sandbox_mode="workspace-write"`),
    ...(model ? cfg(`model="${model}"`) : []),
  ];
}

/** A line of `dev exec --json`. Every field is optional: this is someone else's stream. */
type DevLine = {
  prompt?: string;
  provider?: string;
  model?: string;
  msg?: {
    type?: string;
    message?: string;
    text?: string;
    delta?: string;
    call_id?: string;
    name?: string;
    arguments?: string;
    output?: string;
    command?: string[];
    aggregated_output?: string;
    exit_code?: number;
    last_agent_message?: string;
  };
};

/**
 * translate maps ONE harness line onto our event contract, or to nothing.
 *
 * Silence is a real answer here and most lines get it: the harness emits
 * lifecycle and bookkeeping frames that have no meaning to a browser watching a
 * run. Inventing an event for each would fill the transcript with noise that
 * looks like progress.
 */
export function translate(line: DevLine): AgentEvent[] {
  const m = line.msg;
  if (!m?.type) return [];

  switch (m.type) {
    case "agent_reasoning":
    case "agent_reasoning_delta":
      return textOf(m) ? [{ type: "reasoning", text: textOf(m) }] : [];

    case "agent_message":
    case "agent_message_delta":
      return textOf(m) ? [{ type: "text", text: textOf(m) }] : [];

    // A shell command IS a tool call, and showing it as one is what makes the
    // harness's work legible in a UI built for tool calls.
    case "exec_command_begin":
      return [{
        type: "tool_call",
        id: m.call_id || "exec",
        name: "shell",
        arguments: JSON.stringify({ command: (m.command || []).join(" ") }),
      }];

    case "exec_command_end":
      return [{
        type: "tool_result",
        id: m.call_id || "exec",
        name: "shell",
        result: (m.aggregated_output || "").slice(0, 4000),
        isError: (m.exit_code ?? 0) !== 0,
      }];

    case "mcp_tool_call_begin":
      return [{
        type: "tool_call",
        id: m.call_id || "mcp",
        name: m.name || "mcp",
        arguments: m.arguments || "{}",
      }];

    case "mcp_tool_call_end":
      return [{
        type: "tool_result",
        id: m.call_id || "mcp",
        name: m.name || "mcp",
        result: (m.output || "").slice(0, 4000),
        isError: false,
      }];

    // The harness's own failure, carried through rather than swallowed. A run
    // that dies upstream and reports nothing is the silent-success shape this
    // whole contract exists to prevent.
    case "error":
    case "stream_error":
      return [{ type: "error", message: m.message || "the harness reported an error" }];

    default:
      return [];
  }
}

function textOf(m: NonNullable<DevLine["msg"]>): string {
  return (m.delta ?? m.text ?? m.message ?? "").toString();
}

/** What a harness run produced, for the caller that has to finish the turn. */
export type HarnessResult = {
  /** The harness's own last word, when it had one. */
  lastMessage: string;
  /** Non-zero means the harness itself failed, not the task. */
  exitCode: number;
  /** Paths this run wrote, as the sandbox's own git reports them. FOR DISPLAY —
   *  the record of what happened is the commit, not this list. */
  changed: string[];
  /**
   * Why the turn did not reach git.hanzo.ai, when it did not.
   *
   * Absent means it is on the forge — or that nobody asked for it to be, which is
   * the scratch case and not a failure. A turn whose work is only on the volume
   * is exactly the state this module used to leave EVERY turn in, silently, so it
   * is the one thing worth saying out loud when it happens.
   */
  unpushed?: string;
};

/**
 * Read `git status --porcelain -uall` into the paths that exist now.
 *
 * Exported because it is the part worth testing without a pod: every line is
 * `XY <path>`, and a rename is `R  old -> new`, where the NEW name is the file
 * on disk. Taking the old one would name a path that is gone.
 */
export function parsePorcelain(out: string): string[] {
  return out
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const path = l.slice(2).trim();
      const arrow = path.indexOf(" -> ");
      return arrow >= 0 ? path.slice(arrow + 4).trim() : path;
    })
    .filter((p) => p.length > 0);
}

/**
 * What this run changed — asked of GIT IN THE SANDBOX, and it has to be.
 *
 * `Sandbox.changedPaths()` returns the set `Sandbox.write()` populated, which is
 * the right answer for the loop: the loop makes every edit through that client,
 * so the client saw them all. The harness does not. `dev` edits files inside the
 * pod with its own tools, and the client never learns a thing — so asking it
 * would report NOTHING CHANGED after a run that rewrote the project.
 *
 * This is now FOR DISPLAY, and asking it is still the pod's job. The record of
 * the turn is the commit `land` pushes a moment later; this list is what the
 * thread shows while it does. It is read BEFORE the commit for the obvious
 * reason — afterwards the tree is clean and the honest answer is "nothing".
 *
 * Tracked modifications and untracked additions both count, because a new file is
 * as much of the turn as an edited one. A directory that is not a repo answers
 * empty, honestly — there is nothing to enumerate and nothing to claim.
 */
async function changedInSandbox(box: ProjectExec, cwd: string): Promise<string[]> {
  const script = [
    `cd ${quote(cwd)} 2>/dev/null || cd .`,
    `git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0`,
    // -uall so a new directory lists its files rather than just itself; -z is
    // avoided because the porcelain path is parsed line-wise below.
    `git status --porcelain -uall`,
  ].join("\n");
  try {
    const r = await box.exec(script, 60);
    if (r.exitCode !== 0) return [];
    return parsePorcelain(r.stdout || "");
  } catch {
    // The sandbox went away between the run and the question. The turn still
    // happened; we simply cannot enumerate it, and saying "nothing changed"
    // would be a stronger claim than we can make.
    return [];
  }
}

/**
 * runHarness executes one task with `dev` inside `box` and relays its events.
 *
 * It shells out INSIDE the sandbox rather than running dev here, because the
 * project lives there: the harness has to see the files it is editing, and the
 * pod is the one place they exist.
 *
 * The token is passed as HANZO_API_KEY through the command's environment, and
 * the prompt through a heredoc, so neither is interpolated into a shell word
 * where a quote in a user's task could end the argument.
 *
 * AND IT ENDS WITH A COMMIT. Given a `repo`, the turn is added, committed and
 * pushed to git.hanzo.ai from inside the pod — by the thing that made the edits,
 * to the repo it was cloned from. It used to end with nothing: the pod was
 * released, the volume kept the files, and the only record anyone got was
 * whatever the browser could rebuild out of the `done` event. That is why the
 * file list below is now for display and the commit is the history.
 */
export async function runHarness(
  box: ProjectExec,
  opts: {
    task: string;
    token: string;
    model?: string;
    cwd?: string;
    timeoutSec?: number;
    /** The repo this pod is a working copy of. Absent ⇒ nowhere to push, which
     *  is the scratch case and not a failure. */
    repo?: Repo;
  },
  emit: (e: AgentEvent) => void | Promise<void>,
): Promise<HarnessResult> {
  const cwd = opts.cwd || ".";
  // Auto-approve, workspace-write: the same default hanzoai/cli documents. A
  // headless run that blocks for approval does not fail, it HANGS until it times
  // out, which reads as a slow model rather than a missing answer.
  const args = devArgs(cwd, opts.model).join(" ");

  // The prompt reaches dev on stdin via a quoted heredoc — no expansion, no
  // escaping rules for the caller to get wrong, and nothing of the task visible
  // in the process table.
  const script = [
    `cd ${quote(cwd)} 2>/dev/null || cd .`,
    `unset OPENAI_API_KEY OPENAI_BASE_URL`,
    `export HANZO_API_KEY=${JSON.stringify(opts.token)}`,
    `dev ${args} -- "$(cat <<'HANZO_TASK_EOF'`,
    opts.task,
    `HANZO_TASK_EOF`,
    `)"`,
  ].join("\n");

  const r = await box.exec(script, opts.timeoutSec ?? 900);

  let last = "";
  for (const raw of (r.stdout || "").split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("{")) continue;
    let parsed: DevLine;
    try {
      parsed = JSON.parse(line) as DevLine;
    } catch {
      // A line that is not JSON is the harness writing to stdout for a human.
      // It is not an event and must not become one.
      continue;
    }
    if (parsed.msg?.last_agent_message) last = parsed.msg.last_agent_message;
    for (const e of translate(parsed)) await emit(e);
  }

  // stderr carries the harness's own diagnostics. It is surfaced ONLY when the
  // run failed, because a healthy run also writes there and a UI that shows it
  // every time teaches people to ignore it.
  if (r.exitCode !== 0 && r.stderr?.trim()) {
    await emit({ type: "error", message: r.stderr.trim().slice(0, 600) });
  }

  const exitCode = r.exitCode ?? 0;
  // Before the commit: afterwards the tree is clean and this answers "nothing".
  const changed = await changedInSandbox(box, cwd);

  // A harness that fell over left a tree in whatever state it got to, and a
  // commit of a half-finished edit is a revision somebody has to work out how to
  // undo. The files stay on the volume, so the next turn resumes from them and
  // lands them once the work is actually finished.
  const unpushed =
    opts.repo && exitCode === 0 ? await land(box, opts.repo, cwd, opts.task) : "";

  return {
    lastMessage: last,
    exitCode,
    changed,
    ...(unpushed ? { unpushed } : {}),
  };
}
