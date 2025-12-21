/**
 * Individual Blog Post Page
 * Renders a single blog with content, metadata, and navigation
 *
 * @pillar Beautiful (Pillar 2) - Typography, series theming
 * @pillar Accessible (Pillar 3) - Semantic HTML, breadcrumbs, navigation
 * @pillar Secure (Pillar 4) - XSS protection via BlogContent component
 */

import { getBlogBySlug, getAllBlogs, getAdjacentBlogs, getDifficultyColor } from '@/lib/blog';
import { getSeriesConfig, getAllSeries } from '@/lib/series-config';
import BlogContent from '@/components/core/BlogContent';
import Link from 'next/link';

export async function generateStaticParams() {
  const series = getAllSeries();
  const params: { series: string; slug: string }[] = [];

  for (const s of series) {
    const blogs = getAllBlogs(s.id);
    for (const blog of blogs) {
      params.push({
        series: s.id,
        slug: blog.slug,
      });
    }
  }

  return params;
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ series: string; slug: string }>;
}) {
  const { series: seriesId, slug } = await params;
  const { metadata, content } = getBlogBySlug(seriesId, slug);
  const series = getSeriesConfig(seriesId);
  const allBlogs = getAllBlogs(seriesId);
  const { prev, next } = getAdjacentBlogs(metadata, allBlogs);
  const difficultyColor = getDifficultyColor(metadata.difficulty);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500 mb-8 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
          Home
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/${seriesId}`}
          className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
          style={{ color: series.colors.primary }}
        >
          {series.name}
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-neutral-900 dark:text-white">
          Blog {metadata.blogNumber || metadata.slug}
        </span>
      </nav>

      {/* Blog Header */}
      <header className="mb-12">
        {/* Blog Number Badge */}
        {metadata.blogNumber && (
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                backgroundColor: `${series.colors.primary}20`,
                color: series.colors.primary,
              }}
            >
              Blog {metadata.blogNumber} of {series.blogCount}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColor}`}>
              {metadata.difficulty}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white mb-4 tracking-tight leading-tight">
          {metadata.title}
        </h1>

        {/* Subtitle */}
        {metadata.subtitle && (
          <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            {metadata.subtitle}
          </p>
        )}

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-500 pb-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{metadata.readingTime} min read</span>
          </div>

          {metadata.handsOnTime && metadata.handsOnTime > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>{metadata.handsOnTime} min hands-on</span>
              </div>
            </>
          )}

          {metadata.publishedDate && (
            <>
              <span>•</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(metadata.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </>
          )}

          {metadata.author && (
            <>
              <span>•</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{metadata.author}</span>
              </div>
            </>
          )}
        </div>

        {/* Learning Objectives */}
        {metadata.learningObjectives && metadata.learningObjectives.length > 0 && (
          <div className="mt-6 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border-l-4" style={{ borderLeftColor: series.colors.primary }}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: series.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What You'll Learn
            </h2>
            <ul className="space-y-2 text-neutral-700 dark:text-neutral-300">
              {metadata.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-sm font-bold mt-0.5" style={{ color: series.colors.primary }}>
                    {index + 1}.
                  </span>
                  <span className="text-sm">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prerequisites */}
        {metadata.prerequisites && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
            <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Prerequisites
            </h3>
            {Array.isArray(metadata.prerequisites) ? (
              <ul className="text-sm text-yellow-900 dark:text-yellow-200 space-y-1">
                {metadata.prerequisites.map((prereq, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                {metadata.prerequisites}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Blog Content */}
      <article className="mb-12">
        <BlogContent content={content} />
      </article>

      {/* Tags */}
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="mb-12 pb-8 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation - Previous/Next */}
      <nav className="flex flex-col sm:flex-row justify-between gap-4" aria-label="Blog navigation">
        {prev ? (
          <Link
            href={`/${seriesId}/${prev.slug}`}
            className="flex-1 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-current hover:shadow-lg transition-all group"
            style={{ borderColor: series.colors.primary }}
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Previous Blog
            </div>
            <div className="font-bold text-neutral-900 dark:text-white group-hover:translate-x-[-4px] transition-transform">
              {prev.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1"></div>
        )}

        {next && (
          <Link
            href={`/${seriesId}/${next.slug}`}
            className="flex-1 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-current hover:shadow-lg transition-all group text-right"
            style={{ borderColor: series.colors.primary }}
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-500 mb-2 flex items-center justify-end gap-2">
              Next Blog
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <div className="font-bold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
              {next.title}
            </div>
          </Link>
        )}
      </nav>

      {/* Back to Series */}
      <div className="mt-12 text-center">
        <Link
          href={`/${seriesId}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
          style={{ backgroundColor: series.colors.primary, color: 'white' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          View All {series.name} Blogs
        </Link>
      </div>
    </div>
  );
}
