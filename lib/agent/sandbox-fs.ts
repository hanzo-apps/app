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

/**
 * The box did not answer the question.
 *
 * This exists because "the file is not there" and "I could not find out" are
 * different facts, and the only safe place to collapse them is nowhere. A
 * filesystem that returns `null` for both makes `applyPatch` read a phantom
 * empty file and write the patch result over a file that was fine — a 500 on
 * read becomes data loss on disk. So exactly one status is data (404, which
 * boxd emits only for a genuinely missing path) and every other non-2xx raises.
 *
 * `runTool` catches this and reports a failed tool call, so a broken box costs
 * the model one turn and an accurate message instead of silently redefining its
 * project as empty.
 */
export class BoxError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "BoxError";
  }
}

/**
 * How long a box this process opens is allowed to exist, absent anyone saying
 * otherwise. An hour is boxd's own ceiling for a single command, so it is the
 * longest a run can legitimately still be using one.
 */
export const DEFAULT_BOX_TTL_SEC = 3600;

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
 * "Get OR create" is the whole point, and it takes two calls rather than one
 * because cloud has no single endpoint for it. `POST /sandbox/boxes` answers
 * 409 when the project already has a live box — the project volume is RWO, so
 * a second box for it is refused rather than silently given a cold copy. That
 * 409 is a SUCCESS for this function's purpose: the box we want exists. We ask
 * which one it is with the declared list filter instead of scraping the id out
 * of the refusal's prose, because a reworded error must not silently become a
 * lost box.
 *
 * Treating that 409 as failure is what made the second run on a project start
 * from an empty in-memory map while the real checkout sat untouched in a box
 * nobody looked up — and report success.
 *
 * `ttlSec` is sent because nothing else bounds a box's life. The comment that
 * used to sit here said lifetime was "cloud's problem — it owns the lease that
 * suspends an idle box"; there is no such lease. `apps/sandbox` has no reaper,
 * so `ExpiresAt` is currently a fact nothing acts on. Sending it is still
 * right — it is the declared field for this, and it means the boxes this
 * process opens are already marked for collection on the day something
 * collects. Until then `release()` is what actually frees the pod.
 *
 * Returns null when the sandbox service is unreachable or refuses for any other
 * reason, so a caller can fall back to an in-memory project rather than failing
 * the user's run.
 */
