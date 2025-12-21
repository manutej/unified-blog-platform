/**
 * Blog Content Management Library
 * Handles blog metadata parsing and content aggregation
 *
 * @pillar Secure (Pillar 4) - Safe file handling, path validation
 * @pillar Documented (Pillar 7) - Comprehensive JSDoc annotations
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Blog metadata interface
 * Extracted from frontmatter in markdown files
 */
export interface BlogMetadata {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  readingTime: number;
  handsOnTime?: number;
  learningObjectives: string[];
  prerequisites?: string[];
  tags: string[];
  publishedDate: string;
  lastUpdated?: string;
  author?: string;
  seriesId: string;
  blogNumber?: number;        // Position in series (1-12)
}

/**
 * Complete blog content with metadata
 */
export interface BlogContent {
  metadata: BlogMetadata;
  content: string;             // Raw markdown content
}

/**
 * Get all blogs for a specific series
 * @param seriesId - Series identifier (e.g., 'context-engineering')
 * @returns Array of blog metadata sorted by blog number
 */
export function getAllBlogs(seriesId: string): BlogMetadata[] {
  const seriesPath = path.join(process.cwd(), 'content', seriesId);

  // Validate series directory exists
  if (!fs.existsSync(seriesPath)) {
    console.warn(`Series directory not found: ${seriesPath}`);
    return [];
  }

  const files = fs.readdirSync(seriesPath)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  return files.map((filename, index) => {
    const filePath = path.join(seriesPath, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    // Extract blog number from filename (e.g., "01-introduction.md" → 1)
    const blogNumber = parseInt(filename.split('-')[0]) || index + 1;

    return {
      slug: filename.replace(/\.(md|mdx)$/, ''),
      seriesId,
      blogNumber,
      ...data,
    } as BlogMetadata;
  }).sort((a, b) => {
    // Sort by blog number
    return (a.blogNumber || 0) - (b.blogNumber || 0);
  });
}

/**
 * Get a single blog by slug
 * @param seriesId - Series identifier
 * @param slug - Blog slug (filename without extension)
 * @returns Blog content with metadata
 */
export function getBlogBySlug(seriesId: string, slug: string): BlogContent {
  const fileName = `${slug}.md`;
  const filePath = path.join(process.cwd(), 'content', seriesId, fileName);

  // Try .mdx if .md doesn't exist
  let actualPath = filePath;
  if (!fs.existsSync(filePath)) {
    const mdxPath = filePath.replace('.md', '.mdx');
    if (fs.existsSync(mdxPath)) {
      actualPath = mdxPath;
    } else {
      throw new Error(`Blog not found: ${seriesId}/${slug}`);
    }
  }

  const fileContent = fs.readFileSync(actualPath, 'utf-8');
  const { data, content } = matter(fileContent);

  // Extract blog number from slug
  const blogNumber = parseInt(slug.split('-')[0]) || undefined;

  return {
    metadata: {
      slug,
      seriesId,
      blogNumber,
      ...data,
    } as BlogMetadata,
    content,
  };
}

/**
 * Get difficulty badge colors
 * @param difficulty - Blog difficulty level
 * @returns Tailwind CSS classes for difficulty badge
 */
export function getDifficultyColor(difficulty: BlogMetadata['difficulty']): string {
  const colors = {
    Beginner: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
    Intermediate: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
    Advanced: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800',
    Expert: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
  };
  return colors[difficulty];
}

/**
 * Get related blogs based on tags
 * @param currentBlog - Current blog metadata
 * @param allBlogs - All blogs in series
 * @param limit - Maximum number of related blogs to return
 * @returns Array of related blog metadata
 */
export function getRelatedBlogs(
  currentBlog: BlogMetadata,
  allBlogs: BlogMetadata[],
  limit: number = 3
): BlogMetadata[] {
  if (!currentBlog.tags || currentBlog.tags.length === 0) {
    // Return next/previous blogs if no tags
    const currentIndex = allBlogs.findIndex(b => b.slug === currentBlog.slug);
    const related: BlogMetadata[] = [];

    if (currentIndex > 0) related.push(allBlogs[currentIndex - 1]);
    if (currentIndex < allBlogs.length - 1) related.push(allBlogs[currentIndex + 1]);

    return related.slice(0, limit);
  }

  // Score blogs by tag overlap
  const scored = allBlogs
    .filter(blog => blog.slug !== currentBlog.slug)
    .map(blog => {
      const sharedTags = (blog.tags || []).filter(tag =>
        currentBlog.tags.includes(tag)
      );
      return {
        blog,
        score: sharedTags.length,
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.blog);
}

/**
 * Get previous/next blog in series
 * @param currentBlog - Current blog metadata
 * @param allBlogs - All blogs in series
 * @returns Object with prev and next blog metadata (undefined if at boundary)
 */
export function getAdjacentBlogs(
  currentBlog: BlogMetadata,
  allBlogs: BlogMetadata[]
): { prev?: BlogMetadata; next?: BlogMetadata } {
  const currentIndex = allBlogs.findIndex(b => b.slug === currentBlog.slug);

  return {
    prev: currentIndex > 0 ? allBlogs[currentIndex - 1] : undefined,
    next: currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : undefined,
  };
}

/**
 * Calculate estimated reading time
 * @param content - Markdown content
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
