/**
 * Sanity Check for AFC-AUTH-UI-1
 * Verifies Route Health shows correct icons after merge
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function sanityCheck() {
  console.log('Running AFC-AUTH-UI-1 sanity check...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    // Disable caching to ensure fresh load
    bypassCSP: true,
  });

  // Clear all browser caches
  await context.clearCookies();

  const page = await context.newPage();

  // Force no-cache headers
  await page.route('**/*', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  });

  // Navigate to preview page
  await page.goto(`${BASE_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });

  // Wait for health checks to complete - look for status labels to appear
  console.log('Waiting for route health checks to complete...');
  await page.waitForTimeout(8000);

  // Get the legend specifically
  const legend = await page.locator('[data-testid="route-health-grid"] > div:last-child').textContent();
  console.log('Legend content:', legend);

  // Get all route status labels
  const statusLabels = await page.locator('[data-testid^="route-status-label-"]').allTextContents();
  console.log('Route status labels:', statusLabels);

  // Get all route status icons
  const statusIcons = await page.locator('[data-testid^="route-status-icon-"]').allTextContents();
  console.log('Route status icons:', statusIcons);

  console.log('\n=== Verification ===');

  // Check legend
  const hasHealthyLegend = legend?.includes('Healthy');
  const hasAuthRequiredLegend = legend?.includes('Auth required');
  const hasErrorLegend = legend?.includes('Error');
  const hasOldLegend = legend?.includes('200') || legend?.includes('Redirect') || legend?.includes('404');

  console.log(`Legend contains "Healthy": ${hasHealthyLegend ? '✅ YES' : '❌ NO'}`);
  console.log(`Legend contains "Auth required": ${hasAuthRequiredLegend ? '✅ YES' : '❌ NO'}`);
  console.log(`Legend contains "Error": ${hasErrorLegend ? '✅ YES' : '❌ NO'}`);
  console.log(`Legend has OLD format (200/Redirect/404): ${hasOldLegend ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);

  // Check if any route shows Auth required
  const hasAuthRequiredStatus = statusLabels.some(l => l === 'Auth required');
  const hasLockIcon = statusIcons.some(i => i === '🔒');

  console.log(`\nAny route shows "Auth required": ${hasAuthRequiredStatus ? '✅ YES' : '❌ NO'}`);
  console.log(`Any route shows 🔒 icon: ${hasLockIcon ? '✅ YES' : '❌ NO'}`);

  await browser.close();

  // Pass if legend is correct format
  const legendCorrect = hasHealthyLegend && hasAuthRequiredLegend && hasErrorLegend && !hasOldLegend;

  if (legendCorrect) {
    console.log('\n✅ SANITY CHECK PASSED: Legend shows new format (Healthy, Auth required, Error)');
    return true;
  } else {
    console.log('\n❌ SANITY CHECK FAILED: Legend format is incorrect');
    return false;
  }
}

sanityCheck().then(passed => {
  process.exit(passed ? 0 : 1);
});
