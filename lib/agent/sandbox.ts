/**
 * A `ProjectFs` backed by a real directory in a real sandbox.
 *
 * A sandbox is a pod. There is no daemon inside it: cloud runs commands through
 * the Kubernetes exec subresource, so the second hop is to the apiserver, not to
 * a pod address. Sandboxes have no public address anyway, and terminating auth
 * anywhere but the IAM edge would be a second auth path, so every call goes
 * through cloud:
 *
 *     hanzo.app  ──Bearer──▶  cloud /v1/sandboxes/:id/{exec,fs}
 *                             └──▶  kube exec into the pod
 *
 * We hold the user's IAM bearer and nothing else. The credential on the second
 * hop is cloud's own and is never present in this process.
 *
 * THREE VERBS, and the shape of this file follows from that. `POST /:id/exec`
 * runs a command; `GET /:id/fs?path=` reads one; `POST /:id/fs?path=` writes
 * one. There is no /fs/list and no /fs/search, deliberately — a recursive
 * listing is `find` and a grep is `grep`, and a second endpoint for each would
 * be a second way to ask a question the sandbox already answers.
 *
 * That is also why the writes take the file as the raw body rather than a
 * `{path, content}` envelope: the path is addressing, the body is the file, and
 * a file whose own text is JSON then needs no escaping.
 *
 * One thing this deliberately does NOT do, because the sandbox already does it
 * and doing it twice means doing it differently: path mapping. Every path is
 * project-relative by construction (`/src/App.tsx`). The sandbox's workdir is
 * the sandbox's business; there is no prefix to strip and nothing to configure.
 *
 * What it DOES do here rather than on the sandbox is apply patches: read, apply,
 * write. The reason — what `update` means when `oldStr`
 * appears twice is ONE fact, it is defined in `patch.ts`, and
 * `tests/integration/sandbox.test.ts` asserts both filesystems answer it
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
 * The sandbox did not answer the question.
 *
 * This exists because "the file is not there" and "I could not find out" are
 * different facts, and the only safe place to collapse them is nowhere. A
 * filesystem that returns `null` for both makes `applyPatch` read a phantom
 * empty file and write the patch result over a file that was fine — a 500 on
 * read becomes data loss on disk. So exactly one status is data (404, which
 * the sandbox emits only for a genuinely missing path) and every other non-2xx raises.
 *
 * `runTool` catches this and reports a failed tool call, so a broken sandbox costs
 * the model one turn and an accurate message instead of silently redefining its
 * project as empty.
 */
export class SandboxError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "SandboxError";
  }
}

/**
 * How long a sandbox this process opens is allowed to exist, absent anyone saying
 * otherwise. An hour is the sandbox's own ceiling for a single command, so it is the
 * longest a run can legitimately still be using one.
 */
export const DEFAULT_TTL_SEC = 3600;

/** `class` in the wire: what toolchain the sandbox carries. */
export type SandboxClass = "exec" | "dev" | "desktop";

/** A sandbox as the API reports it — the row, not the handle. */
export interface Info {
  id: string;
  org?: string;
  project?: string;
  class?: SandboxClass;
  status?: "pending" | "running" | "suspended" | "error";
  image?: string;
  ref?: string;
  url?: string;
}

export interface SandboxOptions {
  /** Gateway base URL, e.g. `https://api.hanzo.ai/v1` — the same one the rest
   *  of the run already uses. */
  baseUrl: string;
  /** The sandbox to edit in. */
  id: string;
  /** The caller's verified IAM bearer. There is no shared server key here. */
  token: string;
  /** Per-request timeout. A wedged sandbox must not hang the agent turn. */
  timeoutMs?: number;
}

/**
 * Get a sandbox for a project, creating one if there is none.
 *
 * "Get OR create" is the whole point, and it takes two calls rather than one
 * because cloud has no single endpoint for it. `POST /v1/sandboxes` answers
 * 409 when the project already has a live sandbox — the project volume is RWO, so
 * a second sandbox for it is refused rather than silently given a cold copy. That
 * 409 is a SUCCESS for this function's purpose: the sandbox we want exists. We ask
 * which one it is with the declared list filter instead of scraping the id out
 * of the refusal's prose, because a reworded error must not silently become a
 * lost sandbox.
 *
 * Treating that 409 as failure is what made the second run on a project start
 * from an empty in-memory map while the real checkout sat untouched in a sandbox
 * nobody looked up — and report success.
 *
 * `ttlSec` is sent because nothing else bounds a sandbox's life. The comment that
 * used to sit here said lifetime was "cloud's problem — it owns the lease that
 * suspends an idle sandbox"; there is no such lease. `apps/sandbox` has no reaper,
 * so `ExpiresAt` is currently a fact nothing acts on. Sending it is still
 * right — it is the declared field for this, and it means the sandboxes this
 * process opens are already marked for collection on the day something
 * collects. Until then `release()` is what actually frees the pod.
 *
 * Returns null when the sandbox service is unreachable or refuses for any other
 * reason, so a caller can fall back to an in-memory project rather than failing
 * the user's run.
 */
