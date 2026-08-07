/**
 * A `ProjectFs` backed by a real directory in a real sandbox.
 *
 * A sandbox is a pod. There is no daemon inside it: cloud runs commands through
 * the Kubernetes exec subresource, so the second hop is to the apiserver, not to
 * a pod address. Sandboxes have no public address anyway, and terminating auth
 * anywhere but the IAM edge would be a second auth path, so every call goes
 * through cloud:
 *
 *     hanzo.app  ──Bearer──▶  cloud /v1/sandboxes/{run,:id/fs}
 *                             └──▶  kube exec into the pod
 *
 * We hold the user's IAM bearer and nothing else. The credential on the second
 * hop is cloud's own and is never present in this process.
 *
 * THREE VERBS, and the shape of this file follows from that. `POST /run` runs a
 * command; `GET /:id/fs?path=` reads one; `POST /:id/fs?path=` writes one. There
 * is no /fs/list and no /fs/search, deliberately — a recursive listing is `find`
 * and a grep is `grep`, and a second endpoint for each would be a second way to
 * ask a question the sandbox already answers.
 *
 * Running is the one verb addressed at the COLLECTION rather than at this
 * sandbox, which is why the id travels in its body. That is not an inconsistency
 * to tidy away: `/run` is the op the fleet publishes to agents as
 * `run_in_sandbox`, and it is the only one that takes a SESSION to narrate into.
 * The older `/:id/exec` has no field for one, so every command sent there is
 * silent for its whole life — which is the entire defect this file's `watch()`
 * exists to end.
 *
 * That is also why the writes take the file as the raw body rather than a
 * `{path, content}` envelope: the path is addressing, the body is the file, and
 * a file whose own text is JSON then needs no escaping.
 *
 * There IS one conversion, in one line (`wire`, below), and it used to be absent
 * on the theory that the sandbox already did it. It does not: cloud's `confine`
 * treats a leading slash as absolute and refuses anything outside its workdir, so
 * `/src/App.tsx` — the identity every other part of the harness uses for a file —
 * was a 400 on every read and every write. The workdir stays the sandbox's
 * business and nothing here is configurable; the slash comes off, and that is all.
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
 * The path as the SANDBOX addresses it.
 *
 * `normalizePath` gives a file one identity — leading slash, project-relative —
 * and that identity is what the model, the patch engine, `changedPaths` and the
 * in-memory filesystem all speak. The sandbox addresses files differently, and
 * this is the one line that knows it: cloud's `confine` reads a leading slash as
 * ABSOLUTE and refuses anything outside the workdir, so `/src/App.tsx` is not
 * "the project's src/App.tsx" to it — it is a path at the root of the filesystem
 * and a 400. A relative path is resolved against the workdir, which is exactly
 * the meaning we want, so the conversion is: drop the slash.
 *
 * It is done HERE and nowhere else. Mapping paths on both sides is how the two
 * definitions drift; mapping them on neither is what this fixes. The comment
 * above `Sandbox` used to say this file "deliberately does not do path mapping"
 * because the sandbox already did it — the sandbox does the opposite, and every
 * agent read and write against a real sandbox was a 400 raised as a SandboxError,
 * which the model saw as a broken tool rather than a wrong address.
 */
const wire = (path: string): string => normalizePath(path).slice(1);

/**
 * Throw a response body away, and DO NOT WAIT for it to be thrown.
 *
 * Every call site here is on its way to somewhere else — returning a boolean,
 * raising a `SandboxError` — and the cancel is a courtesy to the connection pool,
 * not a step in the answer. It used to be awaited, which quietly made that
 * courtesy load-bearing: a body that will not cancel then blocks the throw, and
 * the agent turn hangs on cleanup for a request whose outcome was already known.
 * Caught here, once, because an ignored rejection is still a rejection.
 */
const discard = (res: Response): void => {
  void res.body?.cancel().catch(() => {});
};

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
 * What the sandbox service SAID, not merely what it returned.
 *
 * Every refusal carries a sentence — `project "x" already has a live sandbox`,
 * `exec: context deadline exceeded`, `org holds 16 live sandboxes` — and a bare
 * status code throws all of it away. That cost twice over. A command that merely
 * ran past its deadline is a 502 (the deadline is not an exit code, so cloud
 * cannot report it as one), and the model read `returned 502` as a broken sandbox
 * and went looking for the wrong bug. And on create, a quota, an outage and a
 * cold pull that never finished were one indistinguishable sentence to the person
 * whose run had just quietly stopped being saved.
 *
 * Read once and bounded: a refusal is a sentence, and a service that answers one
 * with a megabyte is not owed the memory. Consuming the body here is also what
 * frees the connection, which is why no caller cancels it separately.
 */
