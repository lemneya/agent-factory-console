/**
 * Capture Route Health Screenshots for ROUTE-HEALTH-NET-0 Evidence
 *
 * This script captures screenshots demonstrating:
 * 1. Same-origin OK: Probes succeed when using same-origin
 * 2. Localhost mismatch warning: Warning shows when probing localhost from non-local origin
 */

import { chromium } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = path.join(__dirname, '../evidence/ROUTE-HEALTH-NET-0');
const BASE_URL = process.env.NGROK_URL || 'http://localhost:3000';

async function captureSameOriginOk() {
  console.log('Capturing same-origin OK screenshot...');
  console.log(`Using URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Navigate to preview page - with same-origin, no preset override
  await page.goto(`${BASE_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });

  // Wait for health checks to complete
  await page.waitForTimeout(6000);

  // Capture the Route Health grid
  const grid = page.locator('[data-testid="route-health-grid"]');
  await grid.screenshot({
    path: path.join(EVIDENCE_DIR, 'same_origin_ok.png'),
    animations: 'disabled'
  });

  console.log('✅ Saved: same_origin_ok.png');
  await browser.close();
}

async function captureLocalhostMismatchWarning() {
  console.log('\nCapturing localhost mismatch warning screenshot...');
  console.log(`Using URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Navigate to preview page with preset param set to 'local' (localhost)
  await page.goto(`${BASE_URL}/preview?preset=local`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });

  // Wait for health checks
  await page.waitForTimeout(6000);

  // Capture the Route Health grid (should show warning if accessed from non-localhost)
  const grid = page.locator('[data-testid="route-health-grid"]');
  await grid.screenshot({
    path: path.join(EVIDENCE_DIR, 'localhost_mismatch_warning.png'),
    animations: 'disabled'
  });

  console.log('✅ Saved: localhost_mismatch_warning.png');
  await browser.close();
}

async function main() {
  console.log('=== ROUTE-HEALTH-NET-0 Evidence Capture ===\n');

  if (BASE_URL.includes('localhost')) {
    console.log('Note: Running from localhost. For full evidence, run with NGROK_URL=https://your-ngrok-url.ngrok.io');
  }

  try {
    await captureSameOriginOk();
    await captureLocalhostMismatchWarning();
    console.log('\n✅ Both screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    process.exit(1);
  }
}

main();
