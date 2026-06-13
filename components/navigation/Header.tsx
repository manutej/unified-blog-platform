/**
 * Header Component
 * Global navigation header with series dropdown and dark mode toggle
 *
 * @pillar Accessible (Pillar 3) - Keyboard navigation, ARIA labels, skip link
 * @pillar Beautiful (Pillar 2) - Series-specific color coding
 * @pillar Meaningful (Pillar 1) - Clear navigation hierarchy
 */

'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { getAllSeries } from '@/lib/series-config';
import { useSyncExternalStore } from 'react';

// Stable no-op subscription so useSyncExternalStore only distinguishes
// server snapshot (false) from client snapshot (true).
const emptySubscribe = () => () => {};

export default function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  // Avoid hydration mismatch: false during SSR/hydration, true on the client.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const series = getAllSeries();

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-neutral-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2 rounded-lg px-2 py-1"
            aria-label="Unified Blog Hub home"
          >
            <span className="hidden sm:inline">Unified Blog Hub</span>
            <span className="sm:hidden">Blog Hub</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main navigation">
            {/* Series Dropdown */}
            <div className="relative group">
              <button
                className="text-neutral-700 dark:text-neutral-300 hover:text-sage-600 dark:hover:text-sage-400 font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2 rounded-lg px-3 py-2 flex items-center gap-1"
                aria-label="Browse blog series"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="hidden sm:inline">Series</span>
                <span className="sm:hidden">📚</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div
                className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 overflow-hidden"
                role="menu"
                aria-label="Blog series menu"
              >
                {series.map((s, index) => (
                  <Link
                    key={s.id}
                    href={`/${s.id}`}
                    className={`block px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:bg-neutral-50 dark:focus:bg-neutral-700 ${
                      index !== series.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-full rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.colors.primary }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold mb-1"
                          style={{ color: s.colors.primary }}
                        >
                          {s.name}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {s.description}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                          {s.blogCount} blogs • {s.difficulty}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Dark Mode Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2"
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {resolvedTheme === 'dark' ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-neutral-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
