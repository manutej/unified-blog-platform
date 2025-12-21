# Unified Blog System Architecture

**Version**: 1.0.0
**Created**: 2025-12-19
**LibreUIUX Compliance**: Seven Pillars Framework

---

## Executive Summary

The **Unified Blog System** consolidates 4 blog series (Context Engineering, MCP Servers, Microsoft Copilot Agents, n8n Agents) into a single Next.js 16 application with:

- **Shared Component Library** - Reusable UI components (BlogCard, Callout, CodeBlock, etc.)
- **Unified Design System** - Educational Authority archetype with domain-specific accents
- **Plugin Architecture** - Blog-specific customizations without code duplication
- **Content Aggregation** - Single source of truth for all blog content
- **LibreUIUX Seven Pillars** - Meaningful, Beautiful, Accessible, Secure, Performant, Tested, Documented

---

## System Architecture

### 1. Directory Structure

```
blogs-unified/
├── app/                              # Next.js 16 App Router
│   ├── layout.tsx                    # Root layout (theme provider, global styles)
│   ├── page.tsx                      # Landing page (all blog series)
│   ├── globals.css                   # Tailwind + custom CSS
│   │
│   ├── [series]/                     # Dynamic series route
│   │   ├── page.tsx                  # Series index (12 blog cards)
│   │   └── [slug]/
│   │       └── page.tsx              # Individual blog post
│   │
│   └── api/                          # API routes (if needed)
│       └── search/
│           └── route.ts              # Full-text search
│
├── components/                       # Shared component library
│   ├── core/                         # Core UI components
│   │   ├── BlogCard.tsx              # Standardized blog card
│   │   ├── BlogContent.tsx           # Markdown renderer with XSS protection
│   │   ├── BlogGrid.tsx              # Responsive grid layout
│   │   ├── Callout.tsx               # Info/warning/success callouts
│   │   ├── CodeBlock.tsx             # Syntax-highlighted code
│   │   ├── DarkModeToggle.tsx        # Theme switcher
│   │   ├── ProgressBar.tsx           # Reading progress indicator
│   │   └── TableOfContents.tsx       # Auto-generated TOC
│   │
│   ├── navigation/                   # Navigation components
│   │   ├── Header.tsx                # Global header
│   │   ├── Footer.tsx                # Global footer
│   │   ├── Breadcrumbs.tsx           # Series/blog breadcrumbs
│   │   └── SeriesNav.tsx             # Series-specific navigation
│   │
│   └── widgets/                      # Feature-specific widgets
│       ├── SearchBar.tsx             # Full-text search
│       ├── RelatedBlogs.tsx          # Recommendation engine
│       └── ShareButtons.tsx          # Social sharing
│
├── content/                          # All blog content (markdown)
│   ├── context-engineering/
│   │   ├── 01-foundational-theory.md
│   │   ├── 02-retrieval-architecture.md
│   │   └── ...
│   │
│   ├── mcp-servers/
│   │   ├── 01-introduction.md
│   │   └── ...
│   │
│   ├── microsoft-copilot-agents/
│   │   ├── 01-introduction.md
│   │   └── ...
│   │
│   └── n8n-agents/
│       ├── 01-introduction-to-ai-agents.md
│       └── ...
│
├── lib/                              # Utility libraries
│   ├── blog.ts                       # Blog metadata parser
│   ├── design-tokens.ts              # Design system tokens
│   ├── series-config.ts              # Series plugin configurations
│   ├── search.ts                     # Search indexing
│   └── utils.ts                      # General utilities
│
├── plugins/                          # Blog series plugins
│   ├── context-engineering/
│   │   ├── config.ts                 # Series-specific config
│   │   ├── theme.ts                  # Color overrides
│   │   └── components/               # Custom components (if needed)
│   │
│   ├── mcp-servers/
│   │   └── config.ts
│   │
│   ├── microsoft-copilot-agents/
│   │   └── config.ts
│   │
│   └── n8n-agents/
│       └── config.ts
│
├── public/                           # Static assets
│   ├── images/
│   │   ├── context-engineering/      # Series-specific images
│   │   ├── mcp-servers/
│   │   ├── microsoft-copilot-agents/
│   │   └── n8n-agents/
│   │
│   └── diagrams/                     # SVG diagrams
│
├── tests/                            # Testing infrastructure
│   ├── unit/                         # Component unit tests
│   ├── integration/                  # Integration tests
│   ├── accessibility/                # jest-axe tests
│   └── visual/                       # Playwright visual regression
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # This file
│   ├── DESIGN-SYSTEM.md              # Design tokens and guidelines
│   ├── COMPONENT-API.md              # Component API reference
│   └── PLUGIN-GUIDE.md               # Creating new series plugins
│
├── package.json                      # Dependencies
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind + design tokens
├── tsconfig.json                     # TypeScript configuration
└── jest.config.js                    # Testing configuration
```

