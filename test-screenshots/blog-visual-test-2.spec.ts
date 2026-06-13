import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotDir = '/Users/manu/Documents/LUXOR/blogs-unified/test-screenshots';
const targetUrl = 'https://blogs-unified.vercel.app/context-engineering/01-foundational-theory/';

test.describe('Blog Page Code Snippet Comparison', () => {
  test('capture code snippets in both themes for comparison', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find all pre blocks (code snippets)
    const preBlocks = page.locator('pre');
    const preCount = await preBlocks.count();
    console.log(`Found ${preCount} pre blocks`);

    // Start in light mode - scroll to first code block
    if (preCount > 0) {
      await preBlocks.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot first code block in light mode
      await page.screenshot({
        path: path.join(screenshotDir, '09-light-mode-code-block-1.png')
      });

      // Scroll to second code block if exists
      if (preCount > 1) {
        await preBlocks.nth(1).scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotDir, '10-light-mode-code-block-2.png')
        });
      }
    }

    // Toggle to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
    }

    // Screenshot same code blocks in dark mode
    if (preCount > 0) {
      await preBlocks.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, '11-dark-mode-code-block-1.png')
      });

      if (preCount > 1) {
        await preBlocks.nth(1).scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotDir, '12-dark-mode-code-block-2.png')
        });
      }
    }

    // Check for any img tags or picture elements
    const imgTags = await page.locator('img').all();
    const pictureTags = await page.locator('picture').all();
    const svgTags = await page.locator('svg').all();

    console.log(`\n=== IMAGE ELEMENTS ===`);
    console.log(`img tags: ${imgTags.length}`);
    console.log(`picture tags: ${pictureTags.length}`);
    console.log(`svg tags: ${svgTags.length}`);

    // Check for background images
    const elementsWithBgImage = await page.evaluate(() => {
      const elements: string[] = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          elements.push(`${el.tagName}.${el.className}: ${style.backgroundImage.substring(0, 100)}`);
        }
      });
      return elements;
    });

    console.log(`\nElements with background images: ${elementsWithBgImage.length}`);
    elementsWithBgImage.slice(0, 10).forEach(e => console.log(e));

    // Check for any failed resource loads
    const failedResources = await page.evaluate(() => {
      const failed: string[] = [];
      performance.getEntriesByType('resource').forEach((entry) => {
        if (entry instanceof PerformanceResourceTiming && entry.transferSize === 0 && entry.decodedBodySize === 0) {
          // Potentially failed or cached
        }
      });
      return failed;
    });

    // Look for nanobanana references in the page source
    const pageContent = await page.content();
    const nanobananaMentions = pageContent.match(/nanobanana/gi);
    console.log(`\nNanobanana mentions in page source: ${nanobananaMentions?.length || 0}`);

    // Check if there are any image-related console warnings
    console.log(`\n=== CONSOLE ERRORS ===`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    consoleErrors.forEach(err => console.log(err));

    // Take a screenshot of the entire viewport in dark mode
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, '13-dark-mode-header-area.png')
    });

    // Scroll to bottom and take screenshot
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, '14-dark-mode-footer-area.png')
    });
  });
});
