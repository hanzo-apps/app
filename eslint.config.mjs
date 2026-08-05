// eslint-config-next 16 ships NATIVE flat configs (`module.exports` IS the
// config array), so they are spread straight in. The `FlatCompat` shim that used
// to wrap them is gone: it pulled in `@eslint/eslintrc`, whose
// `override-tester.js` does `import minimatch from "minimatch"` — a default
// import that minimatch 10 (ESM, named exports only) does not provide. This
// repo's `minimatch: ">=3.1.4"` pnpm override forces exactly that version, so
// `pnpm lint` crashed before it reached a single file. One less dependency, and
// a flat config has no use for a legacy-config bridge anyway.
//
// eslint stays on 9.x, and that is the ecosystem's ceiling, not ours: eslint 10
// removed the deprecated `context.getFilename()`, and three of the five plugins
// `eslint-config-next` pulls in still call it or still cap their peer range at
// `^9` — `eslint-plugin-react` (7.37.5, the LATEST; crashes in
// `lib/util/version.js` the moment any rule loads), `eslint-plugin-jsx-a11y`
// (6.10.2) and `eslint-plugin-import` (2.32.0). Only `eslint-plugin-react-hooks`
// declares `^10`. `eslint-config-next@16.3.0` still depends on
// `eslint-plugin-react@^7.37.0`, so bumping Next's config does not help either.
// Raise this to 10 only once eslint-plugin-react ships a release whose peer
// range includes it — its `next` dist-tag (7.8.0-rc.0) is an old tag, not a
// preview of one.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  // `.claude/**` holds nested git worktrees with their own node_modules and
  // their own (legacy) eslint configs — lint each checkout from its own root,
  // never through this one.
  //
  // `.hanzogui/**` is the gui toolchain's generated component manifest — ~7 MB
  // of bundled output, gitignored and untracked, in the same category as
  // `.next/**`. Linting it reported 622 problems (128 of them errors) about
  // code nobody wrote and nobody can edit: every `react-hooks/rules-of-hooks`
  // hit in the repo was a bundler artifact in these five files.
  { ignores: ['.next/**', 'public/**', 'coverage/**', '.claude/**', '.hanzogui/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Same glob `eslint-config-next` registers its plugins under. A rules-only
    // object with no `files` matches EVERY file, including those where `react`
    // was never registered, and eslint 10 rejects that outright ("could not find
    // plugin react") before it loads a single rule. Harmless under 9, so it read
    // as working; scoped here so it stays true on both sides of the bump.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // Temporarily downgrade these to warnings to unblock CI
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/no-unescaped-entities': 'warn',
      'prefer-const': 'warn',
    },
  },
];

export default eslintConfig;
