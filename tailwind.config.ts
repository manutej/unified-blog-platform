import type { Config } from 'tailwindcss';
import { designTokens } from './lib/design-tokens';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './plugins/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage: designTokens.colors.sage,
        magician: designTokens.colors.magician,
        explorer: designTokens.colors.explorer,
        neutral: designTokens.colors.neutral,
      },
      fontSize: designTokens.typography.scale,
      fontWeight: designTokens.typography.weights,
      lineHeight: designTokens.typography.lineHeights,
      spacing: designTokens.spacing,
      boxShadow: designTokens.shadows,
      borderRadius: designTokens.radius,
      fontFamily: {
        sans: ['var(--font-inter)', ...designTokens.typography.families.sans.split(', ')],
        mono: designTokens.typography.families.mono.split(', '),
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        slower: '500ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
