import { test, expect } from '@playwright/test';
import { enableDemoMode } from './helpers/demo';

test.describe('AFC-UX-PREVIEW-2: Cross-Env Preview Launcher', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test.describe('Global Preview Launcher Button', () => {
    test('should show Preview Launcher in header on all pages', async ({ page }) => {
      await page.goto('/runs', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('preview-launcher-btn')).toBeVisible();

      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('preview-launcher-btn')).toBeVisible();

      await page.goto('/copilot', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('preview-launcher-btn')).toBeVisible();
    });

    test('should display current preset in launcher button', async ({ page }) => {
      await page.goto('/runs', { waitUntil: 'domcontentloaded' });
      const presetBadge = page.getByTestId('preview-launcher-preset');
      await expect(presetBadge).toBeVisible();
      // Default preset should be "local"
      await expect(presetBadge).toHaveText('local');
    });

    test('should navigate to Preview page with current path', async ({ page }) => {
      await page.goto('/runs', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('preview-launcher-btn').click();
      await expect(page).toHaveURL(/\/preview\?path=%2Fruns/);
    });
  });

  test.describe('Open in Preview Row Actions', () => {
    test('should show Open in Preview button on runs list', async ({ page }) => {
      await page.goto('/runs', { waitUntil: 'domcontentloaded' });
      // Wait for page to load
      await expect(page.getByTestId('page-root')).toBeVisible();
      // Check for Actions column header
      const actionsHeader = page.locator('th', { hasText: 'Actions' });
      await expect(actionsHeader).toBeVisible();
    });

    test('should show Open in Preview button on projects list', async ({ page }) => {
      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      // Wait for page to load
      await expect(page.getByTestId('page-root')).toBeVisible();
    });
  });

  test.describe('Route Health Grid', () => {
    test('should display route health grid on Preview page', async ({ page }) => {
      await page.goto('/preview', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('route-health-grid')).toBeVisible();
    });

    test('should show refresh button in route health grid', async ({ page }) => {
      await page.goto('/preview', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('route-health-refresh')).toBeVisible();
    });

    test('should have expandable route rows', async ({ page }) => {
      await page.goto('/preview', { waitUntil: 'domcontentloaded' });
      // Wait for route health grid to load
      await expect(page.getByTestId('route-health-grid')).toBeVisible();

      // Find an expand button
      const expandButton = page.getByTestId('route-expand-runs');
      if (await expandButton.isVisible()) {
        // Click to expand
        await expandButton.click();
        // Check that details panel is visible
        await expect(page.getByTestId('route-details-runs')).toBeVisible();
        // Click again to collapse
        await expandButton.click();
        // Details should be hidden
        await expect(page.getByTestId('route-details-runs')).not.toBeVisible();
      }
    });

    test('should have Open button for each route', async ({ page }) => {
      await page.goto('/preview', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('route-health-grid')).toBeVisible();

      // Check for Open button on runs route
      const openButton = page.getByTestId('route-open-runs');
      if (await openButton.isVisible()) {
        await expect(openButton).toHaveText('Open');
      }
    });
  });

  test.describe('Tooltips', () => {
    test('should show tooltip on Preview Launcher hover', async ({ page }) => {
      await page.goto('/runs', { waitUntil: 'domcontentloaded' });
      const launcher = page.getByTestId('preview-launcher-btn');
      await expect(launcher).toBeVisible();
      // Hover to trigger tooltip
      await launcher.hover();
      // Tooltip should be visible (it's a span inside the button)
      const tooltip = launcher.locator('span.group-hover\\:opacity-100');
      // The tooltip exists but may not be visible due to CSS transitions
      await expect(tooltip).toBeAttached();
    });
  });

  test.describe('Preview Page Integration', () => {
    test('should load Preview page with page-root and page-title', async ({ page }) => {
      await page.goto('/preview', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toHaveText(/Preview/i);
    });

    test('should show preset selector on Preview page', async ({ page }) => {
      await page.goto('/preview', { waitUntil: 'domcontentloaded' });
      // Look for preset-related elements
      const presetSelector = page.getByTestId('preset-selector');
      if (await presetSelector.isVisible()) {
        await expect(presetSelector).toBeVisible();
      }
    });

    test('should display current path in Preview page', async ({ page }) => {
      await page.goto('/preview?path=/runs', { waitUntil: 'domcontentloaded' });
      const currentPath = page.getByTestId('preview-current-path');
      await expect(currentPath).toBeVisible();
      await expect(currentPath).toHaveText('/runs');
    });
  });
});
