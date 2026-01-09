import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotDir = '/Users/manu/Documents/LUXOR/blogs-unified/test-screenshots';
const targetUrl = 'https://blogs-unified.vercel.app/context-engineering/01-foundational-theory/';

test.describe('Blog Code Block Screenshots', () => {
  test('capture code blocks in light mode', async ({ page }) => {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Find code blocks using various selectors
    const codeSelectors = [
      'pre',
      'code',
      '[class*="highlight"]',
      '[class*="prism"]',
      '[class*="syntax"]',
      '[class*="code"]',
      '.prose pre',
      '.prose code'
    ];

    for (const selector of codeSelectors) {
      const elements = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${elements} elements`);
    }

    // Get page HTML structure around code
    const codeHTML = await page.evaluate(() => {
      const codeElements = document.querySelectorAll('pre, code, [class*="code"]');
      return Array.from(codeElements).slice(0, 5).map(el => ({
        tag: el.tagName,
        class: el.className,
        parent: el.parentElement?.tagName + '.' + el.parentElement?.className
      }));
    });
    console.log('Code element structure:', JSON.stringify(codeHTML, null, 2));

    // Scroll down to find code blocks
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 500);
        await new Promise(r => setTimeout(r, 200));
      }
    });
    await page.waitForTimeout(1000);

    // Take screenshot where we are (should show code)
    await page.screenshot({
      path: path.join(screenshotDir, '15-light-mode-scrolled-to-code.png')
    });

    // Now toggle to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
    }

    // Same position in dark mode
    await page.screenshot({
      path: path.join(screenshotDir, '16-dark-mode-scrolled-to-code.png')
    });

    // Scroll more to find more code
    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, 500);
        await new Promise(r => setTimeout(r, 100));
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '17-dark-mode-more-code.png')
    });

    // Toggle back to light
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '18-light-mode-more-code.png')
    });
  });
});
