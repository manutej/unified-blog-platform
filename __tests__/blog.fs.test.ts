/**
 * Behavioral verification for the repaired Jest harness against the
 * filesystem-backed functions in `lib/blog.ts` (`getAllBlogs`,
 * `getBlogBySlug`) using the real `content/` tree shipped in the repo.
 *
 * These were the uncovered lines in the initial unit suite; running them
 * here proves the jest.config.js pipeline (next/jest + @/ alias + TS)
 * handles fresh test files and Node built-ins (fs, path) out of the box.
 */
import { getAllBlogs, getBlogBySlug } from '@/lib/blog';

describe('getAllBlogs (real content tree)', () => {
  it('loads the context-engineering series sorted by blog number', () => {
    const blogs = getAllBlogs('context-engineering');
    expect(blogs.length).toBeGreaterThan(0);
    blogs.forEach((b) => {
      expect(b.seriesId).toBe('context-engineering');
      expect(typeof b.title).toBe('string');
      expect(b.title.length).toBeGreaterThan(0);
    });
    const numbers = blogs.map((b) => b.blogNumber ?? 0);
    expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
  });

  it('returns an empty array (not a throw) for an unknown series', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getAllBlogs('no-such-series')).toEqual([]);
    warn.mockRestore();
  });
});

describe('getBlogBySlug (real content tree)', () => {
  it('loads a known blog with frontmatter metadata and markdown body', () => {
    const { metadata, content } = getBlogBySlug(
      'context-engineering',
      '01-foundational-theory'
    );
    expect(metadata.slug).toBe('01-foundational-theory');
    expect(metadata.seriesId).toBe('context-engineering');
    expect(metadata.blogNumber).toBe(1);
    expect(content.length).toBeGreaterThan(100);
  });

  it('throws a descriptive error for a missing slug', () => {
    expect(() =>
      getBlogBySlug('context-engineering', 'does-not-exist')
    ).toThrow('Blog not found: context-engineering/does-not-exist');
  });
});
