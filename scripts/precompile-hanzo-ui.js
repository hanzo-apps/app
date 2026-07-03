#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const hanzoUiPath = path.resolve(__dirname, '../node_modules/@hanzo/ui');
const compiledPath = path.resolve(__dirname, '../node_modules/@hanzo/ui-compiled');

console.log('Pre-compiling @hanzo/ui package...');

// Check if already compiled
if (fs.existsSync(compiledPath)) {
  console.log('@hanzo/ui already pre-compiled, skipping...');
  process.exit(0);
}

// Copy the package
console.log('Copying @hanzo/ui package...');
execSync(`cp -r "${hanzoUiPath}" "${compiledPath}"`, { stdio: 'inherit' });

// Create a tsconfig for compilation
const tsConfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    jsx: 'react-jsx',
    declaration: true,
    declarationMap: false,
    outDir: './dist-compiled',
    rootDir: '.',
    removeComments: true,
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    moduleResolution: 'node',
    allowSyntheticDefaultImports: true,
    noEmit: false,
  },
  include: ['primitives/**/*', 'blocks/**/*', 'components/**/*', 'assets/**/*', 'types/**/*', 'util/**/*'],
  exclude: ['node_modules', 'dist', 'dist-compiled'],
};

fs.writeFileSync(
  path.join(compiledPath, 'tsconfig.compile.json'),
  JSON.stringify(tsConfig, null, 2)
);

// Compile TypeScript files
console.log('Compiling TypeScript files...');
try {
  execSync(
    `cd "${compiledPath}" && npx swc ./primitives ./blocks ./components ./assets ./types ./util -d ./dist-compiled --config-file false`,
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        SWC_NODE_PROJECT: path.join(compiledPath, 'tsconfig.compile.json'),
      }
    }
  );
} catch (error) {
  console.error('Failed to compile with SWC, trying TypeScript compiler...');
  execSync(
    `cd "${compiledPath}" && npx tsc -p tsconfig.compile.json`,
    { stdio: 'inherit' }
  );
}

// Update package.json exports to point to compiled files
const packageJson = JSON.parse(fs.readFileSync(path.join(compiledPath, 'package.json'), 'utf8'));

function updateExports(exports) {
  if (typeof exports === 'string') {
    return exports.replace(/\.(ts|tsx)$/, '.js').replace(/^\.\//, './dist-compiled/');
  } else if (typeof exports === 'object' && exports !== null) {
    const updated = {};
    for (const key in exports) {
      updated[key] = updateExports(exports[key]);
    }
    return updated;
  }
  return exports;
}

packageJson.exports = updateExports(packageJson.exports);
packageJson.main = './dist-compiled/primitives/index-common.js';
packageJson.module = './dist-compiled/primitives/index-next.js';

fs.writeFileSync(
  path.join(compiledPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('Pre-compilation complete!');
console.log('Update your imports to use @hanzo/ui-compiled instead of @hanzo/ui');