/**
 * BlogGrid Component
 * Responsive grid layout for blog cards
 *
 * @pillar Beautiful (Pillar 2) - Swiss 12-column grid system
 * @pillar Accessible (Pillar 3) - Semantic HTML, responsive breakpoints
 * @pillar Performant (Pillar 5) - CSS Grid for optimal layout performance
 */

import { ReactNode } from 'react';

interface BlogGridProps {
  children: ReactNode;
  className?: string;
}

export default function BlogGrid({ children, className = '' }: BlogGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
      role="list"
      aria-label="Blog posts grid"
    >
      {children}
    </div>
  );
}
