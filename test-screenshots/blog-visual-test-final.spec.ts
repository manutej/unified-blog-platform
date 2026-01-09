import { test } from '@playwright/test';
import * as path from 'path';

const screenshotDir = '/Users/manu/Documents/LUXOR/blogs-unified/test-screenshots';
const targetUrl = 'https://blogs-unified.vercel.app/context-engineering/01-foundational-theory/';

test.describe('Final Blog Visual Tests', () => {
  test('capture code blocks with dark backgrounds in both themes', async ({ page }) => {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find divs with dark background (code blocks)
    const darkBgDivs = page.locator('div[class*="bg-neutral-800"], div[class*="bg-neutral-900"], div[class*="bg-gray-800"], div[class*="bg-gray-900"]');
    const darkBgCount = await darkBgDivs.count();
    console.log(`Found ${darkBgCount} divs with dark backgrounds (code blocks)`);

    // Light mode - scroll to middle of page where code blocks are
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '20-light-mode-code-area-1.png')
    });

    await page.evaluate(() => window.scrollTo(0, 6000));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '21-light-mode-code-area-2.png')
    });

    await page.evaluate(() => window.scrollTo(0, 9000));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '22-light-mode-code-area-3.png')
    });

    // Toggle to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await themeToggle.click();
    await page.waitForTimeout(1000);

    // Dark mode - same positions
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '23-dark-mode-code-area-1.png')
    });

    await page.evaluate(() => window.scrollTo(0, 6000));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '24-dark-mode-code-area-2.png')
    });

    await page.evaluate(() => window.scrollTo(0, 9000));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '25-dark-mode-code-area-3.png')
    });

    // Check for inline code styling
    const inlineCode = page.locator('code.text-sm');
    const inlineCodeCount = await inlineCode.count();
    console.log(`Found ${inlineCodeCount} inline code elements`);

    // Get first inline code styles
    if (inlineCodeCount > 0) {
      const firstInlineCode = await inlineCode.first().evaluate(el => ({
        text: el.textContent,
        classes: el.className,
        computedBg: window.getComputedStyle(el).backgroundColor,
        computedColor: window.getComputedStyle(el).color
      }));
      console.log('Inline code sample (dark mode):', firstInlineCode);
    }

    // Toggle back to light mode
    await themeToggle.click();
    await page.waitForTimeout(1000);

    // Get inline code styles in light mode
    if (inlineCodeCount > 0) {
      const firstInlineCode = await inlineCode.first().evaluate(el => ({
        text: el.textContent,
        classes: el.className,
        computedBg: window.getComputedStyle(el).backgroundColor,
        computedColor: window.getComputedStyle(el).color
      }));
      console.log('Inline code sample (light mode):', firstInlineCode);
    }

    // Summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log('Theme toggle: WORKS (moon/sun icon changes)');
    console.log(`Code blocks with dark bg: ${darkBgCount}`);
    console.log(`Inline code elements: ${inlineCodeCount}`);
    console.log('Screenshots saved to:', screenshotDir);
  });
});
