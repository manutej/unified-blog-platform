/**
 * Landing Page
 * Homepage showcasing all blog series
 *
 * @pillar Meaningful (Pillar 1) - Clear value proposition and navigation
 * @pillar Beautiful (Pillar 2) - Series-specific color coding
 * @pillar Accessible (Pillar 3) - Semantic HTML, clear hierarchy
 */

import Link from 'next/link';
import { getAllSeries, getTotalBlogCount } from '@/lib/series-config';

export default function HomePage() {
  const series = getAllSeries();
  const totalBlogs = getTotalBlogCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">
          Unified Blog Hub
        </h1>
        <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          Master AI, automation, and productivity with <span className="font-bold text-sage-600 dark:text-sage-400">{totalBlogs} comprehensive blogs</span> across {series.length} specialized series.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-neutral-500 dark:text-neutral-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            LibreUIUX Compliant
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            Educational Authority Archetype
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Open Source
          </div>
        </div>
      </div>

      {/* Series Cards Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {series.map((s, index) => (
          <Link
            key={s.id}
            href={`/${s.id}`}
            className="group block"
            aria-label={`Explore ${s.name} series with ${s.blogCount} blogs`}
          >
            <article
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-l-4 h-full flex flex-col focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:ring-offset-2"
              style={{ borderLeftColor: s.colors.primary }}
            >
              {/* Series Header */}
              <div className="flex items-start justify-between mb-4">
                <h2
                  className="text-3xl font-bold leading-tight"
                  style={{ color: s.colors.primary }}
                >
                  {s.name}
                </h2>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ml-4"
                  style={{ backgroundColor: `${s.colors.primary}20` }}
                  aria-hidden="true"
                >
                  {index === 0 && '📚'}
                  {index === 1 && '🔌'}
                  {index === 2 && '🤖'}
                  {index === 3 && '⚡'}
                </div>
              </div>

              {/* Description */}
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed flex-1">
                {s.description}
              </p>

              {/* Archetype Badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-sm">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {s.archetype.primary} Archetype
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-500">•</span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {s.archetype.values.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>

              {/* Metadata & CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-500">
                  <span className="font-semibold">{s.blogCount} blogs</span>
                  <span>•</span>
                  <span>{s.difficulty}</span>
                </div>
                <div
                  className="font-semibold text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform"
                  style={{ color: s.colors.primary }}
                >
                  Explore Series
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-16 pt-16 border-t border-neutral-200 dark:border-neutral-700">
        <h2 className="text-3xl font-bold text-center mb-12 text-neutral-900 dark:text-white">
          Why Choose Unified Blog Hub?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">Comprehensive Coverage</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              From foundational theory to production deployment across AI, automation, and productivity domains.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">Archetypal Design</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Each series embodies a unique archetype (Sage, Magician, Hero, Ruler) for psychological coherence.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">LibreUIUX Compliant</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Built with Seven Pillars framework: Meaningful, Beautiful, Accessible, Secure, Performant, Tested, Documented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