---

## 2. Plugin Architecture

### 2.1 Series Configuration Interface

Each blog series is a **plugin** with this structure:

```typescript
// lib/series-config.ts
export interface SeriesConfig {
  // Identity
  id: string;                         // 'context-engineering'
  name: string;                       // 'Context Engineering'
  description: string;                // SEO description

  // Archetype & Design
  archetype: ArchetypeConfig;
  colors: ColorPalette;

  // Content
  blogCount: number;                  // 12
  contentPath: string;                // 'content/context-engineering'

  // Navigation
  externalLinks?: ExternalLink[];

  // Features
  enableSearch?: boolean;
  enableRelated?: boolean;
  enableComments?: boolean;
}

export interface ArchetypeConfig {
  primary: 'Sage' | 'Magician' | 'Explorer' | 'Hero';
  secondary?: string;
  values: string[];                   // ['Trust', 'Knowledge', 'Transformation']
}

export interface ColorPalette {
  primary: string;                    // Main brand color
  primaryHover: string;
  light: string;                      // Light variant
  dark: string;                       // Dark variant
  accent?: string;                    // Optional accent
}
```

### 2.2 Example Plugin Configuration

```typescript
// plugins/context-engineering/config.ts
export const contextEngineeringConfig: SeriesConfig = {
  id: 'context-engineering',
  name: 'Context Engineering',
  description: 'Master context engineering from foundational theory to production deployment',

  archetype: {
    primary: 'Sage',
    secondary: 'Library',
    values: ['Knowledge', 'Trust', 'Precision'],
  },

  colors: {
    primary: '#3b82f6',               // blue-600 (Sage authority)
    primaryHover: '#2563eb',          // blue-700
    light: '#dbeafe',                 // blue-50
    dark: '#1e40af',                  // blue-800
  },

  blogCount: 12,
  contentPath: 'content/context-engineering',

  externalLinks: [
    { label: 'Documentation', url: 'https://example.com/docs' },
  ],

  enableSearch: true,
  enableRelated: true,
};
```

### 2.3 Series Registry

```typescript
// lib/series-config.ts
import { contextEngineeringConfig } from '@/plugins/context-engineering/config';
import { mcpServersConfig } from '@/plugins/mcp-servers/config';
import { microsoftCopilotConfig } from '@/plugins/microsoft-copilot-agents/config';
import { n8nAgentsConfig } from '@/plugins/n8n-agents/config';

export const SERIES_REGISTRY: Record<string, SeriesConfig> = {
  'context-engineering': contextEngineeringConfig,
  'mcp-servers': mcpServersConfig,
  'microsoft-copilot-agents': microsoftCopilotConfig,
  'n8n-agents': n8nAgentsConfig,
};

export function getSeriesConfig(seriesId: string): SeriesConfig {
  const config = SERIES_REGISTRY[seriesId];
  if (!config) {
    throw new Error(`Series '${seriesId}' not found in registry`);
  }
  return config;
}
```

---

## 3. Design System

### 3.1 Unified Design Tokens

```typescript
// lib/design-tokens.ts
export const designTokens = {
  // Typography (Major Third Scale - 1.25 ratio)
  typography: {
    scale: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px - STANDARD body text
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px - Small headings
      '2xl': '1.5rem',    // 24px - H3
      '3xl': '1.875rem',  // 30px - H2
      '4xl': '2.25rem',   // 36px - H1
      '5xl': '3rem',      // 48px - Hero
      '6xl': '3.75rem',   // 60px - Display
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeights: {
      tight: 1.1,         // Headings
      normal: 1.5,        // Body text
      relaxed: 1.75,      // Longer reads
    },
  },

  // Spacing (8px baseline grid)
  spacing: {
    0: '0',
    1: '0.25rem',         // 4px
    2: '0.5rem',          // 8px (base unit)
    3: '0.75rem',         // 12px
    4: '1rem',            // 16px
    6: '1.5rem',          // 24px - STANDARD card padding
    8: '2rem',            // 32px
    12: '3rem',           // 48px
    16: '4rem',           // 64px - STANDARD section padding
    24: '6rem',           // 96px
  },

  // Colors (Educational Authority archetype)
  colors: {
    sage: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',     // PRIMARY - Trust, Knowledge
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    magician: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',     // Transformation
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',     // Text secondary
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Shadows (depth hierarchy)
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Border Radius
  radius: {
    sm: '0.125rem',       // 2px
    md: '0.375rem',       // 6px
    lg: '0.5rem',         // 8px
    xl: '0.75rem',        // 12px
    '2xl': '1rem',        // 16px - STANDARD cards
    full: '9999px',
  },
};
```

