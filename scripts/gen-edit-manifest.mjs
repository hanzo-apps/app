/*
 * gen-edit-manifest — emit public/edit-manifest.json: the App-Router
 * route → source-file map the Hanzo Edit widget (public/edit.js) uses to
 * auto-resolve which file backs the current view, so a contributor never
 * hand-types a path.
 *
 * This is the RELIABLE signal: the mapping is derived from the same
 * filesystem convention Next itself routes on (page.tsx under app/, route
 * groups (x) path-transparent, [seg]/[...seg]/[[...seg]] dynamic), so it is
 * exact by construction — not a heuristic. Runs in `prebuild`/`predev` (npm
 * pre-hooks), no deps, so `next build --webpack` stays the known-good recipe.
 *
 * Absent manifest → the widget degrades to a convention guess; present
 * manifest → precise, ranked candidates. One source of truth: repo/branch are
 * read from app/layout.tsx's metadata, version from package.json.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'app');
const OUT = join(ROOT, 'public', 'edit-manifest.json');

const PAGE = /^page\.(tsx|jsx|ts|js)$/;
const LAYOUT = /^layout\.(tsx|jsx|ts|js)$/;

/** A path segment classified by the App-Router convention. */
function classify(dir) {
  const m1 = dir.match(/^\[\[\.\.\.(.+)\]\]$/); // [[...x]] optional catch-all
  if (m1) return { k: 'o', v: m1[1] };
  const m2 = dir.match(/^\[\.\.\.(.+)\]$/); // [...x] catch-all
  if (m2) return { k: 'c', v: m2[1] };
  const m3 = dir.match(/^\[(.+)\]$/); // [x] dynamic
  if (m3) return { k: 'd', v: m3[1] };
  if (/^\(.+\)$/.test(dir)) return { k: 'g', v: dir.slice(1, -1) }; // (x) route group — URL-transparent
  return { k: 's', v: dir };
}

/** Repo-relative POSIX path (github blob paths are always forward-slash). */
function rel(abs) {
  return relative(ROOT, abs).split('\\').join('/');
}

/** Walk app/ collecting every page and the set of dirs that own a layout. */
function walk(dir, pages, layoutDirs) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      walk(abs, pages, layoutDirs);
    } else if (PAGE.test(name)) {
      pages.push(abs);
    } else if (LAYOUT.test(name)) {
      layoutDirs.set(dirname(abs), rel(abs));
    }
  }
}

/** The layout chain for a page: every layout from app/ down to its own dir. */
function layoutsFor(pageAbs, layoutDirs) {
  const out = [];
  let d = dirname(pageAbs);
  const chain = [];
  while (d.length >= APP.length) {
    chain.push(d);
    if (d === APP) break;
    d = dirname(d);
  }
  for (const dir of chain.reverse()) if (layoutDirs.has(dir)) out.push(layoutDirs.get(dir));
  return out;
}

function build() {
  const pages = [];
  const layoutDirs = new Map();
  walk(APP, pages, layoutDirs);

  const routes = [];
  for (const pageAbs of pages) {
    const segs = relative(APP, dirname(pageAbs)).split('/').filter(Boolean).map(classify);
    const urlSegs = segs.filter((s) => s.k !== 'g'); // groups don't affect the URL
    const pattern =
      '/' +
      urlSegs
        .map((s) => (s.k === 's' ? s.v : s.k === 'c' ? `[...${s.v}]` : s.k === 'o' ? `[[...${s.v}]]` : `[${s.v}]`))
        .join('/');
    routes.push({
      pattern: pattern === '/' ? '/' : pattern.replace(/\/$/, ''),
      segments: urlSegs,
      page: rel(pageAbs),
      layouts: layoutsFor(pageAbs, layoutDirs),
    });
  }
  routes.sort((a, b) => a.pattern.localeCompare(b.pattern));
  return routes;
}

function meta() {
  let version = null;
  try {
    version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version || null;
  } catch {}
  let repo = null;
  let branch = 'main';
  try {
    const layout = readFileSync(join(APP, 'layout.tsx'), 'utf8');
    repo = (layout.match(/["']hanzo:repo["']\s*:\s*["']([^"']+)["']/) || [])[1] || null;
    branch = (layout.match(/["']hanzo:branch["']\s*:\s*["']([^"']+)["']/) || [])[1] || branch;
  } catch {}
  return { version, repo, branch };
}

const { version, repo, branch } = meta();
const routes = build();
const manifest = { schema: 1, repo, branch, version, generatedAt: new Date().toISOString(), routes };

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest) + '\n');
console.log(`[gen-edit-manifest] ${routes.length} routes → ${rel(OUT)} (repo ${repo}, v${version})`);