export async function openBox(opts: {
  baseUrl: string;
  token: string;
  project: string;
  boxClass?: BoxClass;
  ref?: string;
  timeoutMs?: number;
  ttlSec?: number;
}): Promise<Box | null> {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const timeout = opts.timeoutMs ?? 30_000;
  const headers = {
    Authorization: `Bearer ${opts.token}`,
    "Content-Type": "application/json",
  };
  try {
    const res = await fetch(`${base}/sandbox/boxes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        project: opts.project,
        class: opts.boxClass ?? "dev",
        ttlSec: opts.ttlSec ?? DEFAULT_BOX_TTL_SEC,
        ...(opts.ref ? { ref: opts.ref } : {}),
      }),
      signal: AbortSignal.timeout(timeout),
      cache: "no-store",
    });
    if (res.status === 409) return liveBox(base, headers, opts.project, timeout);
    if (!res.ok) return null;
    const box = (await res.json()) as Box;
    return box?.id ? box : null;
  } catch {
    return null;
  }
}

/**
 * The box that already holds this project's volume.
 *
 * `status=running` and not merely live: cloud counts a `pending` box as live
 * (it holds the volume) but its proxy refuses everything until it is running,
 * so handing one back would produce a filesystem whose every call throws. No
 * running box means we genuinely have nowhere to run, and the caller falls
 * back to memory.
 */
async function liveBox(
  base: string,
  headers: Record<string, string>,
  project: string,
  timeoutMs: number
): Promise<Box | null> {
  const url = new URL(`${base}/sandbox/boxes`);
  url.searchParams.set("project", project);
  url.searchParams.set("status", "running");
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { boxes?: Box[] };
  return body.boxes?.find((b) => b?.id) ?? null;
}

/**
 * Give the box back.
 *
 * Suspend, not delete: the pod goes away and the checkout stays, which is what
 * a coding agent wants between turns — `node_modules` and the working tree
 * survive, and the next run resumes onto the same volume. Delete would keep
 * the volume too (purge is opt-in) but throw away the warm process for no gain.
 *
 * This is the only thing that currently frees a box. Best-effort by
 * construction: a run whose work is already streamed to the user must not fail
 * because the box would not hang up.
 */
export async function releaseBox(opts: {
  baseUrl: string;
  token: string;
  boxId: string;
  timeoutMs?: number;
}): Promise<boolean> {
  try {
    const res = await fetch(
      `${opts.baseUrl.replace(/\/+$/, "")}/sandbox/boxes/${encodeURIComponent(opts.boxId)}/suspend`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${opts.token}` },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
        cache: "no-store",
      }
    );
    await res.body?.cancel().catch(() => {});
    return res.ok;
  } catch {
    return false;
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

  /**
   * One request, and the one place a failure is named as a failure.
   *
   * `allow` is the caller's declaration that a particular non-2xx carries
   * meaning for it — only `read`/`exists` use it, only for 404. Anything else
   * (409 from a suspended box, 502 from a box that died, 500 from an
   * unreadable file) throws here, so no method further down can turn it into
   * an empty listing, a missing file, or an absent match.
   */
  private async call(
    method: "GET" | "POST" | "DELETE",
    path: string,
    init: {
      query?: Record<string, string>;
      body?: unknown;
      timeoutMs?: number;
      allow?: number[];
    } = {}
  ): Promise<Response> {
    const url = new URL(`${this.base}${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.opts.token}`,
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";

    // A box can wedge; an agent turn that never returns is worse than one that
    // reports a failed tool call and lets the model try something else.
    const res = await fetch(url, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? this.timeoutMs),
      cache: "no-store",
    });
    if (res.ok || (init.allow ?? []).includes(res.status)) return res;
    await res.body?.cancel().catch(() => {});
    throw new BoxError(res.status, `${method} ${path}: box ${this.opts.boxId} returned ${res.status}`);
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
    // A failed COMMAND is a 200 carrying a non-zero exitCode and is returned as
    // data. A failed BOX throws from `call`: boxd already spends exitCode -1 on
    // "the binary never launched", so reusing it for "the box is gone" would
    // give one value two meanings and the model would debug the wrong one.
    const res = await this.call("POST", "/proc/exec", {
      body: { command, timeoutSec },
      timeoutMs: (timeoutSec + 10) * 1000,
    });
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
    const res = await this.call("GET", "/fs/read", {
      query: { path: normalizePath(path) },
      allow: [404],
    });
    await res.body?.cancel().catch(() => {});
    return res.ok;
  }

  /** `null` means the box answered 404 — the file is not there. It never means
   *  the box failed to answer; that throws. */
  async read(path: string): Promise<string | null> {
    const res = await this.call("GET", "/fs/read", {
      query: { path: normalizePath(path) },
      allow: [404],
    });
    if (res.status === 404) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    return res.text();
  }

  async write(path: string, content: string): Promise<void> {
    const p = normalizePath(path);
    await this.call("POST", "/fs/write", { body: { path: p, content } });
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
    const body = (await res.json()) as { matches?: SearchMatch[] };
    return (body.matches ?? []).slice(0, limit);
  }

  async applyPatch(path: string, ops: PatchOp[]): Promise<PatchResult> {
    const p = normalizePath(path);
    // `?? ""` is "this file does not exist yet", which is what the in-memory
    // filesystem also does, and it is only correct because `read` throws rather
    // than returning null when the box could not answer. If a failed read came
    // back as null here, a patch computed against a phantom empty file would be
    // WRITTEN, destroying a file that was intact — and the PatchResult would
    // claim both filesystems agreed.
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
