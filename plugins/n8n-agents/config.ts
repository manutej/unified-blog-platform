/**
 * n8n Agents Series Configuration
 * Plugin for n8n AI Agents blog series
 *
 * @archetype Magician (Transformation, Innovation) + Creator (Building, Making)
 * @focus Workflow automation and creative problem-solving
 */

import { SeriesConfig } from '@/lib/series-config';

export const n8nAgentsConfig: SeriesConfig = {
  // Identity
  id: 'n8n-agents',
  name: 'n8n AI Agents',
  shortName: 'n8n',
  description: 'From beginner to expert: Build powerful AI agents with n8n workflow automation',
  seoDescription: 'Complete n8n AI agents course. Learn to build intelligent automation workflows from scratch. Memory systems, multi-tool agents, domain-specific solutions, and enterprise patterns.',

  // Archetype & Design
  archetype: {
    primary: 'Magician',
    secondary: 'Creator',
    values: ['Transformation', 'Innovation', 'Creativity', 'Automation'],
    description: 'Transforming business processes through creative workflow automation',
  },

  colors: {
    primary: '#FF6D5A',         // n8n brand coral (transformation, energy)
    primaryHover: '#FF5A47',    // n8n coral hover
    light: '#FFE4E0',           // coral light (warmth, approachability)
    dark: '#CC4A3A',            // coral dark (intensity)
    accent: '#8b5cf6',          // violet (transformation - Magician archetype)
  },

  // Content
  blogCount: 12,
  contentPath: 'n8n-agents',

  // Navigation
  externalLinks: [
    {
      label: 'n8n Platform',
      url: 'https://n8n.io',
      description: 'Workflow automation platform',
    },
    {
      label: 'n8n Documentation',
      url: 'https://docs.n8n.io',
      description: 'Official n8n documentation',
    },
    {
      label: 'n8n Community',
      url: 'https://community.n8n.io',
      description: 'Join the n8n community',
    },
  ],

  // Features
  enableSearch: true,
  enableRelated: true,
  enableTableOfContents: true,

  // Metadata
  author: 'n8n AI Agents Team',
  lastUpdated: '2025-12-19',
  difficulty: 'Mixed',
};