async function said(res: Response): Promise<string> {
  try {
    const text = (await res.text()).slice(0, 600).trim();
    if (!text) return "";
    try {
      const body = JSON.parse(text) as { error?: unknown; message?: unknown };
      const sentence = body.error ?? body.message;
      if (typeof sentence === "string" && sentence.trim()) return sentence.trim();
    } catch {
      // Not a JSON envelope — the text itself is the sentence.
    }
    return text;
  } catch {
    return "";
  }
}

/**
 * How long a sandbox this process opens is allowed to exist, absent anyone saying
 * otherwise. An hour, and cloud's reaper genuinely enforces it: it wakes every
 * minute and stops sandboxes that are both expired and untouched for an hour.
 */
export const DEFAULT_TTL_SEC = 3600;

/**
 * How long to wait for a sandbox to be created.
 *
 * Creation BLOCKS until the pod is running: ~11-15s measured warm, ~27s on a cold
 * image pull, and cloud waits about two minutes before it gives up and answers
 * 503 itself. The old 20-30s ceiling sat inside that window, so a slow pull was
 * aborted HERE — and an abort is indistinguishable from a refusal, so the run
 * fell back to memory while the pod it had asked for came up moments later with
 * nobody holding its id. It then held the project's volume, so the NEXT run got
 * a 409 for a sandbox this one had already given up on.
 *
 * Past cloud's own deadline, deliberately: the answer a person is given should be
 * the SERVICE's answer, never the sound of us hanging up on it.
 */
const CREATE_TIMEOUT_MS = 150_000;

/** `class` in the wire: what toolchain the sandbox carries. */
export type SandboxClass = "exec" | "dev" | "desktop";

/** A sandbox as the API reports it — the row, not the handle. */
export interface Info {
  id: string;
  org?: string;
  project?: string;
  class?: SandboxClass;
  status?: "pending" | "running" | "error";
  image?: string;
  volume?: string;
}

/**
 * A sandbox, or why there is not one — exactly one of the two, and the caller
 * cannot read the second without having handled the first.
 *
 * It used to be `Info | null`, and `null` was every refusal at once: out of quota,
 * pod failed to start, service unreachable, and a create we abandoned ourselves.
 * The caller could only say "the sandbox service did not give one out", which is
 * true of all four and useful for none — and the person reading it is the one who
 * has to decide whether to wait, delete something, or give up.
 */
export type Opened = { sandbox: Info } | { why: string };

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
  /**
   * The run's session, when something is watching. Every command names it, and
   * the sandbox appends the command's output to that session's log AS IT IS
   * PRODUCED — so a watcher reads a twenty-five minute build working instead of
   * a blank pause with a verdict at the end.
   *
   * Absent is the honest default and costs nothing: a sandbox nobody is watching
   * narrates to nobody. Set it with `watch()` once the session exists.
   */
  session?: string;
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
 * `ttlSec` is sent and it is genuinely enforced: cloud's reaper wakes every minute
 * and stops sandboxes that are BOTH past `expiresAt` and untouched for an hour.
 * An earlier comment here claimed there was no reaper and that `expiresAt` was a
 * fact nothing acted on — that was wrong, and it is worth stating correctly,
 * because it is the reason a run may hand a sandbox back rather than hoarding it:
 * an abandoned one is collected either way, so `release()` is an economy, not the
 * only thing standing between us and a leaked pod.
 *
 * A refusal is REPORTED, never collapsed: the caller can still fall back to an
 * in-memory project rather than failing the user's run, but it does so holding
 * cloud's own sentence for why.
 */
