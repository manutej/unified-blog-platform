/**
 * BlogContent Component
 * Renders markdown content with XSS protection
 *
 * @pillar Secure (Pillar 4) - DOMPurify sanitization before rendering
 * @pillar Beautiful (Pillar 2) - Tailwind typography for optimal readability
 * @pillar Accessible (Pillar 3) - Semantic HTML, proper heading hierarchy
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useEffect, useState } from 'react';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    // Dynamic import of DOMPurify for client-side only
    import('dompurify').then((DOMPurify) => {
      const clean = DOMPurify.default.sanitize(content, {
        ALLOWED_TAGS: [
          // Text formatting
          'p', 'strong', 'em', 'u', 's', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
          // Headings
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          // Lists
          'ul', 'ol', 'li',
          // Links and media
          'a', 'img',
          // Code
          'code', 'pre',
          // Quotes and blocks
          'blockquote', 'hr',
          // Tables
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          // Semantic
          'div', 'span', 'br',
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class', 'id',
          'width', 'height', 'target', 'rel',
        ],
        // Ensure links open securely
        ADD_ATTR: ['target', 'rel'],
      });
      setSanitizedContent(clean);
    });
  }, [content]);

  if (!sanitizedContent) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-4"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-code:text-sm prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-neutral-900 dark:prose-pre:bg-neutral-950 prose-img:rounded-lg prose-img:shadow-lg">
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
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
