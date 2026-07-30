const fs = require('node:fs');
const path = require('node:path');

// The ONE list of node_modules that must be transformed before this app can use
// them. Two consumers read it — Next (transpilePackages) and the jest runtime
// (next/jest transformIgnorePatterns) — and they must never disagree, so it
// lives here rather than in either config.
//
// Group one: @hanzo/gui and @hanzo/ui (Tamagui) ship per-package uncompiled ESM,
// so every @hanzogui/* they pull has to be transpiled too. The set is READ from
// disk, not hardcoded: it runs to ~113 packages and moves with the version, and a
// hand-kept copy rots into build errors that look like the app's fault.
//
// Read BOTH layouts. pnpm only hoists what something at the root imports by name
// — here that is 3 of 116 — while the rest live in `.pnpm/@hanzogui+<name>@<ver>`
// and are reached through the package that depends on them. Reading only the
// hoisted directory therefore silently returned 3, left 113 Tamagui packages
// untransformed, and the failure surfaced far from the cause: `next build`
// prerendering ANY page died in Tamagui's useMedia with "Cannot create proxy with
// a non-object as target or handler", because its ESM never became something the
// server bundle could evaluate.
//
// Group two: deps that ship ESM only. Next copes either way; a CJS consumer
// (jest) is handed a bare `export {}` unless they are transformed.
function transpiled() {
  const scoped = new Set();

  // Hoisted layout (npm/yarn, and whatever pnpm did hoist).
  try {
    for (const name of fs.readdirSync(path.join(__dirname, 'node_modules', '@hanzogui'))) {
      scoped.add(`@hanzogui/${name}`);
    }
  } catch {
    /* not present in this layout */
  }

  // pnpm store: `@hanzogui+<name>@<version>[_<peerhash>]`. Take the name between
  // the `+` and the version's `@`, so a scoped package with a hash suffix still
  // yields the plain name Next matches against.
  try {
    for (const entry of fs.readdirSync(path.join(__dirname, 'node_modules', '.pnpm'))) {
      if (!entry.startsWith('@hanzogui+')) continue;
      const name = entry.slice('@hanzogui+'.length).split('@')[0];
      if (name) scoped.add(`@hanzogui/${name}`);
    }
  } catch {
    /* not a pnpm layout */
  }

  return [
    '@hanzo/gui',
    '@hanzo/ui',
    '@hanzo/usage',
    '@hanzo/brand',
    'react-native-web',
    ...[...scoped].sort(),
    'jose',
    'uuid',
  ];
}

module.exports = { transpiled };
