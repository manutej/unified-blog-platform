import nextJest from 'next/jest.js';

/**
 * Jest configuration for the Unified Blog System.
 *
 * Uses `next/jest` so that test files are transformed with the same SWC
 * pipeline Next.js uses for the app (TypeScript + JSX, the `@/*` path alias,
 * CSS module mocking, etc.) with no separate Babel setup required.
 *
 * The Playwright visual specs under `test-screenshots/` are intentionally
 * excluded here: they are end-to-end browser tests run by `npm run test:visual`
 * (Playwright), not unit tests, and must not be picked up by Jest.
 */
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Only treat files under __tests__/ as unit tests.
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // Never let Jest wander into the Playwright e2e specs or build output.
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/test-screenshots/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
