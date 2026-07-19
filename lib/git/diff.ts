/**
 * Unified-diff rendering primitives for the revision Details view — pure, tiny,
 * no dependency. Two sources feed the same `DiffLine[]` shape the UI renders as
 * red (−) / green (+) / context lines with old/new line numbers:
 *
 *   - `parseUnifiedPatch` parses a provider's per-file patch (GitHub
 *     `files[].patch`, GitLab `diff`) — an `@@ -a,b +c,d @@` hunk stream.
 *   - `diffText` computes a unified diff between two strings locally (LCS over
 *     lines) — for in-session working changes, where we hold BOTH sides
 *     (current `pages[]` vs the previous revision) and no provider patch exists.
 */

export interface DiffLine {
  /** `hunk` = an `@@ … @@` header row; `add`/`del`/`ctx` = content rows. */
  type: 'add' | 'del' | 'ctx' | 'hunk';
  text: string;
  /** Line number in the OLD file (null for adds / hunk headers). */
  oldNo: number | null;
  /** Line number in the NEW file (null for deletes / hunk headers). */
  newNo: number | null;
}

/** Parse an `@@ -oldStart,oldLen +newStart,newLen @@` header. */
function parseHunkHeader(line: string): { oldNo: number; newNo: number } | null {
  const m = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/.exec(line);
  if (!m) return null;
  return { oldNo: Number(m[1]), newNo: Number(m[2]) };
}

/**
 * Parse a single-file unified patch into renderable lines. Tolerant: leading
 * `diff --git` / `index` / `---` / `+++` file headers are skipped; `\ No newline`
 * markers are dropped. Returns [] for an empty/absent patch.
 */
export function parseUnifiedPatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const out: DiffLine[] = [];
  let oldNo = 0;
  let newNo = 0;
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('@@')) {
      const h = parseHunkHeader(raw);
      if (h) {
        oldNo = h.oldNo;
        newNo = h.newNo;
      }
      out.push({ type: 'hunk', text: raw, oldNo: null, newNo: null });
      continue;
    }
    // Skip git file-header noise that can precede the first hunk.
    if (
      raw.startsWith('diff --git') ||
      raw.startsWith('index ') ||
      raw.startsWith('--- ') ||
      raw.startsWith('+++ ') ||
      raw.startsWith('new file') ||
      raw.startsWith('deleted file') ||
      raw.startsWith('rename ') ||
      raw.startsWith('similarity ') ||
      raw.startsWith('\\')
    ) {
      continue;
    }
    const marker = raw[0];
    const text = raw.slice(1);
    if (marker === '+') {
      out.push({ type: 'add', text, oldNo: null, newNo: newNo++ });
    } else if (marker === '-') {
      out.push({ type: 'del', text, oldNo: oldNo++, newNo: null });
    } else if (marker === ' ' || raw === '') {
      out.push({ type: 'ctx', text, oldNo: oldNo++, newNo: newNo++ });
    }
    // any other prefix (e.g. a stray header) is ignored
  }
  return out;
}

/** Longest-common-subsequence table over two line arrays (row-compressed). */
function lcsLines(a: string[], b: string[]): number[][] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

/**
 * Compute a unified diff between two texts as `DiffLine[]` (LCS over lines). Used
 * for in-session working changes where we hold both sides. Bounded: very large
 * inputs are compared but the O(n·m) table is capped by `maxLines` per side to
 * stay cheap (beyond that we fall back to a whole-file replace).
 */
export function diffText(oldText: string, newText: string, maxLines = 4000): DiffLine[] {
  // An empty side is ZERO lines (a whole-file add/delete), not one blank line.
  const a = oldText ? oldText.split('\n') : [];
  const b = newText ? newText.split('\n') : [];
  if (a.length > maxLines || b.length > maxLines) {
    const out: DiffLine[] = [{ type: 'hunk', text: '@@ file changed @@', oldNo: null, newNo: null }];
    a.forEach((t, i) => out.push({ type: 'del', text: t, oldNo: i + 1, newNo: null }));
    b.forEach((t, i) => out.push({ type: 'add', text: t, oldNo: null, newNo: i + 1 }));
    return out;
  }

  const dp = lcsLines(a, b);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let oldNo = 1;
  let newNo = 1;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: 'ctx', text: a[i], oldNo: oldNo++, newNo: newNo++ });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i], oldNo: oldNo++, newNo: null });
      i++;
    } else {
      out.push({ type: 'add', text: b[j], oldNo: null, newNo: newNo++ });
      j++;
    }
  }
  while (i < a.length) out.push({ type: 'del', text: a[i++], oldNo: oldNo++, newNo: null });
  while (j < b.length) out.push({ type: 'add', text: b[j++], oldNo: null, newNo: newNo++ });
  return out;
}

/** Count added / removed lines in a parsed diff (for the file-card badge). */
export function diffStat(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const l of lines) {
    if (l.type === 'add') added++;
    else if (l.type === 'del') removed++;
  }
  return { added, removed };
}
