/**
 * Capture Route Health Screenshots for AFC-AUTH-UI-1 Evidence
 *
 * This script captures screenshots of the Route Health panel:
 * 1. Signed out: Shows 🔒 Auth required for protected routes
 * 2. Signed in (via auth bypass): Shows ✅ Healthy for protected routes
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

const EVIDENCE_DIR = path.join(__dirname, '../evidence/AFC-AUTH-UI-1');
const BASE_URL = 'http://localhost:3000';

let devServer: ChildProcess | null = null;

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 401 || response.status === 403) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function stopExistingServer(): Promise<void> {
  return new Promise((resolve) => {
    const kill = spawn('pkill', ['-f', 'next dev'], { stdio: 'ignore' });
    kill.on('close', () => {
      setTimeout(resolve, 2000);
    });
  });
}

async function startServer(authBypass: boolean): Promise<void> {
  await stopExistingServer();

  console.log(`Starting server with auth bypass: ${authBypass}`);

  const env = {
    ...process.env,
    NEXT_PUBLIC_DEV_AUTH_BYPASS: authBypass ? 'true' : 'false',
  };

  devServer = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    env,
    stdio: 'ignore',
    detached: true,
  });

  const ready = await waitForServer(BASE_URL);
  if (!ready) {
    throw new Error('Server failed to start');
  }
  console.log('Server ready');
}

async function captureScreenshot(filename: string): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="route-health-grid"]', { timeout: 30000 });

  // Wait for health checks to complete
  await page.waitForTimeout(6000);

  const grid = page.locator('[data-testid="route-health-grid"]');
  await grid.screenshot({
    path: path.join(EVIDENCE_DIR, filename),
    animations: 'disabled'
  });

  console.log(`✅ Saved: ${filename}`);
  await browser.close();
}

async function main() {
  try {
    // Capture signed-out state (no auth bypass)
    console.log('\n=== Capturing signed-out state ===');
    await startServer(false);
    await captureScreenshot('signed_out_route_health.png');

    // Capture signed-in state (with auth bypass)
    console.log('\n=== Capturing signed-in state ===');
    await startServer(true);
    await captureScreenshot('signed_in_route_health.png');

    console.log('\n✅ Both screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    process.exit(1);
  } finally {
    await stopExistingServer();
  }
}

main();
