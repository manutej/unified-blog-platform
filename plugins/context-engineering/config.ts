/**
 * Context Engineering Series Configuration
 * Plugin for Context Engineering blog series
 *
 * @archetype Sage (Trust, Knowledge) + Library (Precision, Organization)
 * @focus Technical knowledge transfer and foundational theory
 */

import { SeriesConfig } from '@/lib/series-config';

export const contextEngineeringConfig: SeriesConfig = {
  // Identity
  id: 'context-engineering',
  name: 'Context Engineering',
  shortName: 'Context Eng',
  description: 'Master context engineering from foundational theory to production deployment',
  seoDescription: 'Comprehensive 12-part blog series on context engineering for AI systems. Learn retrieval architecture, memory compression, MCP integration, and production deployment strategies.',

  // Archetype & Design
  archetype: {
    primary: 'Sage',
    secondary: 'Library',
    values: ['Trust', 'Knowledge', 'Precision', 'Organization'],
    description: 'Systematic knowledge transfer with precision and depth',
  },

  colors: {
    primary: '#3b82f6',         // blue-600 (Sage authority - trust, knowledge)
    primaryHover: '#2563eb',    // blue-700
    light: '#dbeafe',           // blue-50 (clarity, openness)
    dark: '#1e40af',            // blue-800 (depth, professionalism)
  },

  // Content
  blogCount: 12,
  contentPath: 'context-engineering',

  // Navigation
  externalLinks: [
    {
      label: 'Context Engineering Docs',
      url: 'https://example.com/context-engineering',
      description: 'Official documentation and API reference',
    },
  ],

  // Features
  enableSearch: true,
  enableRelated: true,
  enableTableOfContents: true,

  // Metadata
  author: 'Context Engineering Team',
  lastUpdated: '2025-12-19',
  difficulty: 'Advanced',
};
