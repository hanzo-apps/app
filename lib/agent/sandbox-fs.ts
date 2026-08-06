/**
 * A `ProjectFs` backed by a real directory in a real box.
 *
 * The box is a pod running `boxd` (`hanzoai/cloud`, `cmd/boxd`); we never reach
 * it directly. Boxes have no public address, and terminating auth anywhere but
 * the IAM edge would be a second auth path, so every call goes through cloud:
 *
 *     hanzo.app  ──Bearer──▶  cloud /v1/sandbox/boxes/:id/fs/*
 *                             └─X-API-Key─▶  boxd /v1/box/fs/*
 *
 * We hold the user's IAM bearer and nothing else. The service key on the second
 * hop is cloud's, injected there, and never present in this process.
 *
 * The previous version of this file spoke to a Daytona-fork daemon (`/files`,
 * `/process/execute`) that was deleted with the fork — every route 404'd. The
 * contract it now speaks is `apps/sandbox/wire`, declared once in Go and
 * consumed by both boxd and cloud, so the shapes below are not a guess.
 *
 * Two things this deliberately does NOT do, both because the box already does
 * them and doing them twice means doing them differently:
 *
 *   filtering    `node_modules`, `.git`, `dist`, `target`… are dropped by boxd's
 *                own `skip` set before the listing crosses the network. A second
 *                regex here would be a second definition of "what an agent
 *                should not read", drifting from the first.
 *   path mapping the wire is project-relative by construction (`/src/App.tsx`).
 *                The box's workdir is the box's business; there is no prefix to
 *                strip and no `projectDir` to configure.
 *
 * What it DOES do here rather than on the box is apply patches: read, apply,
 * write. `wire.PatchNote` states the reason — what `update` means when `oldStr`
 * appears twice is ONE fact, it is defined in `patch.ts`, and
 * `tests/integration/sandbox-fs.test.ts` asserts both filesystems answer it
 * identically. A Go reimplementation across the network would be a second
 * definition that no test on either side can see disagreeing. One extra round
 * trip is the cheaper half of that trade.
 */

import type { AgentFile } from "./types";
import type {
  ExecResult,
  PatchOp,
  PatchResult,
  ProjectExec,
  ProjectFs,
  SearchMatch,
} from "./fs";
import { applyPatchOps, normalizePath } from "./patch";

/** `class` in the wire: what toolchain the box carries. */
export type BoxClass = "exec" | "dev" | "desktop";

/** A box, as `/v1/sandbox/boxes` reports it. */
export interface Box {
  id: string;
  org?: string;
  project?: string;
  class?: BoxClass;
  status?: "pending" | "running" | "suspended" | "error";
  image?: string;
  ref?: string;
  url?: string;
}

export interface SandboxFsOptions {
  /** Gateway base URL, e.g. `https://api.hanzo.ai/v1` — the same one the rest
   *  of the run already uses. */
  baseUrl: string;
  /** The box to edit in. */
  boxId: string;
  /** The caller's verified IAM bearer. There is no shared server key here. */
  token: string;
  /** Per-request timeout. A wedged box must not hang the agent turn. */
  timeoutMs?: number;
}

/**
 * Get a box for a project, creating one if there is none.
 *
 * Box lifetime is cloud's problem, not ours: it owns the warm pool, the
 * per-(org, project) volume, and the lease that suspends an idle box. This is
 * the whole client — one POST — and it is here rather than in a module of its
 * own because it is the one call that has to happen before a `SandboxProjectFs`
 * can exist, and holding it beside the filesystem keeps one file to read.
 *
 * Returns null when the sandbox service is unreachable or refuses, so a caller
 * can fall back to an in-memory project instead of failing the user's run.
 */
