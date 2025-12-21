/**
 * Series Index Page
 * Displays all blogs in a specific series
 *
 * @pillar Beautiful (Pillar 2) - Series-specific theming
 * @pillar Meaningful (Pillar 1) - Clear information architecture
 * @pillar Accessible (Pillar 3) - Semantic HTML, ARIA labels
 */

import { getAllBlogs } from '@/lib/blog';
import { getSeriesConfig, getAllSeries } from '@/lib/series-config';
import BlogCard from '@/components/core/BlogCard';
import BlogGrid from '@/components/core/BlogGrid';
import Link from 'next/link';

export async function generateStaticParams() {
  const series = getAllSeries();
  return series.map((s) => ({
    series: s.id,
  }));
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series: seriesId } = await params;
  const series = getSeriesConfig(seriesId);
  const blogs = getAllBlogs(seriesId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
          Home
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium" style={{ color: series.colors.primary }}>
          {series.name}
        </span>
      </nav>

      {/* Series Header */}
      <header className="mb-12">
        <h1
          className="text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight"
          style={{ color: series.colors.primary }}
        >
          {series.name}
        </h1>
        <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed max-w-4xl">
          {series.description}
        </p>

        {/* Series Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <svg className="w-5 h-5" style={{ color: series.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {series.blogCount} Blogs
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <svg className="w-5 h-5" style={{ color: series.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {series.difficulty} Level
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <svg className="w-5 h-5" style={{ color: series.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {series.archetype.primary} Archetype
            </span>
          </div>
        </div>

        {/* Archetype Description */}
        {series.archetype.description && (
          <div className="mt-6 p-4 rounded-lg border-l-4 bg-neutral-50 dark:bg-neutral-800/50" style={{ borderLeftColor: series.colors.primary }}>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
              <span className="font-semibold" style={{ color: series.colors.primary }}>
                Archetypal Foundation:
              </span>{' '}
              {series.archetype.description}
            </p>
          </div>
        )}

        {/* External Links */}
        {series.externalLinks && series.externalLinks.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {series.externalLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-current transition-colors text-sm font-medium"
                style={{ color: series.colors.primary }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Blog Grid */}
      <section aria-label={`${series.name} blog posts`}>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
          All Blogs in This Series
        </h2>
        <BlogGrid>
          {blogs.map((blog, index) => (
            <div key={blog.slug} role="listitem">
              <BlogCard
                blog={blog}
                seriesId={seriesId}
                index={index}
              />
            </div>
          ))}
        </BlogGrid>
      </section>

      {/* Empty State (if no blogs found) */}
      {blogs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No blogs found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Blog content for this series hasn't been migrated yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: series.colors.primary, color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}
