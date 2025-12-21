/**
 * Callout Component
 * Highlighted information boxes for important content
 *
 * @pillar Beautiful (Pillar 2) - Consistent design language across types
 * @pillar Accessible (Pillar 3) - ARIA roles, semantic markup
 * @pillar Meaningful (Pillar 1) - Clear visual hierarchy and categorization
 */

import { ReactNode } from 'react';

export type CalloutType = 'info' | 'warning' | 'success' | 'error' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutStyles: Record<CalloutType, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100',
  success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100',
  error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
  tip: 'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-100',
};

const calloutIcons: Record<CalloutType, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  error: '❌',
  tip: '💡',
};

const calloutLabels: Record<CalloutType, string> = {
  info: 'Information',
  warning: 'Warning',
  success: 'Success',
  error: 'Error',
  tip: 'Tip',
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <div
      className={`border-l-4 p-6 rounded-lg my-6 ${calloutStyles[type]}`}
      role="alert"
      aria-live="polite"
      aria-label={`${calloutLabels[type]} callout`}
    >
      <div className="flex items-start gap-3">
        <span
          className="text-2xl flex-shrink-0"
          aria-hidden="true"
          role="img"
          aria-label={calloutLabels[type]}
        >
          {calloutIcons[type]}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-bold mb-2 text-lg">
              {title}
            </h4>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