export async function openBox(opts: {
  baseUrl: string;
  token: string;
  project: string;
  boxClass?: BoxClass;
  ref?: string;
  timeoutMs?: number;
}): Promise<Box | null> {
  try {
    const res = await fetch(`${opts.baseUrl.replace(/\/+$/, "")}/sandbox/boxes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: opts.project,
        class: opts.boxClass ?? "dev",
        ...(opts.ref ? { ref: opts.ref } : {}),
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const box = (await res.json()) as Box;
    return box?.id ? box : null;
  } catch {
    return null;
  }
}

export class SandboxProjectFs implements ProjectFs, ProjectExec {
  private readonly changed = new Set<string>();
  private readonly timeoutMs: number;
  private readonly base: string;

  constructor(private readonly opts: SandboxFsOptions) {
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.base = `${opts.baseUrl.replace(/\/+$/, "")}/sandbox/boxes/${encodeURIComponent(opts.boxId)}`;
  }

  /** The box this filesystem edits — the id a caller shows or reuses. */
  get boxId(): string {
    return this.opts.boxId;
  }

  private async call(
    method: "GET" | "POST" | "DELETE",
    path: string,
    init: { query?: Record<string, string>; body?: unknown; timeoutMs?: number } = {}
  ): Promise<Response> {
    const url = new URL(`${this.base}${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.opts.token}`,
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";

    // A box can wedge; an agent turn that never returns is worse than one that
    // reports a failed tool call and lets the model try something else.
    return fetch(url, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? this.timeoutMs),
      cache: "no-store",
    });
  }

  /**
   * Run a command in the project directory.
   *
   * This is the capability a box has and a map does not, and it is why
   * `ProjectExec` is a separate interface: `build`, `test` and `git` are the
   * reason to pay for a box at all, and an in-memory project cannot pretend to
   * offer them. A non-zero `exitCode` is a SUCCESSFUL call carrying a failed
   * program — the same distinction `wire.ExecResult` draws, kept here so the
   * model can tell "your tests failed" from "the box is broken".
   */
  async exec(command: string, timeoutSec = 120): Promise<ExecResult> {
    // Give the HTTP call the box's own deadline plus a margin, so a command
    // that legitimately runs for two minutes is not cut off by a 20s default.
    const res = await this.call("POST", "/proc/exec", {
      body: { command, timeoutSec },
      timeoutMs: (timeoutSec + 10) * 1000,
    });
    if (!res.ok) {
      return { exitCode: -1, stdout: "", stderr: `box returned ${res.status}`, timedOut: false };
    }
    const out = (await res.json()) as ExecResult;
    return {
      exitCode: out.exitCode ?? 0,
      stdout: out.stdout ?? "",
      stderr: out.stderr ?? "",
      timedOut: out.timedOut ?? false,
      durationMs: out.durationMs,
    };
  }

  async list(): Promise<string[]> {
    const res = await this.call("GET", "/fs/list");
    if (!res.ok) return [];
    const body = (await res.json()) as { entries?: Array<{ path?: string; isDir?: boolean }> };
    return (body.entries ?? [])
      .filter((e) => !e.isDir && e.path)
      .map((e) => e.path as string)
      .sort();
  }

  /**
   * A read that throws the bytes away. There is no `HEAD` and no `stat` on the
   * wire on purpose: boxd answers a missing file with 404 specifically so that
   * "not there" has ONE representation, and inventing a second endpoint to ask
   * the same question more cheaply would be a second answer to maintain.
   */
  async exists(path: string): Promise<boolean> {
    const res = await this.call("GET", "/fs/read", { query: { path: normalizePath(path) } });
    await res.body?.cancel().catch(() => {});
    return res.ok;
  }

  async read(path: string): Promise<string | null> {
    const res = await this.call("GET", "/fs/read", { query: { path: normalizePath(path) } });
    if (!res.ok) return null;
    return res.text();
  }

  async write(path: string, content: string): Promise<void> {
    const p = normalizePath(path);
    const res = await this.call("POST", "/fs/write", { body: { path: p, content } });
    if (!res.ok) {
      throw new Error(`write ${p} failed: box returned ${res.status}`);
    }
    this.changed.add(p);
  }

  /**
   * Grep the checkout. The one operation where a box is not merely equivalent
   * to an in-process map but categorically better: the tree is searched where
   * it lives and only the hits cross the network. Substring, not regex, on both
   * sides — a model should not be able to wedge its own box with `(a+)+$`.
   */
  async search(query: string, limit = 50): Promise<SearchMatch[]> {
    if (!query) return [];
    const res = await this.call("GET", "/fs/search", { query: { q: query, limit: String(limit) } });
    if (!res.ok) return [];
    const body = (await res.json()) as { matches?: SearchMatch[] };
    return (body.matches ?? []).slice(0, limit);
  }

  async applyPatch(path: string, ops: PatchOp[]): Promise<PatchResult> {
    const p = normalizePath(path);
    const current = (await this.read(p)) ?? "";
    const { content, result } = applyPatchOps(p, current, ops);
    if (result.applied) await this.write(p, content);
    return result;
  }

  async changedPaths(): Promise<string[]> {
    return [...this.changed].sort();
  }

  /**
   * Only what this run wrote. The tree on a real checkout is thousands of files
   * the caller already has; the delta is both the affordable answer and the
   * honest one.
   */
  async changedFiles(): Promise<AgentFile[]> {
    const paths = [...this.changed].sort();
    const files: AgentFile[] = [];
    for (const path of paths) {
      files.push({ path, content: (await this.read(path)) ?? "" });
    }
    return files;
  }
}