export async function openSandbox(opts: {
  baseUrl: string;
  token: string;
  project: string;
  class?: SandboxClass;
  timeoutMs?: number;
  ttlSec?: number;
}): Promise<Opened> {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const timeout = opts.timeoutMs ?? CREATE_TIMEOUT_MS;
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
      }),
      signal: AbortSignal.timeout(timeout),
      cache: "no-store",
    });
    if (res.status === 409) {
      await res.body?.cancel().catch(() => {});
      const sandbox = await live(base, headers, opts.project, timeout);
      // 409 counts a PENDING sandbox as live — it holds the volume — but the
      // running filter excludes one, so this is a sandbox that exists and is not
      // ready yet. Saying so is the difference between "wait a moment" and
      // "something is broken".
      return sandbox
        ? { sandbox }
        : { why: `${opts.project} already has a sandbox and it is still starting up.` };
    }
    if (!res.ok) {
      const why = await said(res);
      return { why: `The sandbox service refused (${res.status})${why ? `: ${why}` : "."}` };
    }
    const sandbox = (await res.json()) as Info;
    return sandbox?.id
      ? { sandbox }
      : { why: "The sandbox service answered without a sandbox id." };
  } catch (e) {
    // A timeout here is OUR deadline, not cloud's, and it is worth naming as such:
    // past CREATE_TIMEOUT_MS the pod is most likely still coming up, and the next
    // run will find it by its 409.
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return {
      why: timedOut
        ? `The sandbox for ${opts.project} did not start within ${Math.round(timeout / 1000)}s.`
        : `The sandbox service could not be reached: ${e instanceof Error ? e.message : String(e)}`,
    };
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
 * The POD goes away and the CHECKOUT stays, which is exactly what a coding agent
 * wants between runs: the volume is named deterministically from org and project,
 * so the next run's create re-attaches the same disk and finds `node_modules` and
 * the working tree where it left them. Verified against the live service — a file
 * written before a release was read back after the next create, from the same
 * volume id.
 *
 * What does NOT survive is the sandbox ROW: this is a delete, not a suspend, and
 * the id is gone afterwards. That is why a caller reuses a project, never a
 * remembered id, on the run after this one.
 *
 * Best-effort by construction: a run whose work is already streamed to the user
 * must not fail because the sandbox would not hang up.
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
    discard(res);
    return res.ok;
  } catch {
    return false;
  }
}

export class Sandbox implements ProjectFs, ProjectExec {
  private readonly changed = new Set<string>();
  private readonly timeoutMs: number;
  /** `…/sandboxes` — the collection. `mine` addresses this one within it. */
  private readonly base: string;
  private readonly mine: string;
  private session: string;

  constructor(private readonly opts: SandboxOptions) {
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.base = `${opts.baseUrl.replace(/\/+$/, "")}/sandboxes`;
    this.mine = `/${encodeURIComponent(opts.id)}`;
    this.session = opts.session ?? "";
  }

  /** The sandbox this filesystem edits — the id a caller shows or reuses. */
  get id(): string {
    return this.opts.id;
  }

  /**
   * Narrate every command from here on into this session.
   *
   * Separate from the constructor because of the order the run is built in: the
   * sandbox has to exist before the session can say which sandbox it is running
   * on, so the session id is not known yet when this object is made. One
   * assignment rather than a second object, because it is the same sandbox
   * either way — the only thing that changed is that somebody is watching.
   */
  watch(session: string): void {
    this.session = session.trim();
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
    // Cloud's sentence, not just its number. `runTool` hands this straight to the
    // model, and "returned 502" sends it debugging a broken sandbox when what
    // actually happened was `exec: context deadline exceeded` — its own command
    // ran too long. Reading the body is also what releases the connection.
    const why = await said(res);
    throw new SandboxError(
      res.status,
      `${method} ${path}: sandbox ${this.opts.id} returned ${res.status}${why ? ` — ${why}` : ""}`
    );
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
    //
    // `run`, not `:id/exec`. They run the same command through the same code
    // path, and exactly one of them carries a session: `:id/exec` has no field
    // for one, so a command sent there is silent for its whole life however many
    // people are watching. `run` is also the op the fleet publishes to agents
    // (`run_in_sandbox`), so a person driving a sandbox from chat and this agent
    // driving one for a build are using ONE address.
    const res = await this.call("POST", "/run", {
      body: {
        id: this.opts.id,
        command,
        timeoutSec,
        ...(this.session ? { session: this.session } : {}),
      },
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
    const res = await this.call("GET", `${this.mine}/fs`, {
      query: { path: wire(path) },
      allow: [404],
    });
    discard(res);
    return res.ok;
  }

  /** `null` means the sandbox answered 404 — the file is not there. It never means
   *  the sandbox failed to answer; that throws. */
  async read(path: string): Promise<string | null> {
    const res = await this.call("GET", `${this.mine}/fs`, {
      query: { path: wire(path) },
      allow: [404],
    });
    if (res.status === 404) {
      discard(res);
      return null;
    }
    return res.text();
  }

  async write(path: string, content: string): Promise<void> {
    const p = normalizePath(path);
    await this.call("POST", `${this.mine}/fs`, { query: { path: wire(p) }, raw: content });
    // The identity, not the address: `changedPaths` and `changedFiles` feed the
    // caller and the model, which speak leading-slash project paths.
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
    // Concurrently, because this runs AFTER the model has stopped talking: a run
    // that touched twenty files was twenty sequential round trips of dead air at
    // the very end, with nothing left to stream over it. The set is only what
    // this run wrote, so it is bounded by the run's own tool calls.
    return Promise.all(
      [...this.changed]
        .sort()
        .map(async (path) => ({ path, content: (await this.read(path)) ?? "" }))
    );
  }
}
