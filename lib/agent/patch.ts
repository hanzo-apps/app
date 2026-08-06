/**
 * What `update` and `rewrite` mean — defined once, for every filesystem.
 *
 * Both `InMemoryProjectFs` and `SandboxProjectFs` apply edits by calling this,
 * so a model gets identical behaviour whether it is editing a scratch project
 * in this process or a checkout on a box. Two copies of these rules would be
 * two subtly different edit contracts, and the model would have no way to tell
 * which one it was talking to.
 *
 * The semantics mirror `lib/llm/string-patch.ts`, which is what the client-side
 * orchestrator has always used.
 */

import type { PatchOp, PatchResult } from "./fs";

/** One leading slash, no doubled separators. */
export function normalizePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.replace(/\/+/g, "/");
}

function truncate(s: string, max = 100): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/**
 * Apply `ops` to `current`, returning the new content and a report.
 *
 * Partial success is deliberate: an op that cannot apply becomes a warning
 * rather than an abort, so the model learns exactly which edit missed and why
 * instead of seeing the whole patch fail for one bad hunk.
 */
export function applyPatchOps(
  path: string,
  current: string,
  ops: PatchOp[]
): { content: string; result: PatchResult } {
  const warnings: string[] = [];

  if (!Array.isArray(ops) || ops.length === 0) {
    return {
      content: current,
      result: {
        applied: false,
        summary: "No operations provided",
        warnings: ["operations must be a non-empty array"],
      },
    };
  }

  let content = current;
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
      // Ambiguity is an error, not a coin flip: replacing the wrong one of two
      // identical spans is a silent corruption the model cannot see.
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

  return {
    content,
    result: {
      applied: applied > 0,
      summary:
        applied > 0
          ? `Applied ${applied}/${ops.length} operation(s) to ${path}`
          : `No operations applied to ${path}`,
      warnings,
    },
  };
}
