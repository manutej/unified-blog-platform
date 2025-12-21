/**
 * Root Layout
 * Global layout with theme provider, header, and footer
 *
 * @pillar Accessible (Pillar 3) - Skip to content link, semantic HTML
 * @pillar Beautiful (Pillar 2) - Typography system, dark mode support
 * @pillar Performant (Pillar 5) - Font optimization with next/font
 */

import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/navigation/Header';
import Footer from '@/components/navigation/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Unified Blog Hub | AI, Automation & Productivity Learning',
  description: 'Master AI, automation, and productivity with comprehensive blog series covering Context Engineering, MCP Servers, Microsoft Copilot Agents, and n8n AI Agents. 48 expertly crafted blogs across 4 specialized series.',
  keywords: [
    'AI',
    'Automation',
    'Productivity',
    'Context Engineering',
    'MCP Servers',
    'Microsoft Copilot',
    'n8n',
    'AI Agents',
    'Blog Series',
    'Learning',
    'Tutorial',
  ],
  authors: [{ name: 'LUXOR Documentation Team' }],
  openGraph: {
    title: 'Unified Blog Hub | AI, Automation & Productivity',
    description: '48 comprehensive blogs across 4 specialized series',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unified Blog Hub | AI, Automation & Productivity',
    description: '48 comprehensive blogs across 4 specialized series',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {/* Skip to content link (WCAG 2.1 AA Requirement) */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-2xl focus:font-semibold"
          >
            Skip to main content
          </a>

          <Header />

          <main id="main-content" className="min-h-screen">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
