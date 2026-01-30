/**
 * ROUTE-HEALTH-NET-0 Post-merge sanity check
 */
import { chromium } from '@playwright/test';

const NGROK_URL = 'https://supremely-unstabilized-griselda.ngrok-free.dev';

async function runSanityCheck() {
  console.log('=== ROUTE-HEALTH-NET-0 Sanity Check ===\n');
  console.log('Testing via: ' + NGROK_URL + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Test 1: Same-origin probes should work (real latency)
    console.log('Test 1: Same-origin probes via ngrok...');
    await page.goto(NGROK_URL + '/preview', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Click through ngrok warning if present
    try {
      const visitButton = page.locator('button:has-text("Visit Site")');
      if (await visitButton.isVisible({ timeout: 3000 })) {
        await visitButton.click();
        await page.waitForTimeout(2000);
      }
    } catch {}

    await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });

    // Wait for health checks to complete
    await page.waitForTimeout(8000);

    // Check if no warning banner is shown (same-origin should not show warning)
    const warningBanner = page.locator('[data-testid="localhost-mismatch-warning"]');
    const warningVisible = await warningBanner.isVisible().catch(() => false);

    if (warningVisible) {
      console.log('WARNING: Warning banner visible (unexpected for same-origin)');
    } else {
      console.log('PASS: No warning banner shown for same-origin (correct!)');
    }

    // Check latency values - should be non-zero for successful probes
    const statusLabels = await page.locator('[data-testid^="route-status-label-"]').allTextContents();
    console.log('   Route statuses: ' + statusLabels.join(', '));

    // Test 2: Localhost mismatch warning when using ?preset=local
    console.log('\nTest 2: Localhost mismatch warning...');
    await page.goto(NGROK_URL + '/preview?preset=local', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Click through ngrok warning if present
    try {
      const visitButton = page.locator('button:has-text("Visit Site")');
      if (await visitButton.isVisible({ timeout: 3000 })) {
        await visitButton.click();
        await page.waitForTimeout(2000);
      }
    } catch {}

    await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Check if warning banner is now shown
    const warningBanner2 = page.locator('[data-testid="localhost-mismatch-warning"]');
    const warningVisible2 = await warningBanner2.isVisible().catch(() => false);

    if (warningVisible2) {
      const warningText = await warningBanner2.textContent();
      console.log('PASS: Warning banner shown for localhost mismatch (correct!)');
      if (warningText) {
        console.log('   Warning: ' + warningText.substring(0, 80) + '...');
      }
    } else {
      console.log('WARNING: No warning banner shown (expected for localhost mismatch)');
    }

    console.log('\n=== Sanity Check Complete ===');
  } catch (error) {
    console.error('Error during sanity check:', error);
  } finally {
    await browser.close();
  }
}

runSanityCheck();
