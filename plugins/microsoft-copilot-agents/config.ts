/**
 * Microsoft Copilot Agents Series Configuration
 * Plugin for Microsoft Copilot Agents blog series
 *
 * @archetype Hero (Achievement, Empowerment) + Professional (Business, Results)
 * @focus Business automation and enterprise productivity
 */

import { SeriesConfig } from '@/lib/series-config';

export const microsoftCopilotConfig: SeriesConfig = {
  // Identity
  id: 'microsoft-copilot-agents',
  name: 'Microsoft Copilot Agents',
  shortName: 'Copilot',
  description: 'Build, deploy, and scale AI agents for business automation with Microsoft Copilot',
  seoDescription: 'Master Microsoft Copilot Agents with our comprehensive 12-part blog series. From foundations to enterprise deployment, learn to build no-code AI agents for business automation.',

  // Archetype & Design
  archetype: {
    primary: 'Hero',
    secondary: 'Professional',
    values: ['Achievement', 'Empowerment', 'Business Results', 'Productivity'],
    description: 'Empowering business users to achieve productivity through AI automation',
  },

  colors: {
    primary: '#0078D4',         // Microsoft Blue (brand consistency)
    primaryHover: '#106EBE',    // Microsoft Blue hover
    light: '#DEECF9',           // Microsoft Blue light
    dark: '#004578',            // Microsoft Blue dark
  },

  // Content
  blogCount: 12,
  contentPath: 'microsoft-copilot-agents',

  // Navigation
  externalLinks: [
    {
      label: 'Copilot Studio',
      url: 'https://copilotstudio.microsoft.com',
      description: 'Build custom copilots and AI agents',
    },
    {
      label: 'Official Documentation',
      url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/',
      description: 'Microsoft Learn documentation',
    },
    {
      label: 'Community Forum',
      url: 'https://powerusers.microsoft.com/t5/Microsoft-Copilot-Studio/bd-p/PVACommunity',
      description: 'Connect with Copilot Studio community',
    },
  ],

  // Features
  enableSearch: true,
  enableRelated: true,
  enableTableOfContents: true,

  // Metadata
  author: 'Microsoft Copilot Agents Documentation Team',
  lastUpdated: '2025-12-19',
  difficulty: 'Beginner',
};
