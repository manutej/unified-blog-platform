/**
 * Unified Design Tokens
 * LibreUIUX Seven Pillars Compliance - Educational Authority Archetype
 *
 * @pillar Beautiful (Pillar 2)
 * @archetype Sage (primary) + Magician (secondary) + Explorer (supporting)
 */

export const designTokens = {
  /**
   * Typography Scale - Major Third (1.25 ratio)
   * Harmonious progression for visual hierarchy
   */
  typography: {
    scale: {
      xs: '0.75rem',        // 12px
      sm: '0.875rem',       // 14px
      base: '1rem',         // 16px - STANDARD body text
      lg: '1.125rem',       // 18px
      xl: '1.25rem',        // 20px - Small headings
      '2xl': '1.5rem',      // 24px - H3
      '3xl': '1.875rem',    // 30px - H2
      '4xl': '2.25rem',     // 36px - H1
      '5xl': '3rem',        // 48px - Hero
      '6xl': '3.75rem',     // 60px - Display
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeights: {
      tight: 1.1,           // Headings, display text
      normal: 1.5,          // Body text
      relaxed: 1.75,        // Long-form content
    },
    families: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Fira Code", "Consolas", "Monaco", monospace',
    },
  },

  /**
   * Spacing System - 8px Baseline Grid
   * Systematic spacing for rhythm and consistency
   */
  spacing: {
    0: '0',
    1: '0.25rem',         // 4px (half base unit)
    2: '0.5rem',          // 8px (BASE UNIT)
    3: '0.75rem',         // 12px
    4: '1rem',            // 16px
    6: '1.5rem',          // 24px - STANDARD card padding
    8: '2rem',            // 32px
    12: '3rem',           // 48px
    16: '4rem',           // 64px - STANDARD section padding
    24: '6rem',           // 96px
    32: '8rem',           // 128px
  },

  /**
   * Color System - Educational Authority Archetype
   * 60% neutral (calm foundation) + 30% domain accent (identity) + 10% action (emphasis)
   */
  colors: {
    // Sage Archetype - Trust, Knowledge, Wisdom
    sage: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',       // PRIMARY - Trust, Knowledge
      600: '#2563eb',       // HOVER state
      700: '#1d4ed8',
      800: '#1e40af',       // DARK variant
      900: '#1e3a8a',
    },

    // Magician Archetype - Transformation, Empowerment
    magician: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',       // Transformation
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },

    // Explorer Archetype - Discovery, Possibility
    explorer: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',       // Discovery
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },

    // Neutral Grays - 60% of color usage (calm foundation)
    neutral: {
      50: '#f9fafb',        // Backgrounds (light mode)
      100: '#f3f4f6',
      200: '#e5e7eb',       // Borders (light mode)
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',       // Text secondary
      600: '#4b5563',       // Text primary (light mode)
      700: '#374151',       // Borders (dark mode)
      800: '#1f2937',       // Backgrounds (dark mode)
      900: '#111827',       // Text primary (dark mode)
    },

    // Semantic Colors
    success: {
      light: '#d1fae5',
      DEFAULT: '#10b981',   // emerald-500
      dark: '#065f46',
    },
    warning: {
      light: '#fef3c7',
      DEFAULT: '#f59e0b',   // amber-500
      dark: '#92400e',
    },
    error: {
      light: '#fee2e2',
      DEFAULT: '#ef4444',   // red-500
      dark: '#991b1b',
    },
    info: {
      light: '#dbeafe',
      DEFAULT: '#3b82f6',   // blue-500
      dark: '#1e40af',
    },
  },

  /**
   * Shadows - Depth Hierarchy
   * Subtle elevation for visual hierarchy
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  /**
   * Border Radius - Modern, Friendly
   */
  radius: {
    none: '0',
    sm: '0.125rem',       // 2px
    md: '0.375rem',       // 6px
    lg: '0.5rem',         // 8px
    xl: '0.75rem',        // 12px
    '2xl': '1rem',        // 16px - STANDARD for cards
    '3xl': '1.5rem',      // 24px
    full: '9999px',       // Circles, pills
  },

  /**
   * Transitions - Smooth, Responsive
   */
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  /**
   * Breakpoints - Mobile-First Responsive
   */
  breakpoints: {
    sm: '640px',          // Mobile landscape
    md: '768px',          // Tablet
    lg: '1024px',         // Desktop
    xl: '1280px',         // Wide desktop
    '2xl': '1536px',      // Ultra-wide
  },

  /**
   * Z-Index Scale - Layering System
   */
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },
} as const;

/**
 * WCAG 2.1 AA Compliant Color Combinations
 * Minimum 4.5:1 contrast ratio for text
 */
export const accessibleCombinations = {
  light: {
    background: designTokens.colors.neutral[50],
    text: designTokens.colors.neutral[900],
    textSecondary: designTokens.colors.neutral[600],
    border: designTokens.colors.neutral[200],
  },
  dark: {
    background: designTokens.colors.neutral[900],
    text: designTokens.colors.neutral[50],
    textSecondary: designTokens.colors.neutral[400],
    border: designTokens.colors.neutral[700],
  },
} as const;

/**
 * Component-Specific Tokens
 */
export const componentTokens = {
  card: {
    padding: designTokens.spacing[6],           // 24px
    borderRadius: designTokens.radius['2xl'],   // 16px
    shadow: designTokens.shadows.lg,
    shadowHover: designTokens.shadows.xl,
  },
  button: {
    paddingX: designTokens.spacing[6],          // 24px
    paddingY: designTokens.spacing[3],          // 12px
    borderRadius: designTokens.radius.lg,       // 8px
    minHeight: '44px',                          // WCAG AA touch target
  },
  input: {
    padding: designTokens.spacing[4],           // 16px
    borderRadius: designTokens.radius.lg,       // 8px
    minHeight: '44px',                          // WCAG AA touch target
  },
} as const;

export default designTokens;
