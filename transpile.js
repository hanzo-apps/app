const path = require('node:path');

// The ONE answer to "which packages make up @hanzo/gui": the TRANSITIVE closure
// over its dependency graph — 99 packages, not the 63 it names directly.
// @hanzogui/web is the one that proves it matters: nothing depends on it at the
// top level, `@hanzogui/spacer` reaches it, and it is also the package whose
// duplicated module state throws "Missing theme."
//
// Walked from the package manifests rather than read off disk: under pnpm,
// `node_modules/@hanzogui` holds only what this app depends on DIRECTLY (two
// packages), so a directory listing silently misses the other 97.
//
// Three consumers read this set and must never disagree: Next's
// transpilePackages, Next's resolve.alias (one physical copy per package), and
// the jest runtime's transformIgnorePatterns.
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
  walk('@hanzo/gui', path.join(__dirname, 'package.json'));
  return [...seen].filter((name) => name.startsWith('@hanzogui/'));
}

// Everything Next and jest must transform before this app can use it.
//
// Group one: @hanzo/gui (Tamagui) ships per-package uncompiled ESM, so the whole
// closure above has to be transformed too — untransformed, `@hanzogui/web`
// hands jest a bare `export *` that fails 18 suites.
//
// Group two: deps that ship ESM only. Next copes either way; a CJS consumer
// (jest) is handed a bare `export {}` unless they are transformed.
function transpiled() {
  return [
    '@hanzo/gui',
    '@hanzo/usage',
    '@hanzo/brand',
    // Ships compiled dist; transpiled anyway so every gui-adjacent package is
    // handled uniformly, and a future source-shipping release needs no edit.
    '@hanzogui/shell',
    '@hanzogui/telemetry',
    // gui 8 dropped its own react-native-web dependency, so this app declares
    // it and the `react-native$` alias points the gui graph at that one copy.
    'react-native-web',
    ...guiClosure(),
    // ESM-only
    'jose',
    'uuid',
  ];
}

module.exports = { transpiled, guiClosure };
