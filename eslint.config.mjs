// eslint-config-next 16 ships NATIVE flat configs (`module.exports` IS the
// config array), so they are spread straight in. The `FlatCompat` shim that used
// to wrap them is gone: it pulled in `@eslint/eslintrc`, whose
// `override-tester.js` does `import minimatch from "minimatch"` — a default
// import that minimatch 10 (ESM, named exports only) does not provide. This
// repo's `minimatch: ">=3.1.4"` pnpm override forces exactly that version, so
// `pnpm lint` crashed before it reached a single file. One less dependency, and
// a flat config has no use for a legacy-config bridge anyway.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  // `.claude/**` holds nested git worktrees with their own node_modules and
  // their own (legacy) eslint configs — lint each checkout from its own root,
  // never through this one.
  { ignores: ['.next/**', 'public/**', 'coverage/**', '.claude/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
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
