/**
 * BlogCard Component
 * Standardized card for displaying blog metadata
 *
 * @pillar Beautiful (Pillar 2) - Series-specific colors, unified design language
 * @pillar Accessible (Pillar 3) - ARIA labels, focus indicators, semantic HTML
 * @pillar Meaningful (Pillar 1) - Clear information hierarchy
 */

import Link from 'next/link';
import { BlogMetadata, getDifficultyColor } from '@/lib/blog';
import { getSeriesConfig } from '@/lib/series-config';

interface BlogCardProps {
  blog: BlogMetadata;
  seriesId: string;
  index: number;
}

export default function BlogCard({ blog, seriesId, index }: BlogCardProps) {
  const series = getSeriesConfig(seriesId);
  const difficultyColor = getDifficultyColor(blog.difficulty);

  return (
    <Link
      href={`/${seriesId}/${blog.slug}`}
      className="group block h-full"
      aria-label={`Read blog ${index + 1}: ${blog.title}`}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 border border-neutral-200 dark:border-neutral-700 h-full flex flex-col focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:ring-offset-2"
        role="article"
      >
        {/* Header - Series Position + Difficulty */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-sm font-medium transition-colors"
            style={{ color: series.colors.primary }}
            aria-label={`Blog ${index + 1} of ${series.blogCount} in ${series.name} series`}
          >
            Blog {index + 1} of {series.blogCount}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColor}`}
            aria-label={`Difficulty level: ${blog.difficulty}`}
          >
            {blog.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-sage-500 transition-colors line-clamp-2">
          {blog.title}
        </h3>

        {/* Subtitle */}
        <p className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">
          {blog.subtitle}
        </p>

        {/* Metadata - Reading Time + Hands-On Time */}
        <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Blog metadata">
          <span
            className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
            role="listitem"
            aria-label={`Reading time: ${blog.readingTime} minutes`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {blog.readingTime} min read
          </span>
          {blog.handsOnTime && blog.handsOnTime > 0 && (
            <span
              className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 flex items-center gap-1"
              role="listitem"
              aria-label={`Hands-on practice time: ${blog.handsOnTime} minutes`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {blog.handsOnTime} min hands-on
            </span>
          )}
        </div>

        {/* Learning Objectives Count */}
        {blog.learningObjectives && blog.learningObjectives.length > 0 && (
          <div
            className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-2"
            aria-label={`${blog.learningObjectives.length} learning objectives`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {blog.learningObjectives.length} learning objectives
          </div>
        )}

        {/* Tags (if present) */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4" role="list" aria-label="Blog tags">
            {blog.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400"
                role="listitem"
              >
                {tag}
              </span>
            ))}
            {blog.tags.length > 3 && (
              <span className="text-xs px-2 py-1 text-neutral-500 dark:text-neutral-500">
                +{blog.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Read More Arrow */}
        <div
          className="mt-4 flex items-center font-semibold text-sm group-hover:translate-x-2 transition-transform"
          style={{ color: series.colors.primary }}
          aria-hidden="true"
        >
          Read More
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
