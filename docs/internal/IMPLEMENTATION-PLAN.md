# Unified Blog System - Implementation Plan

**Version**: 1.0.0
**Created**: 2025-12-19
**Estimated Time**: 6-8 hours
**Complexity**: L5 (Multi-agent orchestration)

---

## Phase 1: Foundation (1-2 hours)

### 1.1 Project Scaffold

```bash
# Create Next.js application
npx create-next-app@latest blogs-unified --typescript --tailwind --app --no-src-dir

# Install dependencies
cd blogs-unified
npm install gray-matter remark-gfm rehype-raw react-markdown dompurify next-themes
npm install --save-dev @types/dompurify jest @testing-library/react @testing-library/jest-dom jest-axe @playwright/test
```

### 1.2 Directory Structure

```
✅ Create /components/core/
✅ Create /components/navigation/
✅ Create /components/widgets/
✅ Create /content/ (with 4 series subdirectories)
✅ Create /lib/
✅ Create /plugins/ (with 4 series subdirectories)
✅ Create /public/images/ (with 4 series subdirectories)
✅ Create /tests/ (unit, integration, accessibility, visual)
✅ Create /docs/
```

### 1.3 Core Configuration Files

**Files to create**:
- ✅ `tailwind.config.ts` - Design tokens integration
- ✅ `next.config.js` - CSP headers, static export
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `jest.config.js` - Testing configuration
- ✅ `jest.setup.js` - Jest setup with jest-axe
- ✅ `playwright.config.ts` - Visual regression tests

---

## Phase 2: Design System (1 hour)

### 2.1 Design Tokens

**File**: `lib/design-tokens.ts`
- ✅ Typography scale (Major Third - 1.25 ratio)
- ✅ Spacing system (8px baseline grid)
- ✅ Color system (Educational Authority archetype)
- ✅ Shadows, border radius, transitions

### 2.2 Tailwind Integration

**File**: `tailwind.config.ts`
- ✅ Import design tokens
- ✅ Configure theme extension
- ✅ Add @tailwindcss/typography plugin
- ✅ Configure dark mode (class strategy)

### 2.3 Global Styles

**File**: `app/globals.css`
- ✅ Tailwind imports
- ✅ Custom CSS variables
- ✅ Typography base styles
- ✅ Dark mode overrides

---

## Phase 3: Plugin Architecture (1 hour)

### 3.1 Series Configuration Interface

**File**: `lib/series-config.ts`
- ✅ `SeriesConfig` interface
- ✅ `ArchetypeConfig` interface
- ✅ `ColorPalette` interface
- ✅ `SERIES_REGISTRY` object
- ✅ `getSeriesConfig()` function

### 3.2 Individual Series Plugins

**Files to create (4 total)**:
- ✅ `plugins/context-engineering/config.ts`
- ✅ `plugins/mcp-servers/config.ts`
- ✅ `plugins/microsoft-copilot-agents/config.ts`
- ✅ `plugins/n8n-agents/config.ts`

**Each plugin contains**:
- Series identity (id, name, description)
- Archetype configuration
- Color palette (domain-specific)
- Content path
- Feature flags (search, related blogs)

---

## Phase 4: Content Layer (1 hour)

### 4.1 Blog Parser

**File**: `lib/blog.ts`
- ✅ `BlogMetadata` interface
- ✅ `BlogContent` interface
- ✅ `getAllBlogs(seriesId)` function
- ✅ `getBlogBySlug(seriesId, slug)` function
- ✅ gray-matter integration for frontmatter

### 4.2 Content Migration

**Copy existing blog content**:
```bash
# Context Engineering (12 blogs)
cp -r /Users/manu/Documents/LUXOR/blogs/context-engineering-synthesis/blogs/* \
  content/context-engineering/

# MCP Servers (assume similar structure)
# Microsoft Copilot Agents (12 blogs)
cp -r /Users/manu/Documents/LUXOR/blogs/microsoft-copilot-agents/content/blogs/* \
  content/microsoft-copilot-agents/

# n8n Agents (12 blogs)
cp -r /Users/manu/Documents/LUXOR/n8n/blogs/* \
  content/n8n-agents/
```

