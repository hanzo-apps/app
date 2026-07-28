// The version has ONE source. This test is what keeps it that way.
//
// It failed before `lib/version.ts` existed: five surfaces answered "what version
// is this?" independently — the sidebar and dashboard imported package.json, the
// About dialog preferred `NEXT_PUBLIC_APP_VERSION` and only fell back to
// package.json (so it could legally show a number nothing else showed), telemetry
// wrapped package.json in its own accessor, and the admin route re-read
// package.json off disk at request time.
//
// A constant is not worth a test. A RULE is: nobody may read the version from
// anywhere but `lib/version.ts`. That is what is asserted here, over the source
// tree, so the next person who reaches for `import pkg from '@/package.json'`
// finds out in CI instead of in production.

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { VERSION } from '@/lib/version';

const ROOT = path.resolve(__dirname, '../..');

/** Tracked source files, so build output and dependencies never enter the scan. */
function sources(): string[] {
  return execFileSync('git', ['ls-files', '--', '*.ts', '*.tsx'], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024,
  })
    .split('\n')
    .filter(Boolean);
}

function grep(pattern: RegExp, allow: string[]): string[] {
  const hits: string[] = [];
  for (const file of sources()) {
    if (allow.includes(file)) continue;
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue; // deleted but still indexed
    if (pattern.test(fs.readFileSync(full, 'utf-8'))) hits.push(file);
  }
  return hits;
}

describe('the version has one source', () => {
  it('is package.json, read once', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../package.json');
    expect(VERSION).toBe(pkg.version);
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('is imported from nowhere else', () => {
    // Any module reaching into package.json for itself. `lib/version.ts` is the
    // one place allowed to; `tests/unit/version.test.ts` reads it to check.
    const offenders = grep(/from ['"][^'"]*package\.json['"]|require\((['"])[^'"]*package\.json\1\)/, [
      'lib/version.ts',
      'tests/unit/version.test.ts',
    ]);
    expect(offenders).toEqual([]);
  });

  it('is never overridden by an environment variable', () => {
    // A build-time env override is a SECOND source: it makes one surface capable
    // of reporting a version no other surface can. Deployment is gated by tests,
    // not by env branching.
    const offenders = grep(/NEXT_PUBLIC_APP_VERSION/, ['tests/unit/version.test.ts']);
    expect(offenders).toEqual([]);
  });
});
