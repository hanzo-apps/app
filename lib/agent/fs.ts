/**
 * Track B — in-memory project file system for the D1 agent loop.
 *
 * A tiny, dependency-free, server-safe file store. It intentionally does NOT
 * pull in `@/lib/vfs` (that is the browser IndexedDB VFS and references DOM
 * globals) — the whole point of D1 is a self-contained server-side loop. The
 * update/rewrite patch semantics mirror `lib/llm/string-patch.ts` so the model
 * sees the same edit contract it already uses client-side; D2+ replaces this
 * class with the real sandbox FS behind the identical method surface.
 */

import type { AgentFile } from "./types";

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

/** Normalize a path to a single leading slash and collapse `//`. */
function normalize(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.replace(/\/+/g, "/");
}

function truncate(s: string, max = 100): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export class InMemoryProjectFs {
  private files = new Map<string, string>();
  private changed = new Set<string>();

  constructor(initial: AgentFile[] = []) {
    for (const f of initial) this.files.set(normalize(f.path), f.content);
  }

  /** All file paths, sorted. */
  list(): string[] {
    return [...this.files.keys()].sort();
  }

  exists(path: string): boolean {
    return this.files.has(normalize(path));
  }

  /** File content, or null when the file does not exist. */
  read(path: string): string | null {
    const c = this.files.get(normalize(path));
    return c === undefined ? null : c;
  }

  /** Create or overwrite a file. Records the path as changed. */
  write(path: string, content: string): void {
    const p = normalize(path);
    this.files.set(p, content);
    this.changed.add(p);
  }

  /**
   * Grep-style search across all files. Returns up to `limit` matches.
   * `query` is treated as a case-insensitive substring (not a regex) so a
   * model can't wedge the loop with a pathological pattern.
   */
  search(query: string, limit = 50): SearchMatch[] {
    const needle = query.toLowerCase();
    const out: SearchMatch[] = [];
    if (!needle) return out;
    for (const path of this.list()) {
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
  applyPatch(path: string, ops: PatchOp[]): PatchResult {
    const p = normalize(path);
    const warnings: string[] = [];

    if (!Array.isArray(ops) || ops.length === 0) {
      return { applied: false, summary: "No operations provided", warnings: ["operations must be a non-empty array"] };
    }

    let content = this.files.get(p) ?? "";
    let applied = 0;

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      if (op.type === "rewrite") {
        content = op.content ?? "";
        applied++;
      } else if (op.type === "update") {
        const { oldStr, newStr } = op;
        if (oldStr === undefined) {
          warnings.push(`op ${i + 1}: update requires oldStr`);
          continue;
        }
        if (oldStr === "") {
          // Empty oldStr = prepend (matches string-patch semantics).
          content = `${newStr ?? ""}${content}`;
          applied++;
          continue;
        }
        const first = content.indexOf(oldStr);
        if (first === -1) {
          warnings.push(`op ${i + 1}: oldStr not found: "${truncate(oldStr)}"`);
          continue;
        }
        if (content.indexOf(oldStr, first + oldStr.length) !== -1) {
          warnings.push(`op ${i + 1}: oldStr is not unique: "${truncate(oldStr)}"`);
          continue;
        }
        content = content.slice(0, first) + (newStr ?? "") + content.slice(first + oldStr.length);
        applied++;
      } else {
        warnings.push(`op ${i + 1}: unknown type "${(op as { type?: string }).type ?? "(missing)"}"`);
      }
    }

    if (applied > 0) {
      this.files.set(p, content);
      this.changed.add(p);
    }

    return {
      applied: applied > 0,
      summary:
        applied > 0
          ? `Applied ${applied}/${ops.length} operation(s) to ${p}`
          : `No operations applied to ${p}`,
      warnings,
    };
  }

  /** Paths written during this run, sorted. */
  changedPaths(): string[] {
    return [...this.changed].sort();
  }

  /** Full current snapshot, sorted by path. */
  snapshot(): AgentFile[] {
    return this.list().map((path) => ({ path, content: this.files.get(path)! }));
  }
}
