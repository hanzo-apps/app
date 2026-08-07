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
import type { Sandbox } from "./sandbox";

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
function providerArgs(): string[] {
  return [
    "-c", `model_providers.hanzocode.name="Hanzo Code"`,
    "-c", `model_providers.hanzocode.base_url="${HANZO_BASE}/v1"`,
    "-c", `model_providers.hanzocode.wire_api="responses"`,
    "-c", `model_providers.hanzocode.env_key="HANZO_API_KEY"`,
    "-c", `model_provider="hanzocode"`,
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
  /** Paths this run wrote, as the sandbox's own git reports them. */
  changed: string[];
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
 * That matters beyond a display: the `done` event's file list is what the
 * browser hands to `commitTurn`, and `commitTurn` is what writes the revision to
 * git.hanzo.ai. An empty list is a turn that silently records no history — the
 * project's version panel stays empty while the work is real and on disk.
 *
 * So the question goes to the thing that actually watched: the checkout. Tracked
 * modifications and untracked additions both count, because a new file is as
 * much of the turn as an edited one. A directory that is not a repo answers
 * empty, honestly — there is nothing to commit from and nothing to claim.
 */
async function changedInSandbox(box: Sandbox, cwd: string): Promise<string[]> {
  const script = [
    `cd ${JSON.stringify(cwd)} 2>/dev/null || cd .`,
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
 */
export async function runHarness(
  box: Sandbox,
  opts: { task: string; token: string; model?: string; cwd?: string; timeoutSec?: number },
  emit: (e: AgentEvent) => void | Promise<void>,
): Promise<HarnessResult> {
  const cwd = opts.cwd || ".";
  const model = opts.model ? ["-c", `model="${opts.model}"`] : [];
  const args = ["exec", "--json", "--skip-git-repo-check", ...providerArgs(), ...model].join(" ");

  // The prompt reaches dev on stdin via a quoted heredoc — no expansion, no
  // escaping rules for the caller to get wrong, and nothing of the task visible
  // in the process table.
  const script = [
    `cd ${JSON.stringify(cwd)} 2>/dev/null || cd .`,
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

  return {
    lastMessage: last,
    exitCode: r.exitCode ?? 0,
    changed: await changedInSandbox(box, cwd),
  };
}
