/**
 * A `ProjectFs` backed by a real directory on a Hanzo Runtime sandbox.
 *
 * `hanzoai/runtime` runs a daemon inside every sandbox that already exposes the
 * toolbox this needs — `/files` (list, download, upload, search, find),
 * `/process/execute`, `/git`, `/lsp`, `/computeruse`, `/port` — so this file is
 * a client, not a filesystem. Nothing here reimplements what the daemon does.
 *
 * The difference from `InMemoryProjectFs` that actually matters: there is a
 * real tree here, usually a checkout. `list()` therefore returns the project's
 * files rather than a handful the caller supplied, `search()` is ripgrep on the
 * box rather than a substring scan in Node, and `changedFiles()` reports only
 * the delta — the tree is far too large to ship back.
 *
 * Patch semantics are identical to the in-memory implementation on purpose:
 * read, apply in memory, write back. Applying the edit here rather than through
 * a remote patch endpoint keeps ONE definition of what `update`/`rewrite` mean,
 * so a model cannot get different behaviour depending on where it happens to be
 * running.
 */

import type { AgentFile } from "./types";
import type { PatchOp, PatchResult, ProjectFs, SearchMatch } from "./fs";
import { applyPatchOps, normalizePath } from "./patch";

export interface SandboxFsOptions {
  /** Daemon base URL for this sandbox, e.g. `http://10.1.2.3:2280`. */
  baseUrl: string;
  /** Absolute path of the project root inside the sandbox. */
  projectDir: string;
  /** Bearer token authorizing calls to this sandbox's daemon. */
  token?: string;
  /** Per-request timeout. A wedged box must not hang the agent turn. */
  timeoutMs?: number;
}

/** Paths that are never the agent's business, and would swamp any listing. */
const IGNORED = /(^|\/)(\.git|node_modules|\.next|dist|build|target|\.venv|__pycache__)(\/|$)/;

interface DaemonFileInfo {
  name?: string;
  path?: string;
  isDir?: boolean;
  is_dir?: boolean;
}

export class SandboxProjectFs implements ProjectFs {
  private readonly changed = new Set<string>();
  private readonly timeoutMs: number;

  constructor(private readonly opts: SandboxFsOptions) {
    this.timeoutMs = opts.timeoutMs ?? 20_000;
  }

  /** Project-relative path (`/src/App.tsx`) → absolute path in the sandbox. */
  private abs(path: string): string {
    return `${this.opts.projectDir.replace(/\/+$/, "")}${normalizePath(path)}`;
  }

  private async call(
    method: "GET" | "POST" | "DELETE",
    path: string,
    init: { query?: Record<string, string>; body?: unknown } = {}
  ): Promise<Response> {
    const url = new URL(`${this.opts.baseUrl.replace(/\/+$/, "")}${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);

    const headers: Record<string, string> = {};
    if (this.opts.token) headers.Authorization = `Bearer ${this.opts.token}`;
    if (init.body !== undefined) headers["Content-Type"] = "application/json";

    // A sandbox can wedge; an agent turn that never returns is worse than one
    // that reports a failed tool call and lets the model try something else.
    const signal = AbortSignal.timeout(this.timeoutMs);
    return fetch(url, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal,
      cache: "no-store",
    });
  }

  /**
   * Run a command in the project directory. Exposed because the useful things
   * a sandbox adds over a map — build, test, git — are all commands, and the
   * caller should reach them through the same client that holds the auth.
   */
  async exec(command: string, timeoutSec = 120): Promise<{ stdout: string; exitCode: number }> {
    const res = await this.call("POST", "/process/execute", {
      body: { command, cwd: this.opts.projectDir, timeout: timeoutSec },
    });
    if (!res.ok) {
      return { stdout: `daemon returned ${res.status}`, exitCode: -1 };
    }
    const out = (await res.json()) as { result?: string; stdout?: string; exitCode?: number; exit_code?: number };
    return {
      stdout: out.result ?? out.stdout ?? "",
      exitCode: out.exitCode ?? out.exit_code ?? 0,
    };
  }

  async list(): Promise<string[]> {
    const res = await this.call("GET", "/files", { query: { path: this.opts.projectDir } });
    if (!res.ok) return [];
    const entries = (await res.json()) as DaemonFileInfo[] | { files?: DaemonFileInfo[] };
    const rows = Array.isArray(entries) ? entries : (entries.files ?? []);

    const root = this.opts.projectDir.replace(/\/+$/, "");
    return rows
      .filter((f) => !(f.isDir ?? f.is_dir))
      .map((f) => f.path ?? f.name ?? "")
      .filter(Boolean)
      .map((p) => (p.startsWith(root) ? p.slice(root.length) : p))
      .map(normalizePath)
      .filter((p) => !IGNORED.test(p))
      .sort();
  }

  async exists(path: string): Promise<boolean> {
    const res = await this.call("GET", "/files/info", { query: { path: this.abs(path) } });
    return res.ok;
  }

  async read(path: string): Promise<string | null> {
    const res = await this.call("GET", "/files/download", { query: { path: this.abs(path) } });
    if (!res.ok) return null;
    return res.text();
  }

  async write(path: string, content: string): Promise<void> {
    const p = normalizePath(path);
    const res = await this.call("POST", "/files/upload", {
      body: { path: this.abs(p), content },
    });
    if (!res.ok) {
      throw new Error(`write ${p} failed: daemon returned ${res.status}`);
    }
    this.changed.add(p);
  }

  /**
   * Search the checkout. This is the one operation where the sandbox is not
   * merely equivalent to the in-memory store but categorically better: the
   * daemon greps on the box, so the tree never crosses the network.
   */
  async search(query: string, limit = 50): Promise<SearchMatch[]> {
    if (!query) return [];
    const res = await this.call("GET", "/files/find", {
      query: { path: this.opts.projectDir, pattern: query },
    });
    if (!res.ok) return [];

    const rows = (await res.json()) as
      | Array<{ file?: string; path?: string; line?: number; content?: string; text?: string }>
      | { matches?: Array<{ file?: string; line?: number; content?: string }> };
    const matches = Array.isArray(rows) ? rows : (rows.matches ?? []);

    const root = this.opts.projectDir.replace(/\/+$/, "");
    const out: SearchMatch[] = [];
    for (const m of matches) {
      const raw = (m as { file?: string; path?: string }).file ?? (m as { path?: string }).path ?? "";
      if (!raw) continue;
      const rel = normalizePath(raw.startsWith(root) ? raw.slice(root.length) : raw);
      if (IGNORED.test(rel)) continue;
      out.push({
        path: rel,
        line: m.line ?? 0,
        text: ((m as { content?: string; text?: string }).content ?? (m as { text?: string }).text ?? "").trim().slice(0, 200),
      });
      if (out.length >= limit) break;
    }
    return out;
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

  async changedFiles(): Promise<AgentFile[]> {
    const paths = [...this.changed].sort();
    const files: AgentFile[] = [];
    for (const path of paths) {
      files.push({ path, content: (await this.read(path)) ?? "" });
    }
    return files;
  }
}
