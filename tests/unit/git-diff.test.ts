/**
 * Diff primitives (lib/git/diff) — the revision Details view's red/green source.
 * Pure functions: parse a provider patch, and compute a local diff for in-session
 * working changes. No network, no deps.
 */
import { parseUnifiedPatch, diffText, diffStat } from '@/lib/git/diff';

describe('parseUnifiedPatch', () => {
  it('tracks old/new line numbers across a hunk and skips file headers', () => {
    const patch =
      'diff --git a/index.html b/index.html\n' +
      'index 111..222 100644\n' +
      '--- a/index.html\n' +
      '+++ b/index.html\n' +
      '@@ -1,3 +1,3 @@\n' +
      ' <html>\n' +
      '-  <h1>old</h1>\n' +
      '+  <h1>new</h1>\n' +
      ' </html>';
    const lines = parseUnifiedPatch(patch);
    expect(lines.map((l) => l.type)).toEqual(['hunk', 'ctx', 'del', 'add', 'ctx']);
    const del = lines.find((l) => l.type === 'del')!;
    const add = lines.find((l) => l.type === 'add')!;
    expect(del).toMatchObject({ text: '  <h1>old</h1>', oldNo: 2, newNo: null });
    expect(add).toMatchObject({ text: '  <h1>new</h1>', oldNo: null, newNo: 2 });
    expect(diffStat(lines)).toEqual({ added: 1, removed: 1 });
  });

  it('returns [] for an empty patch', () => {
    expect(parseUnifiedPatch('')).toEqual([]);
  });
});

describe('diffText — local LCS diff for working changes', () => {
  it('marks changed lines add/del and keeps common lines as context', () => {
    const before = 'a\nb\nc';
    const after = 'a\nB\nc';
    const lines = diffText(before, after);
    const kinds = lines.map((l) => l.type);
    expect(kinds).toContain('del');
    expect(kinds).toContain('add');
    // 'a' and 'c' survive as context
    expect(lines.filter((l) => l.type === 'ctx').map((l) => l.text)).toEqual(['a', 'c']);
    expect(diffStat(lines)).toEqual({ added: 1, removed: 1 });
  });

  it('all-adds when the old text is empty', () => {
    const lines = diffText('', 'x\ny');
    expect(diffStat(lines)).toEqual({ added: 2, removed: 0 });
  });
});
