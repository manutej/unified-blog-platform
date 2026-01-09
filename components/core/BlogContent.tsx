/**
 * BlogContent Component
 * Renders markdown content with syntax highlighting
 *
 * @pillar Beautiful (Pillar 2) - Tailwind typography + syntax highlighting
 * @pillar Accessible (Pillar 3) - Semantic HTML, proper heading hierarchy
 *
 * Note: DOMPurify was removed because it corrupts markdown before parsing.
 * ReactMarkdown with remarkGfm handles markdown safely for controlled content.
 *
 * Theme-Aware Code Blocks:
 * - Light mode: oneLight theme with warm gray background
 * - Dark mode: oneDark theme with cool dark background
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Remove background colors from syntax theme tokens
 * This prevents white/light background bleed-through on individual code spans
 */
const stripBackgrounds = (theme: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(theme).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const { background, backgroundColor, ...rest } = value as Record<string, unknown>;
        return [key, rest];
      }
      return [key, value];
    })
  );

// Theme-specific syntax highlighting styles
const customOneDark = stripBackgrounds(oneDark);
const customOneLight = stripBackgrounds(oneLight);

/**
 * Theme Configuration for Code Blocks
 * WCAG 2.1 AA Compliant - Minimum 4.5:1 contrast ratio
 */
const codeThemeConfig = {
  light: {
    style: customOneLight,
    background: '#f8f8f8',  // Warm light gray - softer than pure white
    borderColor: '#e5e7eb', // neutral-200 border for definition
  },
  dark: {
    style: customOneDark,
    background: '#282c34',  // oneDark standard background
    borderColor: '#374151', // neutral-700 border
  },
};

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - only render theme-aware content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current theme configuration (default to light for SSR)
  const currentTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
  const themeConfig = codeThemeConfig[currentTheme];

  return (
    <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-img:rounded-lg prose-img:shadow-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Ensure external links open in new tab with security
          a: ({ node, children, href, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Add lazy loading to images
          img: ({ node, ...props }) => (
            <img
              loading="lazy"
              {...props}
              alt={props.alt || 'Blog image'}
            />
          ),
          // Syntax highlighted code blocks
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            // Strip trailing newline and stray backticks from first/last lines
            // These appear when markdown has extra backticks around code fences
            const rawContent = String(children).replace(/\n$/, '');
            const lines = rawContent.split('\n');
            // Remove leading backtick from first line
            if (lines.length > 0) {
              lines[0] = lines[0].replace(/^`+\s*/, '');
            }
            // Remove trailing backtick from last line
            if (lines.length > 0) {
              lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*`+$/, '');
            }
            const codeContent = lines.join('\n');

            // Only use SyntaxHighlighter for ACTUAL code blocks:
            // 1. NOT inline (react-markdown tells us)
            // 2. Has a language class OR contains newlines (multi-line)
            const isCodeBlock = !inline && (language || codeContent.includes('\n'));

            if (isCodeBlock) {
              return (
                <SyntaxHighlighter
                  style={themeConfig.style}
                  language={language || 'text'}
                  PreTag="div"
                  customStyle={{
                    margin: '1.5rem 0',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    padding: '1.25rem',
                    background: themeConfig.background,
                    border: `1px solid ${themeConfig.borderColor}`,
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      background: 'transparent',
                    },
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              );
            }

            // Inline code styling (single backticks, no language, single line)
            // WCAG AA: rose-700 on neutral-100 = 5.89:1 contrast (passes)
            // WCAG AA: rose-400 on neutral-800 = 5.12:1 contrast (passes)
            return (
              <code
                className="text-sm bg-neutral-100 dark:bg-neutral-800 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono border border-neutral-200 dark:border-neutral-700"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Style pre to not conflict with SyntaxHighlighter
          pre: ({ node, children, ...props }) => {
            // If children is a code element, let the code component handle it
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
