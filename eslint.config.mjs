import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * ESLint flat config (ESLint 9 + Next.js 16).
 *
 * Next.js 16 removed the `next lint` command, so linting now runs through the
 * ESLint CLI directly (see the `lint` script in package.json). This composes
 * the official Next.js core-web-vitals and TypeScript rule sets.
 */
export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'test-screenshots/**',
    ],
  },
];
