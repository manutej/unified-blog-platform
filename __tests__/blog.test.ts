/**
 * Unit tests for the pure helpers in `lib/blog.ts`.
 *
 * These cover the filesystem-independent logic (difficulty styling, related /
 * adjacent blog selection, reading-time estimation) so `npm test` exercises
 * real behaviour without needing a running app or migrated content.
 */
import {
  getDifficultyColor,
  getRelatedBlogs,
  getAdjacentBlogs,
  calculateReadingTime,
  type BlogMetadata,
} from '@/lib/blog';

function makeBlog(overrides: Partial<BlogMetadata> = {}): BlogMetadata {
  return {
    slug: 'blog',
    title: 'Title',
    subtitle: 'Subtitle',
    difficulty: 'Beginner',
    readingTime: 5,
    learningObjectives: [],
    tags: [],
    publishedDate: '2025-01-01',
    seriesId: 'context-engineering',
    ...overrides,
  };
}

describe('getDifficultyColor', () => {
  it('returns distinct class strings for each difficulty level', () => {
    const levels: BlogMetadata['difficulty'][] = [
      'Beginner',
      'Intermediate',
      'Advanced',
      'Expert',
    ];
    const classes = levels.map(getDifficultyColor);
    // Every level produces a non-empty, unique class string.
    expect(new Set(classes).size).toBe(levels.length);
    classes.forEach((c) => expect(c.length).toBeGreaterThan(0));
  });

  it('maps Beginner to the green badge', () => {
    expect(getDifficultyColor('Beginner')).toContain('green');
  });
});

describe('calculateReadingTime', () => {
  it('rounds up to whole minutes at the default 200 wpm', () => {
    const content = Array(201).fill('word').join(' ');
    expect(calculateReadingTime(content)).toBe(2);
  });

  it('honours a custom words-per-minute rate', () => {
    const content = Array(100).fill('word').join(' ');
    expect(calculateReadingTime(content, 50)).toBe(2);
  });
});

describe('getAdjacentBlogs', () => {
  const blogs = [
    makeBlog({ slug: 'a' }),
    makeBlog({ slug: 'b' }),
    makeBlog({ slug: 'c' }),
  ];

  it('returns both neighbours for a middle blog', () => {
    const { prev, next } = getAdjacentBlogs(blogs[1], blogs);
    expect(prev?.slug).toBe('a');
    expect(next?.slug).toBe('c');
  });

  it('omits prev at the start and next at the end', () => {
    expect(getAdjacentBlogs(blogs[0], blogs).prev).toBeUndefined();
    expect(getAdjacentBlogs(blogs[2], blogs).next).toBeUndefined();
  });
});

describe('getRelatedBlogs', () => {
  it('ranks by shared-tag overlap and respects the limit', () => {
    const current = makeBlog({ slug: 'cur', tags: ['ai', 'rag', 'mcp'] });
    const all = [
      current,
      makeBlog({ slug: 'two', tags: ['ai', 'rag'] }), // 2 shared
      makeBlog({ slug: 'one', tags: ['ai'] }), // 1 shared
      makeBlog({ slug: 'none', tags: ['unrelated'] }), // 0 shared
    ];
    const related = getRelatedBlogs(current, all, 2);
    expect(related.map((b) => b.slug)).toEqual(['two', 'one']);
  });

  it('falls back to adjacent blogs when the current blog has no tags', () => {
    const all = [
      makeBlog({ slug: 'a', tags: [] }),
      makeBlog({ slug: 'b', tags: [] }),
      makeBlog({ slug: 'c', tags: [] }),
    ];
    const related = getRelatedBlogs(all[1], all);
    expect(related.map((b) => b.slug).sort()).toEqual(['a', 'c']);
  });
});