export async function openSandbox(opts: {
  baseUrl: string;
  token: string;
  project: string;
  class?: SandboxClass;
  ref?: string;
  timeoutMs?: number;
  ttlSec?: number;
}): Promise<Info | null> {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const timeout = opts.timeoutMs ?? 30_000;
  const headers = {
    Authorization: `Bearer ${opts.token}`,
    "Content-Type": "application/json",
  };
  try {
    const res = await fetch(`${base}/sandboxes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        project: opts.project,
        class: opts.class ?? "dev",
        ttlSec: opts.ttlSec ?? DEFAULT_TTL_SEC,
        ...(opts.ref ? { ref: opts.ref } : {}),
      }),
      signal: AbortSignal.timeout(timeout),
      cache: "no-store",
    });
    if (res.status === 409) return live(base, headers, opts.project, timeout);
    if (!res.ok) return null;
    const sandbox = (await res.json()) as Info;
    return sandbox?.id ? sandbox : null;
  } catch {
    return null;
  }
}

/**
 * The sandbox that already holds this project's volume.
 *
 * `status=running` and not merely live: cloud counts a `pending` sandbox as live
 * (it holds the volume) but its proxy refuses everything until it is running,
 * so handing one back would produce a filesystem whose every call throws. No
 * running sandbox means we genuinely have nowhere to run, and the caller falls
 * back to memory.
 */
async function live(
  base: string,
  headers: Record<string, string>,
  project: string,
  timeoutMs: number
): Promise<Info | null> {
  const url = new URL(`${base}/sandboxes`);
  url.searchParams.set("project", project);
  url.searchParams.set("status", "running");
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { sandboxes?: Info[] };
  return body.sandboxes?.find((b) => b?.id) ?? null;
}

/**
 * Give the sandbox back.
 *
 * Suspend, not delete: the pod goes away and the checkout stays, which is what
 * a coding agent wants between turns — `node_modules` and the working tree
 * survive, and the next run resumes onto the same volume. Delete would keep
 * the volume too (purge is opt-in) but throw away the warm process for no gain.
 *
 * This is the only thing that currently frees a sandbox. Best-effort by
 * construction: a run whose work is already streamed to the user must not fail
 * because the sandbox would not hang up.
 */
export async function releaseSandbox(opts: {
  baseUrl: string;
  token: string;
  id: string;
  timeoutMs?: number;
}): Promise<boolean> {
  try {
    const res = await fetch(
      `${opts.baseUrl.replace(/\/+$/, "")}/sandboxes/${encodeURIComponent(opts.id)}`,
      {
        method: "DELETE",
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

export class Sandbox implements ProjectFs, ProjectExec {
  private readonly changed = new Set<string>();
  private readonly timeoutMs: number;
  private readonly base: string;

  constructor(private readonly opts: SandboxOptions) {
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.base = `${opts.baseUrl.replace(/\/+$/, "")}/sandboxes/${encodeURIComponent(opts.id)}`;
  }

  /** The sandbox this filesystem edits — the id a caller shows or reuses. */
  get id(): string {
    return this.opts.id;
  }

  /**
   * One request, and the one place a failure is named as a failure.
   *
   * `allow` is the caller's declaration that a particular non-2xx carries
   * meaning for it — only `read`/`exists` use it, only for 404. Anything else
   * (409 from a suspended sandbox, 502 from a sandbox that died, 500 from an
   * unreadable file) throws here, so no method further down can turn it into
   * an empty listing, a missing file, or an absent match.
   */
  private async call(
    method: "GET" | "POST" | "DELETE",
    path: string,
    init: {
      query?: Record<string, string>;
      body?: unknown;
      /** The file itself. `body` is a JSON envelope; a file is bytes. */
      raw?: string;
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
    if (init.raw !== undefined) headers["Content-Type"] = "application/octet-stream";

    // A sandbox can wedge; an agent turn that never returns is worse than one that
    // reports a failed tool call and lets the model try something else.
    const res = await fetch(url, {
      method,
      headers,
      body: init.raw !== undefined ? init.raw : init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? this.timeoutMs),
      cache: "no-store",
    });
    if (res.ok || (init.allow ?? []).includes(res.status)) return res;
    await res.body?.cancel().catch(() => {});
    throw new SandboxError(res.status, `${method} ${path}: sandbox ${this.opts.id} returned ${res.status}`);
  }

  /**
   * Run a command in the project directory.
   *
   * This is the capability a sandbox has and a map does not, and it is why
   * `ProjectExec` is a separate interface: `build`, `test` and `git` are the
   * reason to pay for a sandbox at all, and an in-memory project cannot pretend to
   * offer them. A non-zero `exitCode` is a SUCCESSFUL call carrying a failed
   * program — the same distinction `wire.ExecResult` draws, kept here so the
   * model can tell "your tests failed" from "the sandbox is broken".
   */
  async exec(command: string, timeoutSec = 120): Promise<ExecResult> {
    // Give the HTTP call the sandbox's own deadline plus a margin, so a command
    // that legitimately runs for two minutes is not cut off by a 20s default.
    // A failed COMMAND is a 200 carrying a non-zero exitCode and is returned as
    // data. A failed SANDBOX throws from `call`: exitCode -1 already means
    // "the binary never launched", so reusing it for "the sandbox is gone" would
    // give one value two meanings and the model would debug the wrong one.
    const res = await this.call("POST", "/exec", {
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

  /**
   * `find`, not an endpoint. The sandbox surface has exec and two fs verbs, and
   * a recursive listing is a COMMAND — adding /fs/list beside it would be a
   * second way to ask the same question, maintained separately and drifting on
   * the first change to either.
   *
   * The prunes are not decoration: a checkout with node_modules is ~30k files,
   * almost all of them dependencies the caller already has, and shipping that
   * list across the network is how a listing becomes the most expensive call an
   * agent makes. `-type f` because the model edits files, not directories.
   */
  async list(): Promise<string[]> {
    const r = await this.exec(
      `find . \\( -name node_modules -o -name .git -o -name dist -o -name .next \\) -prune -o -type f -print`,
      60
    );
    if (r.exitCode !== 0 && !r.stdout) return [];
    return r.stdout
      .split("\n")
      .map((l) => l.trim().replace(/^\.\//, ""))
      .filter(Boolean)
      .map((p) => normalizePath(p))
      .sort();
  }

  /**
   * A read that throws the bytes away. There is no `HEAD` and no `stat` on the
   * wire on purpose: the sandbox answers a missing file with 404 specifically so that
   * "not there" has ONE representation, and inventing a second endpoint to ask
   * the same question more cheaply would be a second answer to maintain.
   */
  async exists(path: string): Promise<boolean> {
    const res = await this.call("GET", "/fs", {
      query: { path: normalizePath(path) },
      allow: [404],
    });
    await res.body?.cancel().catch(() => {});
    return res.ok;
  }

  /** `null` means the sandbox answered 404 — the file is not there. It never means
   *  the sandbox failed to answer; that throws. */
  async read(path: string): Promise<string | null> {
    const res = await this.call("GET", "/fs", {
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
    await this.call("POST", "/fs", { query: { path: p }, raw: content });
    this.changed.add(p);
  }

  /**
   * Grep the checkout. The one operation where a sandbox is not merely equivalent
   * to an in-process map but categorically better: the tree is searched where
   * it lives and only the hits cross the network. Substring, not regex, on both
   * sides — a model should not be able to wedge its own sandbox with `(a+)+$`.
   */
  async search(query: string, limit = 50): Promise<SearchMatch[]> {
    if (!query) return [];
    // -F is the whole safety argument: fixed string, not a pattern, so a model
    // cannot hand its own sandbox `(a+)+$` and wedge it. The single quotes are
    // closed and reopened around each embedded quote because the needle is the
    // model's text and reaches a shell.
    const needle = `'${query.replace(/'/g, `'\\''`)}'`;
    const r = await this.exec(
      `grep -rnIF --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist ` +
        `-m ${limit} ${needle} . | head -n ${limit}`,
      60
    );
    // grep exits 1 for "no matches", which is an ANSWER, not a failure.
    if (r.exitCode > 1) return [];
    const out: SearchMatch[] = [];
    for (const line of r.stdout.split("\n")) {
      // path:line:text — split on the first two colons only, because the text
      // itself routinely contains them.
      const m = /^(.+?):(\d+):(.*)$/.exec(line.trim());
      if (!m) continue;
      out.push({
        path: normalizePath(m[1].replace(/^\.\//, "")),
        line: Number(m[2]),
        text: m[3].slice(0, 400),
      });
      if (out.length >= limit) break;
    }
    return out;
  }

  async applyPatch(path: string, ops: PatchOp[]): Promise<PatchResult> {
    const p = normalizePath(path);
    // `?? ""` is "this file does not exist yet", which is what the in-memory
    // filesystem also does, and it is only correct because `read` throws rather
    // than returning null when the sandbox could not answer. If a failed read came
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
