/**
 * MCP Servers Series Configuration
 * Plugin for Model Context Protocol blog series
 *
 * @archetype Ruler (Authority, Standards) + Architect (Structure, System)
 * @focus Protocol specification and technical standards
 */

import { SeriesConfig } from '@/lib/series-config';

export const mcpServersConfig: SeriesConfig = {
  // Identity
  id: 'mcp-servers',
  name: 'MCP Servers',
  shortName: 'MCP',
  description: 'Model Context Protocol implementation from basics to enterprise deployment',
  seoDescription: 'Complete guide to building MCP servers. Learn protocol fundamentals, client integration, security, testing, and scaling strategies for production deployments.',

  // Archetype & Design
  archetype: {
    primary: 'Ruler',
    secondary: 'Architect',
    values: ['Authority', 'Standards', 'Structure', 'Precision'],
    description: 'Technical standards and systematic protocol implementation',
  },

  colors: {
    primary: '#06b6d4',         // cyan-500 (Protocol clarity, technical precision)
    primaryHover: '#0891b2',    // cyan-600
    light: '#cffafe',           // cyan-50 (transparency, clarity)
    dark: '#164e63',            // cyan-900 (technical depth)
  },

  // Content
  blogCount: 12,
  contentPath: 'mcp-servers',

  // Navigation
  externalLinks: [
    {
      label: 'MCP Specification',
      url: 'https://modelcontextprotocol.io',
      description: 'Official Model Context Protocol documentation',
    },
    {
      label: 'GitHub Repository',
      url: 'https://github.com/modelcontextprotocol',
      description: 'MCP server implementations and tools',
    },
  ],

  // Features
  enableSearch: true,
  enableRelated: true,
  enableTableOfContents: true,

  // Metadata
  author: 'MCP Documentation Team',
  lastUpdated: '2025-12-19',
  difficulty: 'Advanced',
};
