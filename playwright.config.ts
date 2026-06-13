import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the visual regression specs.
 *
 * The visual specs live under `test-screenshots/` and capture the deployed
 * blog pages. They require browsers to be installed first:
 *
 *   npx playwright install --with-deps chromium
 *
 * Run them with `npm run test:visual`. These are end-to-end browser tests and
 * are deliberately kept out of the Jest unit-test run (see jest.config.js).
 */
export default defineConfig({
  testDir: './test-screenshots',
  testMatch: '**/*.spec.ts',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
