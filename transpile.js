const fs = require('node:fs');
const path = require('node:path');

// The ONE list of node_modules that must be transformed before this app can use
// them. Two consumers read it — Next (transpilePackages) and the jest runtime
// (next/jest transformIgnorePatterns) — and they must never disagree, so it
// lives here rather than in either config.
//
// Group one: @hanzo/gui (Tamagui) ships per-package uncompiled ESM, so every
// @hanzogui/* it pulls has to be transpiled too. The set is READ from disk, not
// hardcoded: it runs to ~113 packages and moves with the gui version, and a
// hand-kept copy rots into build errors that look like the app's fault.
//
// Group two: deps that ship ESM only. Next copes either way; a CJS consumer
// (jest) is handed a bare `export {}` unless they are transformed.
function transpiled() {
  let scoped = [];
  try {
    const dir = path.join(__dirname, 'node_modules', '@hanzogui');
    scoped = fs.readdirSync(dir).map((name) => `@hanzogui/${name}`);
  } catch {
    scoped = [];
  }
  return [
    '@hanzo/gui',
    '@hanzo/usage',
    '@hanzo/brand',
    'react-native-web',
    ...scoped,
    'jose',
    'uuid',
  ];
}

module.exports = { transpiled };
