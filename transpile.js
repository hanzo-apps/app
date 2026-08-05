const path = require('node:path');

// The ONE answer to "which packages make up @hanzo/gui": the TRANSITIVE closure
// over its dependency graph — 99 packages, not the 63 it names directly.
// @hanzogui/web is the one that proves it matters: nothing depends on it at the
// top level, `@hanzogui/spacer` reaches it, and it is also the package whose
// duplicated module state throws "Missing theme."
//
// Walked from the package manifests rather than read off disk: under pnpm,
// `node_modules/@hanzogui` holds only what this app depends on DIRECTLY (two
// packages), so a directory listing silently misses the other 97. Reading the
// `.pnpm` store instead trades that for a different bug — it enumerates every
// version ever installed, including packages nothing in this app can reach.
//
// Seeded from EVERY @hanzo/* and @hanzogui/* package this app DECLARES, not
// from @hanzo/gui alone. @hanzo/ui renders Tamagui too, and `@hanzo/ui`'s
// gui-config entry reaches `@hanzogui/config` -> `@hanzogui/themes` — neither of
// which is a dependency of @hanzo/gui. Seeding from gui alone left those two
// untransformed, and jest died on `export * from "@hanzogui/themes/v5"` in every
// suite that renders a real @hanzo/ui component.
//
// Missing one does not fail loudly in Next either — `next build` prerendering
// the page dies in Tamagui's useMedia with "Cannot create proxy with a
// non-object as target or handler", because its ESM never became something the
// server bundle could evaluate.
//
// Three consumers read this set and must never disagree: Next's
// transpilePackages, Next's resolve.alias (one physical copy per package), and
// the jest runtime's transformIgnorePatterns.
const APP_MANIFEST = path.join(__dirname, 'package.json');

function guiRoots() {
  const { dependencies = {}, devDependencies = {} } = require(APP_MANIFEST);
  return Object.keys({ ...dependencies, ...devDependencies }).filter(
    (name) => name.startsWith('@hanzo/') || name.startsWith('@hanzogui/'),
  );
}

function guiClosure() {
  const seen = new Set();
  const walk = (name, from) => {
    let manifest;
    try {
      manifest = require.resolve(`${name}/package.json`, { paths: [from] });
    } catch {
      return; // optional/unresolvable edge — nothing to transform
    }
    if (seen.has(name)) return;
    seen.add(name);
    for (const dep of Object.keys(require(manifest).dependencies || {})) {
      if (dep.startsWith('@hanzogui/')) walk(dep, manifest);
    }
  };
  for (const root of guiRoots()) walk(root, APP_MANIFEST);
  return [...seen].filter((name) => name.startsWith('@hanzogui/'));
}

// Everything Next and jest must transform before this app can use it.
//
// Group one: @hanzo/gui and @hanzo/ui (Tamagui) ship per-package uncompiled ESM,
// so the whole closure above has to be transformed too — untransformed,
// `@hanzogui/web` hands jest a bare `export *` that fails 18 suites.
//
// Group two: deps that ship ESM only. Next copes either way; a CJS consumer
// (jest) is handed a bare `export {}` unless they are transformed. @hanzo/base
// needs BOTH halves: this list is its transform half, and jest.config's
// moduleNameMapper is its resolution half, because its exports map offers no
// `require` condition for Jest's CJS resolver to take.
function transpiled() {
  return [
    '@hanzo/gui',
    '@hanzo/ui',
    '@hanzo/usage',
    '@hanzo/brand',
    '@hanzo/base',
    // `@hanzo/ui/product` re-exports the design tokens and tag tones from
    // @hanzo/data, whose exports map points at `src/index.ts` — TypeScript
    // SOURCE, not a build. So the first app file to import from `product` takes
    // the whole webpack build down with "Module parse failed: Unexpected token"
    // on an `export type` block. It is a peer of @hanzo/ui here, not a package
    // this app imports by name.
    '@hanzo/data',
    // gui 8 dropped its own react-native-web dependency, so this app declares
    // it and the `react-native$` alias points the gui graph at that one copy.
    'react-native-web',
    // Every @hanzogui/* this app can reach, including the ones it declares
    // directly (@hanzogui/shell, @hanzogui/telemetry, @hanzogui/config): they
    // are roots of the walk, so naming them again here would only duplicate
    // entries in transpilePackages and in the transformIgnorePatterns regex.
    ...guiClosure(),
    // ESM-only
    'jose',
    'uuid',
  ];
}

module.exports = { transpiled, guiClosure };
