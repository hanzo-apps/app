const nextJest = require('next/jest');
const { transpiled } = require('./transpile');

// Which node_modules the CJS test runtime must transform: exactly what Next
// transpiles. Both read `./transpile`, so the build and the tests can never
// disagree about what needs transforming.
//
// Two shapes because pnpm stores a package twice: `.pnpm/<name>@<version>/`
// with `/` flattened to `+`, and the plain `node_modules/<name>/` symlink.
const TRANSFORMED = transpiled();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const transformIgnorePatterns = [
  `/node_modules/\\.pnpm/(?!(?:${TRANSFORMED.map((n) => escape(n.replace('/', '+'))).join('|')})@)`,
  `/node_modules/(?!\\.pnpm/)(?!(?:${TRANSFORMED.map(escape).join('|')})[/@])`,
  '^.+\\.module\\.(css|sass|scss)$',
];

// Create Jest configuration with Next.js
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/tests/**/*.spec.tsx',
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '/playwright/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // @hanzo/base is `"type": "module"` and its exports map offers only `import`
    // — no `require` — so Jest's CJS resolver finds no condition it can take and
    // reports "Cannot find module" for a package that is installed and correct.
    // Naming the entry directly is the resolution half; `transpile.js` carries
    // the transform half, so Next and the tests still agree on one list.
    '^@hanzo/base$': '<rootDir>/node_modules/@hanzo/base/dist/core/index.js',
    // The same substrate the build resolves. `next.config.ts` aliases
    // `react-native$` to react-native-web because @hanzo/gui targets react-native
    // and this is the web; a test that resolves the real package instead reads
    // Flow syntax (`import typeof`) that no transform here accepts. Exact match,
    // as it is there, so subpaths still reach the real package.
    '^react-native$': 'react-native-web',
    // Named explicitly, because the extension patterns below must not be what
    // does it: `react-native-svg` ends in `-svg`, and while those patterns had
    // an unescaped dot they matched this package and mapped it to the FILE mock
    // — the string 'test-file-stub' — so every icon component was `undefined`
    // and the whole react-native chain simply never loaded. See the mock.
    '^react-native-svg$': '<rootDir>/mocks/react-native-svg.js',
    // The dot is ESCAPED, and that is the whole point: these keys are regex
    // sources in a JS string, where '\.' collapses to '.' — the wildcard — so
    // the pattern reads "any character, then css" and matches a PACKAGE whose
    // name merely ends that way. `@hanzogui/animations-css` resolved to the
    // empty style mock, which took `createAnimations` with it and killed 19
    // suites at import. A stylesheet is named by its extension; only a literal
    // dot says so.
    '\\.(css|less|scss|sass)$': '<rootDir>/mocks/style-mock.js',
    '\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/mocks/file-mock.js',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/playwright/**',
    '!**/e2e/**',
  ],
  coverageThreshold: {
    global: {
      statements: 4,
      branches: 3,
      functions: 2,
      lines: 4,
    },
  },
  testTimeout: 30000,
  transformIgnorePatterns,
  projects: [
    {
      displayName: 'unit',
      // Colocated `__tests__` count too. They did not until now: everything
      // under lib/ matched no project and so ran nowhere, which is worse than
      // having no test at all — it reads as covered.
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/{lib,hooks,components}/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
      ],
      // jsdom, plus the fetch classes jsdom omits — see jest.env.jsdom.js.
      testEnvironment: '<rootDir>/jest.env.jsdom.js',
      // A project inherits NOTHING from the root config — it IS a config — so
      // the jsdom polyfills have to be named here or they run nowhere.
      setupFiles: ['<rootDir>/jest.setup.jsdom.js'],
      // Same non-inheritance, second casualty: without this, jsdom resolves
      // packages through their `browser` export condition and hands jest ESM
      // it cannot parse (@hanzogui/telemetry's env.mjs, import.meta). Jest
      // executes CJS, so it must ask for CJS.
      testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
    },
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)();
  nextJestConfig.transformIgnorePatterns = transformIgnorePatterns;

  // Ensure transform is applied to all projects
  if (nextJestConfig.projects) {
    nextJestConfig.projects = nextJestConfig.projects.map(project => ({
      ...project,
      transform: nextJestConfig.transform,
      transformIgnorePatterns: nextJestConfig.transformIgnorePatterns,
      moduleNameMapper: {
        ...nextJestConfig.moduleNameMapper,
        ...project.moduleNameMapper,
      },
    }));
  }

  return nextJestConfig;
};