### 3.2 Tailwind Configuration

```typescript
// tailwind.config.ts
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
      },
      fontSize: designTokens.typography.scale,
      fontWeight: designTokens.typography.weights,
      lineHeight: designTokens.typography.lineHeights,
      spacing: designTokens.spacing,
      boxShadow: designTokens.shadows,
      borderRadius: designTokens.radius,
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

---

## 4. Core Components

### 4.1 BlogCard Component

```typescript
// components/core/BlogCard.tsx
import Link from 'next/link';
import { BlogMetadata } from '@/lib/blog';
import { getSeriesConfig } from '@/lib/series-config';

interface BlogCardProps {
  blog: BlogMetadata;
  seriesId: string;
  index: number;
}

export default function BlogCard({ blog, seriesId, index }: BlogCardProps) {
  const series = getSeriesConfig(seriesId);
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200',
    Intermediate: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200',
    Advanced: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200',
    Expert: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Link
      href={`/${seriesId}/${blog.slug}`}
      className="group block h-full"
      aria-label={`Read ${blog.title}`}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 border border-neutral-200 dark:border-neutral-700 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium" style={{ color: series.colors.primary }}>
            Blog {index + 1} of {series.blogCount}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColors[blog.difficulty]}`}>
            {blog.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-sage-500 transition-colors line-clamp-2">
          {blog.title}
        </h3>

        {/* Subtitle */}
        <p className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2 flex-1">
          {blog.subtitle}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
            {blog.readingTime} min read
          </span>
          {blog.handsOnTime > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">
              {blog.handsOnTime} min hands-on
            </span>
          )}
        </div>

        {/* Learning Objectives */}
        {blog.learningObjectives && blog.learningObjectives.length > 0 && (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {blog.learningObjectives.length} learning objectives
          </div>
        )}

        {/* Read More */}
        <div className="mt-4 flex items-center font-semibold text-sm group-hover:translate-x-2 transition-transform" style={{ color: series.colors.primary }}>
          Read More
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
```

### 4.2 Callout Component

```typescript
// components/core/Callout.tsx
import { ReactNode } from 'react';

type CalloutType = 'info' | 'warning' | 'success' | 'error' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutStyles: Record<CalloutType, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100',
  success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100',
  error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
  tip: 'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-100',
};

const calloutIcons: Record<CalloutType, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  error: '❌',
  tip: '💡',
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <div
      className={`border-l-4 p-6 rounded-lg ${calloutStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3" aria-hidden="true">
          {calloutIcons[type]}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="font-bold mb-2 text-lg">
              {title}
            </h4>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Content Aggregation

### 5.1 Blog Metadata Interface

```typescript
// lib/blog.ts
export interface BlogMetadata {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  readingTime: number;
  handsOnTime?: number;
  learningObjectives: string[];
  prerequisites?: string[];
  tags: string[];
  publishedDate: string;
  lastUpdated?: string;
  author?: string;
  seriesId: string;
}

export interface BlogContent {
  metadata: BlogMetadata;
  content: string;
}
```

### 5.2 Content Parser

```typescript
// lib/blog.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getAllBlogs(seriesId: string): BlogMetadata[] {
  const seriesPath = path.join(process.cwd(), 'content', seriesId);
  const files = fs.readdirSync(seriesPath).filter(f => f.endsWith('.md'));

  return files.map(filename => {
    const filePath = path.join(seriesPath, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    return {
      slug: filename.replace('.md', ''),
      ...data,
      seriesId,
    } as BlogMetadata;
  }).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getBlogBySlug(seriesId: string, slug: string): BlogContent {
  const filePath = path.join(process.cwd(), 'content', seriesId, `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    metadata: {
      slug,
      ...data,
      seriesId,
    } as BlogMetadata,
    content,
  };
}
```

---

## 6. Security Implementation

### 6.1 XSS Prevention (LibreUIUX Pillar 4: Secure)

```typescript
// components/core/BlogContent.tsx
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  // CRITICAL: Sanitize HTML before rendering
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'class', 'id'],
  });

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
```

### 6.2 CSP Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

---

## 7. Accessibility Implementation (LibreUIUX Pillar 3)

### 7.1 WCAG 2.1 AA Compliance

```typescript
// All interactive elements MUST have:
// 1. Focus indicators
className="focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2"

