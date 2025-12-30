/**
 * BlogContent Component
 * Renders markdown content with syntax highlighting
 *
 * @pillar Beautiful (Pillar 2) - Tailwind typography + syntax highlighting
 * @pillar Accessible (Pillar 3) - Semantic HTML, proper heading hierarchy
 *
 * Note: DOMPurify was removed because it corrupts markdown before parsing.
 * ReactMarkdown with remarkGfm handles markdown safely for controlled content.
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Create a modified theme that removes ALL background colors from tokens
// This fixes the white/light background bleed-through issue on code spans
const customOneDark = Object.fromEntries(
  Object.entries(oneDark).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      // Remove background and backgroundColor from all token styles
      const { background, backgroundColor, ...rest } = value as Record<string, unknown>;
      return [key, rest];
    }
    return [key, value];
  })
);

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-img:rounded-lg prose-img:shadow-lg">
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
                  style={customOneDark}
                  language={language || 'text'}
                  PreTag="div"
                  customStyle={{
                    margin: '1.5rem 0',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    padding: '1.25rem',
                    background: '#282c34', // oneDark background color
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
            return (
              <code
                className="text-sm bg-neutral-100 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono"
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
