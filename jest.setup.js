// Jest setup: extends `expect` with jest-dom and jest-axe matchers.
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
