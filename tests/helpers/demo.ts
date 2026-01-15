import type { Page } from '@playwright/test';

/**
 * Enable demo mode for E2E tests by setting the afc_demo cookie.
 * This allows tests to see the full UI (read-only) instead of SignedOutCTA.
 */
export async function enableDemoMode(page: Page) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  await page.context().addCookies([
    {
      name: 'afc_demo',
      value: '1',
      url: baseURL,
      path: '/',
    },
  ]);
}
