"use client";

import { startAgentRun } from "@/lib/agent/client";
import type { AgentEvent, AgentFile } from "@/lib/agent/types";
import { watchRuns } from "@/lib/agent/watch";
import type { Runtime } from "@/lib/agent/sandbox";
import { currentProject } from "@/lib/dev/workspace";
import { beginRun, endRun, push, pushBlock } from "@/components/editor/console/log";

/**
 * Code mode — the agent editing the project's real checkout.
 *
 * WHY THIS IS NOT BUILD MODE. Build generates a page: one shot, no tools, the
 * result lands in the browser's working copy. Code runs a bounded reason→act
 * loop in a sandbox: it lists and reads files, patches them, and RUNS THINGS —
 * installs, builds, tests. Those are different acts with different costs and
 * different failure modes, so they are different values of the one mode control
 * rather than a flag on a single verb that would let someone pick the expensive
 * one by accident.
 *
 * WHAT THE PROJECT IS. `currentProject` — the one answer, shared with the
 * per-turn git commit and the version history: the saved project's slug when
 * there is one, else a per-browser minted `site-xxxx` stable for the life of the
 * workspace. It is deliberately not a constant and not a nickname: two people
 * building must never land in one sandbox, and the same person returning must
 * land back in theirs.
 */

export interface CodeTurnResult {
  /** False when this run's edits were NOT saved anywhere. */
  durable: boolean;
  /** The sandbox it ran in, to reuse on the next turn. */
  sandbox?: string;
  /** Why it was not durable — a sentence for the person, not a code. */
  reason?: string;
  /** The model's closing summary, or the error that ended the run. */
  text: string;
  /** Project-relative paths the run wrote — for display. On a durable run the
   *  record of what happened is the commit the pod pushed, not this list. */
  changed: string[];
  /**
   * The files, for the workspace to take up — and ONLY ever on a run that had
   * nowhere else to put them.
   *
   * A durable run commits its own work to git.hanzo.ai from the sandbox, so this
   * arrives empty and must: the alternative is the browser rebuilding a checkout
   * it cannot see into an HTML page set it can, which is how `.tsx` ended up
   * committed as a page.
   */
  files: AgentFile[];
  ok: boolean;
}

/**
 * How a step reads: red when it ended badly, plain otherwise.
 *
 * The sandbox says how a command finished in one line — `exit 0`, `exit 1`, or
 * `ended: <why>` when it was stopped or the sandbox stopped answering. Only the
 * first of those is success, and a build that failed should not have to be
 * spotted by reading the number.
 */
function ended(step: string, message: string): "info" | "error" {
  if (step !== "exit") return "info";
  return message.trim() === "exit 0" ? "info" : "error";
}

/** Trim a tool's raw JSON arguments down to the command it is running. */
function commandOf(rawArgs: string): string {
  try {
    const parsed = JSON.parse(rawArgs) as { command?: unknown };
    return typeof parsed.command === "string" ? parsed.command : "";
  } catch {
    return "";
  }
}

/**
 * Run one Code turn, pouring the agent's tool use into the builder console as it
 * happens and returning what the thread needs to settle its bubble.
 *
 * The console is where a command's output belongs — it is a terminal, and this
 * is the first thing in the product that has ever put a real shell's output in
 * front of a person. Every `run_command` shows up the moment the model issues
 * it, and its exit code and output the moment it returns.
 */