### 4.3 Image Migration

```bash
# Copy images to public/images/{series}/
cp -r /Users/manu/Documents/LUXOR/blogs/microsoft-copilot-agents/public/images/* \
  public/images/microsoft-copilot-agents/

# Repeat for other series
```

---

## Phase 5: Core Components (2 hours)

### 5.1 BlogCard Component

**File**: `components/core/BlogCard.tsx`
- ✅ Responsive card layout
- ✅ Series-specific colors (from plugin config)
- ✅ Difficulty badge
- ✅ Reading time + hands-on time
- ✅ Learning objectives count
- ✅ Hover effects
- ✅ Accessibility (ARIA labels, focus indicators)

### 5.2 BlogContent Component

**File**: `components/core/BlogContent.tsx`
- ✅ ReactMarkdown integration
- ✅ DOMPurify XSS prevention
- ✅ Syntax highlighting (react-syntax-highlighter)
- ✅ Custom renderers (headings, links, code blocks)
- ✅ Responsive images

### 5.3 Callout Component

**File**: `components/core/Callout.tsx`
- ✅ 5 types (info, warning, success, error, tip)
- ✅ Icons + colors per type
- ✅ ARIA roles (role="alert")
- ✅ Dark mode support

### 5.4 CodeBlock Component

**File**: `components/core/CodeBlock.tsx`
- ✅ Syntax highlighting
- ✅ Copy-to-clipboard button
- ✅ Line numbers
- ✅ Language badge
- ✅ Dark mode themes

### 5.5 BlogGrid Component

**File**: `components/core/BlogGrid.tsx`
- ✅ Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- ✅ Gap management (24px)
- ✅ Auto-fit layout

### 5.6 TableOfContents Component

**File**: `components/core/TableOfContents.tsx`
- ✅ Auto-generate from H2/H3 headings
- ✅ Smooth scroll to sections
- ✅ Active section highlighting
- ✅ Sticky positioning

### 5.7 ProgressBar Component

**File**: `components/core/ProgressBar.tsx`
- ✅ Reading progress indicator
- ✅ Sticky at top
- ✅ Smooth animation
- ✅ Series-specific color

---

## Phase 6: Navigation Components (1 hour)

### 6.1 Header Component

**File**: `components/navigation/Header.tsx`
- ✅ Logo/title
- ✅ Series navigation dropdown
- ✅ Search bar (if enabled)
- ✅ Dark mode toggle
- ✅ Sticky positioning
- ✅ Mobile-responsive

### 6.2 Footer Component

**File**: `components/navigation/Footer.tsx`
- ✅ Series links
- ✅ External resources
- ✅ Last updated date
- ✅ 3-column grid (desktop) → 1 column (mobile)

### 6.3 Breadcrumbs Component

**File**: `components/navigation/Breadcrumbs.tsx`
- ✅ Home → Series → Blog navigation
- ✅ Schema.org structured data
- ✅ ARIA labels

### 6.4 SeriesNav Component

**File**: `components/navigation/SeriesNav.tsx`
- ✅ Previous/Next blog buttons
- ✅ Back to series index
- ✅ Progress indicator (Blog X of 12)

---

## Phase 7: Pages & Routing (1 hour)

### 7.1 Root Layout

**File**: `app/layout.tsx`
- ✅ ThemeProvider (next-themes)
- ✅ Global fonts
- ✅ SEO metadata
- ✅ Header + Footer
- ✅ Skip-to-content link

### 7.2 Landing Page

**File**: `app/page.tsx`
- ✅ Hero section
- ✅ All 4 series cards
- ✅ Series descriptions
- ✅ Total blog count
- ✅ CTA buttons

### 7.3 Series Index Page

