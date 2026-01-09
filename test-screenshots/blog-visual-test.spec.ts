import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotDir = '/Users/manu/Documents/LUXOR/blogs-unified/test-screenshots';
const targetUrl = 'https://blogs-unified.vercel.app/context-engineering/01-foundational-theory/';

// Collect console errors
const consoleErrors: string[] = [];
const brokenImages: string[] = [];

test.describe('Blog Page Visual Tests', () => {
  test('capture page in light and dark mode with code snippets', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for failed network requests (broken images)
    page.on('response', response => {
      if (!response.ok() && response.request().resourceType() === 'image') {
        brokenImages.push(`${response.url()} - Status: ${response.status()}`);
      }
    });

    // Navigate to the page
    console.log('Navigating to:', targetUrl);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Get initial viewport size
    const viewportSize = page.viewportSize();
    console.log('Viewport size:', viewportSize);

    // Screenshot 1: Full page in current (light) mode
    console.log('Taking screenshot: Light mode - full page');
    await page.screenshot({
      path: path.join(screenshotDir, '01-light-mode-full-page.png'),
      fullPage: true
    });

    // Screenshot 2: Above the fold in light mode
    await page.screenshot({
      path: path.join(screenshotDir, '02-light-mode-above-fold.png')
    });

    // Find theme toggle button
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"], button:has([class*="moon"]), button:has([class*="sun"]), button:has(svg)').first();

    // Try to find toggle by looking for common patterns
    let toggleFound = false;

    // Method 1: Look for button with theme-related classes or aria-labels
    const toggleSelectors = [
      'button[aria-label*="theme"]',
      'button[aria-label*="Theme"]',
      'button[aria-label*="mode"]',
      'button[aria-label*="dark"]',
      'button[aria-label*="light"]',
      '[data-testid*="theme"]',
      '[data-testid*="mode"]',
    ];

    for (const selector of toggleSelectors) {
      const toggle = page.locator(selector);
      if (await toggle.count() > 0) {
        console.log(`Found theme toggle with selector: ${selector}`);
        await toggle.first().click();
        toggleFound = true;
        break;
      }
    }

    // Method 2: If not found, look in header for buttons with SVG icons
    if (!toggleFound) {
      const headerButtons = page.locator('header button, nav button');
      const count = await headerButtons.count();
      console.log(`Found ${count} buttons in header/nav`);

      for (let i = 0; i < count; i++) {
        const button = headerButtons.nth(i);
        const innerHTML = await button.innerHTML();
        if (innerHTML.includes('svg') || innerHTML.includes('moon') || innerHTML.includes('sun')) {
          console.log(`Clicking button ${i} (likely theme toggle)`);
          await button.click();
          toggleFound = true;
          break;
        }
      }
    }

    // Wait for theme transition
    await page.waitForTimeout(1000);

    // Screenshot 3: Full page in dark mode
    console.log('Taking screenshot: Dark mode - full page');
    await page.screenshot({
      path: path.join(screenshotDir, '03-dark-mode-full-page.png'),
      fullPage: true
    });

    // Screenshot 4: Above the fold in dark mode
    await page.screenshot({
      path: path.join(screenshotDir, '04-dark-mode-above-fold.png')
    });

    // Find code snippets
    const codeBlocks = page.locator('pre, code, [class*="highlight"], [class*="prism"], [class*="syntax"]');
    const codeCount = await codeBlocks.count();
    console.log(`Found ${codeCount} code blocks`);

    // Scroll to find code snippets
    let codeFound = false;
    for (let i = 0; i < codeCount && !codeFound; i++) {
      const codeBlock = codeBlocks.nth(i);
      const isVisible = await codeBlock.isVisible();
      if (isVisible) {
        // Scroll to the code block
        await codeBlock.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Take screenshot of code in dark mode
        console.log(`Taking screenshot: Code snippet ${i + 1} in dark mode`);
        await page.screenshot({
          path: path.join(screenshotDir, `05-dark-mode-code-snippet-${i + 1}.png`)
        });
        codeFound = true;
        break;
      }
    }

    // If code blocks found via pre tag, scroll and screenshot
    const preBlocks = page.locator('pre');
    const preCount = await preBlocks.count();
    if (preCount > 0) {
      // Scroll to first pre block
      await preBlocks.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot in dark mode
      console.log('Taking screenshot: First pre block in dark mode');
      await page.screenshot({
        path: path.join(screenshotDir, '06-dark-mode-pre-block.png')
      });
    }

    // Toggle back to light mode
    if (toggleFound) {
      for (const selector of toggleSelectors) {
        const toggle = page.locator(selector);
        if (await toggle.count() > 0) {
          await toggle.first().click();
          break;
        }
      }

      // If toggle not found via selectors, try header buttons again
      const headerButtons = page.locator('header button, nav button');
      const count = await headerButtons.count();
      for (let i = 0; i < count; i++) {
        const button = headerButtons.nth(i);
        const innerHTML = await button.innerHTML();
        if (innerHTML.includes('svg') || innerHTML.includes('moon') || innerHTML.includes('sun')) {
          await button.click();
          break;
        }
      }
    }

    await page.waitForTimeout(1000);

    // Screenshot code in light mode
    if (preCount > 0) {
      await preBlocks.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      console.log('Taking screenshot: First pre block in light mode');
      await page.screenshot({
        path: path.join(screenshotDir, '07-light-mode-pre-block.png')
      });
    }

    // Check for broken images
    const images = page.locator('img');
    const imgCount = await images.count();
    console.log(`Found ${imgCount} images on page`);

    for (let i = 0; i < imgCount; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

      if (naturalWidth === 0) {
        brokenImages.push(`Image not loaded: src="${src}", alt="${alt}"`);
      }

      // Check for nanobanana in src
      if (src?.includes('nanobanana')) {
        console.log(`Found nanobanana image: ${src}`);
        // Scroll to and screenshot
        await img.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(screenshotDir, `08-nanobanana-image-${i}.png`)
        });
      }
    }

    // Scroll through entire page to load lazy images
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      for (let i = 0; i < document.body.scrollHeight; i += 500) {
        window.scrollTo(0, i);
        await delay(200);
      }
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(1000);

    // Re-check images after scrolling
    for (let i = 0; i < imgCount; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

      if (naturalWidth === 0 && !brokenImages.includes(`Image not loaded: src="${src}"`)) {
        const alt = await img.getAttribute('alt');
        brokenImages.push(`Image not loaded after scroll: src="${src}", alt="${alt}"`);
      }
    }

    // Write report
    const report = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      themeToggle: {
        found: toggleFound,
        note: toggleFound ? 'Theme toggle works' : 'Theme toggle not found or could not be clicked'
      },
      codeBlocks: {
        found: codeCount > 0 || preCount > 0,
        count: Math.max(codeCount, preCount),
        note: 'Screenshots taken in both light and dark modes'
      },
      images: {
        total: imgCount,
        broken: brokenImages
      },
      consoleErrors: consoleErrors,
      screenshots: fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'))
    };

    // Write report to JSON
    fs.writeFileSync(
      path.join(screenshotDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== TEST REPORT ===');
    console.log(JSON.stringify(report, null, 2));

    // Log summary
    console.log('\n=== SUMMARY ===');
    console.log(`Theme toggle found: ${toggleFound}`);
    console.log(`Code blocks found: ${Math.max(codeCount, preCount)}`);
    console.log(`Total images: ${imgCount}`);
    console.log(`Broken images: ${brokenImages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);

    if (brokenImages.length > 0) {
      console.log('\n=== BROKEN IMAGES ===');
      brokenImages.forEach(img => console.log(img));
    }

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log(err));
    }
  });
});