export async function codeTurn(args: {
  prompt: string;
  model?: string;
  /** Reuse the sandbox a previous turn opened. */
  sandbox?: string;
  /** The isolation boundary to ask cloud for. Empty takes the fleet's own. */
  runtime?: Runtime;
  files?: AgentFile[];
  signal?: AbortSignal;
  /** Streamed assistant prose. */
  onText: (chunk: string) => void;
  /** One human-readable line per step, for the thread's activity list. */
  onActivity: (label: string) => void;
  /** Where this run edits — fires once, before any work. */
  onWhere: (where: {
    durable: boolean;
    sandbox?: string;
    /** The runtime it GOT. Not the one asked for — those can differ. */
    runtime?: string;
    reason?: string;
  }) => void;
}): Promise<CodeTurnResult> {
  const project = currentProject();
  const out: CodeTurnResult = { durable: false, text: "", changed: [], files: [], ok: false };
  /** Command per tool-call id, so a result can name what produced it. */
  const running = new Map<string, string>();
  /** Ends the live feed when the run does. */
  const stopWatching = new AbortController();
  /**
   * Whether the sandbox's own narration is reaching the console.
   *
   * It decides ONE thing: who prints a command's output. When a session opened,
   * the lines arrive AS THE COMMAND RUNS and printing the buffered result
   * afterwards would print all of it a second time. When it did not — an
   * unreachable registry — the buffered result is the only copy there is, and
   * dropping it would trade a silent pause for silence.
   */
  let live = false;

  const on = (event: AgentEvent) => {
    switch (event.type) {
      case "sandbox": {
        out.durable = event.durable;
        // Only a sandbox that PROVED it can be written to is worth going back
        // to. Remembering one that could not would make every later turn reuse
        // the same dead pod.
        out.sandbox = event.durable ? event.id : undefined;
        out.reason = event.reason;
        if (event.durable) {
          // The RUNTIME is named here, and it is the granted one. A run whose
          // isolation boundary is not in its own log is a measurement nobody can
          // check afterwards — and the slug, not a friendly name, because this is
          // a terminal and somebody is going to grep it.
          push(
            "sandbox",
            "info",
            `connected to sandbox ${event.id} (${event.project}) on ${event.runtime || "the fleet runtime"}`,
          );
        } else {
          // LOUD. This is the case that used to be invisible: the run proceeds,
          // looks perfect, and saves nothing. A refused runtime arrives here too,
          // carrying cloud's own sentence about why it could not be had.
          push("sandbox", "error", event.reason ?? "not durable — this run edits memory only");
        }
        // The dock's Stop acts on the sandbox, so it can only be offered once
        // there is one to act on — which is here, the first frame of every run.
        beginRun({ sandbox: event.id, session: event.session });
        if (event.session) {
          live = true;
          void watchRuns({
            root: event.session,
            signal: stopWatching.signal,
            onLine: (_, said) => {
              // A step is a phase of the run — leased, clone, the tool's name,
              // exit. Output is everything else and is most of the volume, so it
              // is written as the block of lines it is rather than one entry.
              //
              // `exit 0` is the only ending that is not a failure: a non-zero
              // code and an `ended: …` (the command was stopped, or the sandbox
              // stopped answering) both belong in red.
              if (said.step) push("sandbox", ended(said.step, said.message), said.message || said.step);
              else pushBlock("sandbox", "log", said.message);
            },
          }).catch(() => {
            // Watching is how a run is READ, never how it is run. A feed that
            // cannot be opened costs the live view; the buffered result below
            // then remains the copy that gets printed.
            live = false;
          });
        }
        args.onWhere({
          durable: event.durable,
          sandbox: event.id,
          runtime: event.runtime,
          reason: event.reason,
        });
        break;
      }
      case "text":
        out.text += event.text;
        args.onText(event.text);
        break;
      case "tool_call": {
        if (event.name === "run_command") {
          const command = commandOf(event.arguments);
          running.set(event.id, command);
          push("sandbox", "info", command || "(command)");
          args.onActivity(command ? `Running ${command}` : "Running a command");
        } else {
          args.onActivity(event.name.replace(/_/g, " "));
        }
        break;
      }
      case "tool_result": {
        const command = running.get(event.id);
        if (command !== undefined) {
          running.delete(event.id);
          // ONLY when nothing was watching. With a session open the console has
          // already shown every one of these bytes, live, and printing the
          // buffered copy here would double the whole build log.
          //
          // `Exit code N` is the first line of the tool's own result, so a
          // failed command reads as failed without a second interpretation of
          // the same bytes here.
          if (!live) {
            pushBlock("sandbox", event.result.startsWith("Exit code 0") ? "log" : "error", event.result);
          }
        }
        break;
      }
      case "done":
        out.changed = event.changed;
        out.files = event.files;
        out.ok = event.finishReason !== "error";
        break;
      case "error":
        out.text = event.message;
        out.ok = false;
        push("sandbox", "error", event.message);
        break;
      default:
        break;
    }
  };

  try {
    await startAgentRun(
      {
        prompt: args.prompt,
        // ALWAYS the project. The sandbox id is an optimization — reuse the warm
        // pod if it is still there — and it was sent INSTEAD of the project until
        // a second message proved that wrong: the route hangs its sandbox up when
        // a run ends, so the id from turn one is a 404 by turn two, and a turn
        // that had only the id fell back to memory for a project whose checkout
        // was still on disk. Naming both makes the id free to be stale.
        project,
        ...(args.sandbox ? { id: args.sandbox } : {}),
        ...(args.runtime ? { runtime: args.runtime } : {}),
        ...(args.model ? { model: args.model } : {}),
        ...(args.files?.length ? { files: args.files } : {}),
        ...(args.signal ? { signal: args.signal } : {}),
      },
      on,
    );
  } catch (e) {
    out.ok = false;
    out.text = e instanceof Error ? e.message : "The agent run could not be started.";
    push("sandbox", "error", out.text);
  } finally {
    // On every path. A feed left open outlives the run it was watching, and a
    // Stop button left on screen offers to interrupt a command that is over.
    stopWatching.abort();
    endRun();
  }
  return out;
}