**File**: `app/[series]/page.tsx`
- ✅ Dynamic series parameter
- ✅ Series header (name, description, archetype)
- ✅ BlogGrid with all 12 blogs
- ✅ Series-specific theme colors
- ✅ SEO metadata (dynamic)

### 7.4 Individual Blog Page

**File**: `app/[series]/[slug]/page.tsx`
- ✅ Dynamic series + slug parameters
- ✅ BlogContent rendering
- ✅ TableOfContents
- ✅ ProgressBar
- ✅ SeriesNav (prev/next)
- ✅ Related blogs (if enabled)
- ✅ Share buttons

---

## Phase 8: Security & Performance (30 minutes)

### 8.1 XSS Prevention

**Implementation**:
- ✅ DOMPurify in BlogContent component
- ✅ Allowed tags whitelist
- ✅ Sanitize before dangerouslySetInnerHTML

### 8.2 CSP Headers

**File**: `next.config.js`
- ✅ Content-Security-Policy configuration
- ✅ script-src, style-src, font-src, img-src policies

### 8.3 Image Optimization

- ✅ Next.js Image component
- ✅ WebP/AVIF format support
- ✅ Lazy loading
- ✅ Blur placeholders

### 8.4 Code Splitting

- ✅ Dynamic imports for heavy components
- ✅ Route-based splitting (automatic with App Router)

---

## Phase 9: Testing Infrastructure (1 hour)

### 9.1 Unit Tests

**Files to create**:
- ✅ `tests/unit/BlogCard.test.tsx`
- ✅ `tests/unit/Callout.test.tsx`
- ✅ `tests/unit/blog.test.ts`
- ✅ `tests/unit/series-config.test.ts`

**Test coverage**:
- Component rendering
- Props handling
- Edge cases (empty data, missing fields)
- Error boundaries

### 9.2 Accessibility Tests

**Files to create**:
- ✅ `tests/accessibility/BlogCard.a11y.test.tsx`
- ✅ `tests/accessibility/navigation.a11y.test.tsx`

**Tests**:
- jest-axe automated checks
- ARIA labels validation
- Keyboard navigation
- Color contrast (manual verification)

### 9.3 Integration Tests

**Files to create**:
- ✅ `tests/integration/blog-flow.test.tsx`
- ✅ `tests/integration/series-navigation.test.tsx`

**Tests**:
- Landing page → Series index → Blog post flow
- Search functionality (if enabled)
- Theme switching

### 9.4 Visual Regression Tests

**Files to create**:
- ✅ `tests/visual/blog-card.spec.ts` (Playwright)
- ✅ `tests/visual/dark-mode.spec.ts`

**Tests**:
- Screenshot comparison
- Dark mode rendering
- Responsive breakpoints

---

## Phase 10: Documentation (30 minutes)

### 10.1 Component API Documentation

**File**: `docs/COMPONENT-API.md`
- ✅ BlogCard API
- ✅ Callout API
- ✅ CodeBlock API
- ✅ Usage examples
- ✅ Props table

### 10.2 Plugin Guide

**File**: `docs/PLUGIN-GUIDE.md`
- ✅ Creating new series plugin
- ✅ Configuration options
- ✅ Custom components
- ✅ Step-by-step tutorial

### 10.3 Design System Documentation

**File**: `docs/DESIGN-SYSTEM.md`
- ✅ Typography scale
- ✅ Color palette
- ✅ Spacing system
- ✅ Component patterns
- ✅ Accessibility guidelines

---

## Phase 11: Build & Deploy (30 minutes)

### 11.1 Production Build

```bash
# Run tests
npm run test

# Build static export
npm run build

# Output directory: /out
# Ready for deployment to Vercel/Netlify
```

### 11.2 Quality Gates

Before deployment, verify:
- ✅ All tests pass (unit + integration + accessibility)
- ✅ TypeScript compilation succeeds (no errors)
- ✅ Build succeeds (no warnings)
- ✅ Lighthouse score ≥ 95 (all categories)
- ✅ No XSS vulnerabilities
- ✅ WCAG AA compliance verified

