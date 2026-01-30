import { chromium } from '@playwright/test';

async function debugScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/preview', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });
  await page.waitForTimeout(8000);

  // Get the legend HTML
  const legendHtml = await page.locator('[data-testid="route-health-grid"] > div:last-child').innerHTML();
  console.log('Legend HTML:', legendHtml);

  await page.screenshot({ path: '/tmp/debug-preview.png', fullPage: true });
  console.log('Screenshot saved to /tmp/debug-preview.png');

  await browser.close();
}

debugScreenshot();
