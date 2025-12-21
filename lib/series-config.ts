/**
 * Series Configuration System
 * Plugin architecture for blog series management
 *
 * @pillar Meaningful (Pillar 1) - Archetypal coherence
 * @pillar Beautiful (Pillar 2) - Design system integration
 */

export interface ArchetypeConfig {
  primary: 'Sage' | 'Magician' | 'Explorer' | 'Hero' | 'Ruler' | 'Creator';
  secondary?: string;
  values: string[];
  description: string;
}

export interface ColorPalette {
  primary: string;              // Main brand color (CSS hex)
  primaryHover: string;          // Hover state
  light: string;                 // Light variant for backgrounds
  dark: string;                  // Dark variant for headers
  accent?: string;               // Optional secondary accent
}

export interface ExternalLink {
  label: string;
  url: string;
  description?: string;
}

export interface SeriesConfig {
  // Identity
  id: string;
  name: string;
  shortName?: string;           // For mobile navigation
  description: string;
  seoDescription: string;

  // Archetype & Design
  archetype: ArchetypeConfig;
  colors: ColorPalette;

  // Content
  blogCount: number;
  contentPath: string;          // Relative to /content directory

  // Navigation
  externalLinks?: ExternalLink[];
  heroImage?: string;

  // Features
  enableSearch?: boolean;
  enableRelated?: boolean;
  enableComments?: boolean;
  enableTableOfContents?: boolean;

  // Metadata
  author?: string;
  lastUpdated?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
}

/**
 * Series Registry
 * Import all series configurations and register them here
 */
import { contextEngineeringConfig } from '@/plugins/context-engineering/config';
import { mcpServersConfig } from '@/plugins/mcp-servers/config';
import { microsoftCopilotConfig } from '@/plugins/microsoft-copilot-agents/config';
import { n8nAgentsConfig } from '@/plugins/n8n-agents/config';

export const SERIES_REGISTRY: Record<string, SeriesConfig> = {
  'context-engineering': contextEngineeringConfig,
  'mcp-servers': mcpServersConfig,
  'microsoft-copilot-agents': microsoftCopilotConfig,
  'n8n-agents': n8nAgentsConfig,
};

/**
 * Get series configuration by ID
 * @throws Error if series not found
 */
export function getSeriesConfig(seriesId: string): SeriesConfig {
  const config = SERIES_REGISTRY[seriesId];
  if (!config) {
    throw new Error(`Series '${seriesId}' not found in registry. Available series: ${Object.keys(SERIES_REGISTRY).join(', ')}`);
  }
  return config;
}

/**
 * Get all series configurations
 */
export function getAllSeries(): SeriesConfig[] {
  return Object.values(SERIES_REGISTRY);
}

/**
 * Check if series exists
 */
export function seriesExists(seriesId: string): boolean {
  return seriesId in SERIES_REGISTRY;
}

/**
 * Get total blog count across all series
 */
export function getTotalBlogCount(): number {
  return Object.values(SERIES_REGISTRY).reduce(
    (total, series) => total + series.blogCount,
    0
  );
}
