/**
 * Footer Component
 * Global footer with series links and resources
 *
 * @pillar Accessible (Pillar 3) - Semantic HTML, clear link structure
 * @pillar Beautiful (Pillar 2) - Consistent with design system
 * @pillar Documented (Pillar 7) - Clear attribution and metadata
 */

import { getAllSeries, getTotalBlogCount } from '@/lib/series-config';

export default function Footer() {
  const series = getAllSeries();
  const totalBlogs = getTotalBlogCount();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Unified Blog Hub</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Comprehensive blog series covering AI, automation, and productivity
              with {totalBlogs} expertly crafted blogs across {series.length} specialized series.
            </p>
            <div className="mt-4 text-xs text-neutral-500">
              Built with LibreUIUX Seven Pillars framework
            </div>
          </div>

          {/* Series Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Blog Series</h3>
            <ul className="space-y-3" role="list">
              {series.map(s => (
                <li key={s.id}>
                  <a
                    href={`/${s.id}`}
                    className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span
                      className="w-1 h-1 rounded-full group-hover:w-2 transition-all"
                      style={{ backgroundColor: s.colors.primary }}
                      aria-hidden="true"
                    />
                    <span className="flex-1">
                      {s.name}
                      <span className="text-neutral-600 ml-2">({s.blogCount} blogs)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="text-neutral-400 text-sm space-y-3" role="list">
              <li>
                <a
                  href="/docs/ARCHITECTURE.md"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Architecture Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://docs.claude.com/en/docs/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Claude Code Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Metadata */}
        <div className="mt-8 pt-8 border-t border-neutral-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-neutral-400 text-sm">
              © {currentYear} Unified Blog Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Last Updated: December 19, 2025</span>
              <span>•</span>
              <span>{totalBlogs} Total Blogs</span>
              <span>•</span>
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-400 transition-colors"
              >
                Built with Claude Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
