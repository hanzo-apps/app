/**
 * The project file system the agent edits, and the in-memory implementation.
 *
 * Two things live behind `ProjectFs`: a map in this process, and a real
 * directory on a sandbox machine (`sandbox-fs.ts`). The agent loop cannot tell
 * them apart, which is the point — the same tool contract reaches a scratch
 * project with no box and a checked-out repo on a box.
 *
 * Every method is async because a remote filesystem cannot be otherwise. The
 * in-memory one answers immediately and is none the worse for the `await`.
 *
 * This file deliberately does NOT import `@/lib/vfs` — that is the browser
 * IndexedDB VFS and touches DOM globals. The update/rewrite patch semantics
 * mirror `lib/llm/string-patch.ts`, so the model sees the same edit contract it
 * already uses client-side.
 */

import type { AgentFile } from "./types";
import { applyPatchOps, normalizePath } from "./patch";

/** A structured edit operation applied to a single file. */
export type PatchOp =
  | { type: "update"; oldStr: string; newStr: string }
  | { type: "rewrite"; content: string };

export interface PatchResult {
  applied: boolean;
  summary: string;
  warnings: string[];
}

export interface SearchMatch {
  path: string;
  line: number;
  text: string;
}

function truncate(s: string, max = 100): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/**
 * What the agent's tools need from a filesystem, and nothing more.
 *
 * `changedFiles` returns only what this run wrote, never the whole tree: on a
 * real checkout the tree is thousands of files the caller already has, and
 * shipping it back through an SSE frame would be absurd. The delta is also the
 * honest answer to "what did the agent do".
 */
export interface ProjectFs {
  list(): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string | null>;
  write(path: string, content: string): Promise<void>;
  search(query: string, limit?: number): Promise<SearchMatch[]>;
  applyPatch(path: string, ops: PatchOp[]): Promise<PatchResult>;
  changedPaths(): Promise<string[]>;
  changedFiles(): Promise<AgentFile[]>;
}

export class InMemoryProjectFs implements ProjectFs {
  private files = new Map<string, string>();
  private changed = new Set<string>();

  constructor(initial: AgentFile[] = []) {
    for (const f of initial) this.files.set(normalizePath(f.path), f.content);
  }

  /** All file paths, sorted. */
  async list(): Promise<string[]> {
    return [...this.files.keys()].sort();
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(normalizePath(path));
  }

  /** File content, or null when the file does not exist. */
  async read(path: string): Promise<string | null> {
    const c = this.files.get(normalizePath(path));
    return c === undefined ? null : c;
  }

  /** Create or overwrite a file. Records the path as changed. */
  async write(path: string, content: string): Promise<void> {
    const p = normalizePath(path);
    this.files.set(p, content);
    this.changed.add(p);
  }

  /**
   * Grep-style search across all files. Returns up to `limit` matches.
   * `query` is treated as a case-insensitive substring (not a regex) so a
   * model can't wedge the loop with a pathological pattern.
   */
  async search(query: string, limit = 50): Promise<SearchMatch[]> {
    const needle = query.toLowerCase();
    const out: SearchMatch[] = [];
    if (!needle) return out;
    for (const path of [...this.files.keys()].sort()) {
      const content = this.files.get(path)!;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(needle)) {
          out.push({ path, line: i + 1, text: truncate(lines[i].trim(), 200) });
          if (out.length >= limit) return out;
        }
      }
    }
    return out;
  }

  /**
   * Apply structured patch operations to a file, mirroring
   * `lib/llm/string-patch.ts`: `update` replaces a UNIQUE occurrence of
   * `oldStr`; `rewrite` replaces the whole file. Non-existent files are created
   * by a rewrite (or by an update whose `oldStr` is empty). Partial success is
   * allowed — the summary + warnings report exactly what applied.
   */
  async applyPatch(path: string, ops: PatchOp[]): Promise<PatchResult> {
    const p = normalizePath(path);
    const { content, result } = applyPatchOps(p, this.files.get(p) ?? "", ops);
    if (result.applied) {
      this.files.set(p, content);
      this.changed.add(p);
    }
    return result;
  }

  /** Paths written during this run, sorted. */
  async changedPaths(): Promise<string[]> {
    return [...this.changed].sort();
  }

  /** Just what this run wrote, sorted by path — the interface contract. */
  async changedFiles(): Promise<AgentFile[]> {
    return [...this.changed]
      .sort()
      .map((path) => ({ path, content: this.files.get(path) ?? "" }));
  }

  /** Full current tree. Cheap here and nowhere else, so it is NOT on the
   *  interface — only callers holding an in-memory project may ask. */
  snapshot(): AgentFile[] {
    return [...this.files.keys()].sort().map((path) => ({ path, content: this.files.get(path)! }));
  }
}