### 11.3 Deployment

**Vercel deployment**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Manual deployment**:
```bash
# Upload /out directory to hosting provider
# Configure static site hosting
```

---

## Implementation Order (Recommended)

### Day 1 (4 hours)
1. ✅ **Phase 1**: Foundation (1-2 hours)
2. ✅ **Phase 2**: Design System (1 hour)
3. ✅ **Phase 3**: Plugin Architecture (1 hour)

### Day 2 (4 hours)
4. ✅ **Phase 4**: Content Layer (1 hour)
5. ✅ **Phase 5**: Core Components (2 hours)
6. ✅ **Phase 6**: Navigation Components (1 hour)

### Day 3 (2-3 hours)
7. ✅ **Phase 7**: Pages & Routing (1 hour)
8. ✅ **Phase 8**: Security & Performance (30 minutes)
9. ✅ **Phase 9**: Testing Infrastructure (1 hour)
10. ✅ **Phase 10**: Documentation (30 minutes)
11. ✅ **Phase 11**: Build & Deploy (30 minutes)

**Total Time**: 6-8 hours (spread across 3 days or done in 1-2 intense sessions)

---

## Critical Path

The **minimum viable system** requires:

### Must-Have (MVP)
1. ✅ Design tokens (`lib/design-tokens.ts`)
2. ✅ Series configuration (`lib/series-config.ts` + 4 plugin configs)
3. ✅ Blog parser (`lib/blog.ts`)
4. ✅ BlogCard component
5. ✅ BlogContent component (with DOMPurify)
6. ✅ Basic layout (`app/layout.tsx`)
7. ✅ Landing page (`app/page.tsx`)
8. ✅ Series index (`app/[series]/page.tsx`)
9. ✅ Blog post page (`app/[series]/[slug]/page.tsx`)
10. ✅ Content migration (all 48 blogs)

**Time for MVP**: 3-4 hours

### Nice-to-Have (Full System)
- TableOfContents component
- ProgressBar component
- Search functionality
- Related blogs widget
- Share buttons
- Complete test suite (70%+ coverage)
- Visual regression tests
- Comprehensive documentation

**Time for Full System**: 6-8 hours

---

## Risk Mitigation

### Risk 1: Content Migration Issues
**Mitigation**: Validate frontmatter schema across all 48 blogs before migration
**Fallback**: Manual correction of invalid frontmatter

### Risk 2: Image Path Resolution
**Mitigation**: Use Next.js Image component with proper public/ paths
**Fallback**: Regular <img> tags with explicit paths

### Risk 3: Performance Budget Exceeded
**Mitigation**: Code splitting, lazy loading, image optimization
**Fallback**: Remove heavy components (e.g., syntax highlighting) from critical path

### Risk 4: Test Coverage Below 70%
**Mitigation**: Focus on critical path components first (BlogCard, BlogContent, blog.ts)
**Fallback**: Ship with lower coverage, iterate to improve

---

## Success Criteria

### Technical
- ✅ Build succeeds with 0 errors
- ✅ TypeScript compilation passes
- ✅ All tests pass (unit + integration + accessibility)
- ✅ Lighthouse score ≥ 95
- ✅ Bundle size < 500KB (gzipped)

### Quality
- ✅ WCAG 2.1 AA compliant (jest-axe validates)
- ✅ No XSS vulnerabilities (DOMPurify enabled)
- ✅ Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- ✅ Test coverage ≥ 70%

### Functional
- ✅ All 48 blogs render correctly
- ✅ All 4 series have unique themes
- ✅ Dark mode works across all pages
- ✅ Mobile responsive (320px → 1920px)
- ✅ Navigation works (prev/next, breadcrumbs)

---

**Status**: Implementation plan complete ✅
**Next**: Begin implementation (Phase 1-11)
**Estimated Duration**: 6-8 hours total