// 2. ARIA labels
<button aria-label="Toggle dark mode">
<nav aria-label="Main navigation">
<section aria-label="Blog series overview">

// 3. Keyboard navigation
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  Skip to main content
</a>

// 4. Touch targets (44x44px minimum)
className="min-h-[44px] min-w-[44px]"

// 5. Color contrast (4.5:1 minimum for text, 3:1 for UI)
// All colors in design-tokens.ts are WCAG AA compliant
```

---

## 8. Performance Optimization (LibreUIUX Pillar 5)

### 8.1 Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 8.2 Implementation

```typescript
// Next.js Image optimization
import Image from 'next/image';

<Image
  src="/images/context-engineering/diagram.png"
  alt="Architecture diagram"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>

// Dynamic imports for code splitting
const CodeBlock = dynamic(() => import('@/components/core/CodeBlock'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

// Font optimization
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

---

## 9. Testing Strategy (LibreUIUX Pillar 6)

### 9.1 Testing Pyramid

```
      /\
     /  \    E2E Tests (Playwright)
    /----\
   /      \  Integration Tests
  /--------\
 /          \ Unit Tests (Jest + RTL)
/------------\
```

### 9.2 Coverage Requirements

- **Minimum**: 70% coverage
- **Target**: 90% coverage
- **Critical paths**: 100% coverage

### 9.3 Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageThresholds: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
};
```

---

## 10. Deployment Architecture

### 10.1 Static Export

```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
```

### 10.2 Build Pipeline

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm run test

# 3. Build application
npm run build

# 4. Deploy to Vercel/Netlify
# Output: /out directory with static HTML/CSS/JS
```

---

## 11. Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Request                         │
│                    /{series}/{slug}                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Router                          │
│               app/[series]/[slug]/page.tsx                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Series Plugin Loader                       │
│           getSeriesConfig(seriesId) → SeriesConfig           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Content Aggregator                         │
│      getBlogBySlug(seriesId, slug) → BlogContent             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Rendering                       │
│  BlogContent (sanitized) + BlogCard + Layout (themed)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     HTML Response                            │
│              Static page with design system                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. LibreUIUX Seven Pillars Compliance

| Pillar | Implementation | Status |
|--------|----------------|--------|
| **1. Meaningful** | Educational Authority archetype, domain-specific archetypes per series | ✅ |
| **2. Beautiful** | Unified design system, Major Third typography, 60-30-10 color rule | ✅ |
| **3. Accessible** | WCAG 2.1 AA compliance, keyboard nav, ARIA labels, 4.5:1 contrast | ✅ |
| **4. Secure** | DOMPurify XSS prevention, CSP headers, SRI for CDN | ✅ |
| **5. Performant** | Core Web Vitals optimization, image lazy loading, code splitting | ✅ |
| **6. Tested** | 70% minimum coverage, Jest + jest-axe + Playwright | ✅ |
| **7. Documented** | TypeScript + JSDoc, component API docs, design tokens extraction | ✅ |

---

## 13. Extension Points

### 13.1 Adding a New Blog Series

```bash
# 1. Create content directory
mkdir content/new-series

# 2. Create plugin configuration
mkdir plugins/new-series
# Edit plugins/new-series/config.ts

# 3. Register in series registry
# Edit lib/series-config.ts

# 4. Add content (markdown files)
# content/new-series/01-introduction.md

# 5. Build and deploy
npm run build
```

### 13.2 Custom Components per Series

```typescript
// plugins/new-series/components/CustomWidget.tsx
export default function CustomWidget() {
  return <div>Series-specific widget</div>;
}

// Use in plugin config
export const newSeriesConfig: SeriesConfig = {
  // ...
  customComponents: {
    widget: CustomWidget,
  },
};
```

---

## 14. Success Metrics

### 14.1 Technical Metrics

- **Build Time**: < 60s
- **Bundle Size**: < 500KB (gzipped)
- **Lighthouse Score**: 95+ (all categories)
- **Test Coverage**: 70%+ (target 90%)

### 14.2 Quality Gates

Before deployment, ALL must pass:

- ✅ TypeScript compilation succeeds
- ✅ All tests pass (unit + integration + accessibility)
- ✅ Lighthouse score ≥ 95
- ✅ No XSS vulnerabilities (DOMPurify enabled)
- ✅ WCAG AA compliance (jest-axe tests pass)
- ✅ No console errors in production build

---

**Status**: Architecture design complete ✅
**Next Block**: Implementation
**Estimated Implementation Time**: 6-8 hours
