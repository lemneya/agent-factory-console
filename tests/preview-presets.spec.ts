import { test, expect } from '@playwright/test';

test.describe('AFC-UX-PREVIEW-1: Preview Presets + Persistence', () => {
  test('/preview page renders with preset dropdown', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Preview');
    await expect(page.locator('[data-testid="preview-preset-select"]')).toBeVisible();
  });

  test('preset dropdown shows default presets', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    const dropdown = page.locator('[data-testid="preview-preset-select"]');
    await expect(dropdown).toBeVisible();
    // Should have at least the default "Local" preset
    await expect(dropdown).toContainText('Local');
  });

  test('edit presets button opens modal', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();

    const editBtn = page.locator('[data-testid="preset-editor-open"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Wait for modal with increased timeout
    await expect(page.locator('[data-testid="preset-editor-modal"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('preset editor modal has add preset button', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();

    await page.locator('[data-testid="preset-editor-open"]').click();
    const modal = page.locator('[data-testid="preset-editor-modal"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // The modal has preset rows with inputs and an add button
    await expect(modal.locator('[data-testid="add-preset-btn"]')).toBeVisible();
  });

  test('route health grid is visible', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="route-health-grid"]')).toBeVisible();
  });

  test('route health grid has refresh button', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="route-health-refresh"]')).toBeVisible();
  });

  test('open current route button is visible', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="preview-open-current"]')).toBeVisible();
  });

  test('deep link with path param loads that route', async ({ page }) => {
    await page.goto('/preview?path=/runs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();
    // Check that the route is reflected in the current path display
    await expect(page.locator('[data-testid="preview-current-path"]')).toContainText('/runs');
  });

  test('deep link with preset param selects that preset', async ({ page }) => {
    await page.goto('/preview?preset=local', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();
    const dropdown = page.locator('[data-testid="preview-preset-select"]');
    await expect(dropdown).toContainText('Local');
  });

  test('route health grid shows status legend', async ({ page }) => {
    await page.goto('/preview', { waitUntil: 'domcontentloaded' });
    const grid = page.locator('[data-testid="route-health-grid"]');
    // AFC-AUTH-UI-1: Updated legend - Healthy, Auth required, Error
    await expect(grid).toContainText('Healthy');
    await expect(grid).toContainText('Auth required');
    await expect(grid).toContainText('Error');
  });
});
