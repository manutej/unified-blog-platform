/**
 * Accessibility test for the Callout component.
 *
 * Named with the `a11y.test.tsx` suffix so it is picked up both by the default
 * `npm test` run and by `npm run test:a11y` (which filters to that suffix).
 */
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Callout, { type CalloutType } from '@/components/core/Callout';

describe('Callout accessibility', () => {
  const types: CalloutType[] = ['info', 'warning', 'success', 'error', 'tip'];

  it.each(types)('has no axe violations for the "%s" variant', async (type) => {
    const { container } = render(
      <Callout type={type} title="Heads up">
        <p>Body content for the callout.</p>
      </Callout>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
