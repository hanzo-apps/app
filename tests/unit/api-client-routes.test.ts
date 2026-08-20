/**
 * The browser client has to reach a route that exists.
 *
 * `lib/api.ts` prefixed every call with `/api` while the routes it names live
 * under `app/v1` — so save, autosave and project load all 404'd, and the
 * builder just said "Not saved — retrying" forever. Nothing was red: the
 * client's own doc comment said `/v1`, the routes were present, and only the
 * one template literal disagreed.
 *
 * Reading the prefix alone would not have caught it, because the same mistake
 * spelled `/v2` would pass. So this walks from each call site to a route file
 * on disk: the destination exists or it does not.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from 'path';

import { root, sources } from "../source";


/** `/me/projects/${ns}/${repo}` -> the segments, with holes marked. */
function segments(path: string): string[] {
  return path.replace(/^\//, '').split('/').filter(Boolean);
}

/** Does `app/v1/<segments>/route.ts` exist, allowing [dynamic] segments to absorb `${…}`? */
function routeExists(segs: string[], at = join(root, 'app', 'v1')): boolean {
  if (!segs.length) return existsSync(join(at, 'route.ts'));
  const [head, ...rest] = segs;
  if (!existsSync(at)) return false;
  const literal = join(at, head);
  if (!head.includes('${') && existsSync(literal) && routeExists(rest, literal)) return true;
  // a hole — or a literal with no folder — may still be served by a dynamic segment
  for (const name of readdirSync(at)) {
    if (!name.startsWith('[')) continue;
    if (routeExists(rest, join(at, name))) return true;
  }
  return false;
}

describe('the same-origin api client', () => {
  const client = readFileSync(join(root, 'lib', 'api.ts'), 'utf8');

  it('sends to /v1, the surface this app actually serves', () => {
    expect(client).toContain('fetch(`/v1${path}`');
    expect(client).not.toContain('`/api${path}`');
  });

  it('names only paths that have a route on disk', () => {
    const calls: { file: string; path: string }[] = [];
    for (const file of sources(['components', 'hooks'], /\.tsx?$/)) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/\bapi\.(?:get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g)) {
        calls.push({ file: file.slice(root.length + 1), path: m[1] });
      }
    }
    // The scan has to find the real call sites, or it proves nothing.
    expect(calls.length).toBeGreaterThan(0);

    const missing = calls.filter((c) => !routeExists(segments(c.path)));
    expect(missing.map((m) => `${m.file}: ${m.path}`)).toEqual([]);
  });
});
