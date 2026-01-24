const nextJest = require('next/jest');

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
    '\.(css|less|scss|sass)$': '<rootDir>/mocks/style-mock.js',
    '\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/mocks/file-mock.js',
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
      statements: 5,
      branches: 4,
      functions: 3,
      lines: 5,
    },
  },
  testTimeout: 30000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-jsdom',
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