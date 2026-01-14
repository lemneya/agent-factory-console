import { test, expect } from '@playwright/test';

/**
 * UX-GATE-0: Navigation Smoke Test
 *
 * This test verifies that all navigation routes exist and render properly.
 * It clicks each sidebar link in order and asserts that:
 * 1. The page renders without 404
 * 2. The page has a data-testid="page-root" wrapper
 * 3. The page has an H1 with data-testid="page-title" that is non-empty
 *
 * Note: Pages may show "Sign in required" - that's fine for Gate-0.
 * We're only verifying "route exists + renders."
 */

// Navigation items in the exact order from NAV_ITEMS (src/config/nav.tsx)
// This must match the SSOT in src/config/nav.tsx
const NAV_ROUTES = [
  { key: 'dashboard', href: '/', label: 'Dashboard' },
  { key: 'preview', href: '/preview', label: 'Preview' },
  { key: 'projects', href: '/projects', label: 'Projects' },
  { key: 'runs', href: '/runs', label: 'Runs' },
  { key: 'blueprints', href: '/blueprints', label: 'Blueprints' },
  { key: 'workorders', href: '/workorders', label: 'WorkOrders' },
  { key: 'assets', href: '/assets', label: 'Assets' },
  { key: 'council', href: '/council', label: 'Council' },
  { key: 'memory', href: '/memory', label: 'Memory' },
  { key: 'audit', href: '/audit', label: 'Audit' },
  { key: 'notifications', href: '/notifications', label: 'Notifications' },
  { key: 'copilot', href: '/copilot', label: 'Copilot' },
  { key: 'drafts', href: '/drafts', label: 'Drafts' },
];

test.describe('UX-GATE-0: Navigation Smoke Test', () => {
  test('sidebar contains all expected navigation items', async ({ page }) => {
    await page.goto('/');

    // Check sidebar exists
    const sidebar = page.locator('[data-testid="sidebar-nav"]');
    await expect(sidebar).toBeVisible();

    // Check all nav items are present by data-testid (stable, not count-based)
    for (const route of NAV_ROUTES) {
      const navLink = page.getByTestId(`nav-${route.key}`);
      await expect(navLink).toBeVisible();
      await expect(navLink).toHaveAttribute('href', route.href);
    }
  });

  test('dashboard quick links route correctly (no 404)', async ({ page }) => {
    await page.goto('/');

    // Quick links exclude dashboard (we're already on it)
    const quickLinkRoutes = NAV_ROUTES.filter(r => r.key !== 'dashboard');

    for (const route of quickLinkRoutes) {
      const quickLink = page.locator(`[data-testid="quick-link-${route.key}"]`);
      // Quick links may not exist for all routes - only check if visible
      const isVisible = await quickLink.isVisible().catch(() => false);
      if (isVisible) {
        await expect(quickLink).toHaveAttribute('href', route.href);
      }
    }
  });

  test.describe('each route renders with page shell', () => {
    for (const route of NAV_ROUTES) {
      test(`${route.label} (${route.href}) renders with title`, async ({ page }) => {
        // Navigate to the route
        await page.goto(route.href);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check page root exists
        const pageRoot = page.locator('[data-testid="page-root"]');
        await expect(pageRoot).toBeVisible({ timeout: 10000 });

        // Check page title exists and is non-empty
        const pageTitle = page.locator('[data-testid="page-title"]');
        await expect(pageTitle).toBeVisible();
        const titleText = await pageTitle.textContent();
        expect(titleText).toBeTruthy();
        expect(titleText!.trim().length).toBeGreaterThan(0);
      });
    }
  });

  test('clicking each sidebar link navigates correctly', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();

    // Click each sidebar link in order
    for (const route of NAV_ROUTES) {
      // Click the nav link
      await page.getByTestId(`nav-${route.key}`).click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Verify we're on the correct page
      if (route.href === '/') {
        await expect(page).toHaveURL(/\/$/);
      } else {
        await expect(page).toHaveURL(new RegExp(`${route.href}$`));
      }

      // Verify page renders
      const pageRoot = page.locator('[data-testid="page-root"]');
      await expect(pageRoot).toBeVisible({ timeout: 10000 });

      // Verify title exists
      const pageTitle = page.locator('[data-testid="page-title"]');
      await expect(pageTitle).toBeVisible();
    }
  });
});
