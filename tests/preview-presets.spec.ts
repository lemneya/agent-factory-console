import { test, expect } from '@playwright/test';

test.describe('AFC-UX-PREVIEW-1: Preview Presets + Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/preview');
    await page.evaluate(() => {
      localStorage.removeItem('afc_preview_presets');
      localStorage.removeItem('afc_preview_route');
    });
  });

  test('/preview page renders with preset dropdown', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Preview');
    await expect(page.locator('[data-testid="preset-dropdown"]')).toBeVisible();
  });

  test('preset dropdown shows default presets', async ({ page }) => {
    await page.goto('/preview');
    const dropdown = page.locator('[data-testid="preset-dropdown"]');
    await expect(dropdown).toBeVisible();
    // Should have at least the default "Local Dev" preset
    await expect(dropdown).toContainText('Local Dev');
  });

  test('manage presets button opens modal', async ({ page }) => {
    await page.goto('/preview');
    const manageBtn = page.locator('[data-testid="manage-presets-btn"]');
    await expect(manageBtn).toBeVisible();
    await manageBtn.click();
    await expect(page.locator('[data-testid="preset-editor-modal"]')).toBeVisible();
  });

  test('preset editor modal has add preset form', async ({ page }) => {
    await page.goto('/preview');
    await page.locator('[data-testid="manage-presets-btn"]').click();
    const modal = page.locator('[data-testid="preset-editor-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-testid="preset-name-input"]')).toBeVisible();
    await expect(modal.locator('[data-testid="preset-url-input"]')).toBeVisible();
    await expect(modal.locator('[data-testid="add-preset-btn"]')).toBeVisible();
  });

  test('can add a new preset', async ({ page }) => {
    await page.goto('/preview');
    await page.locator('[data-testid="manage-presets-btn"]').click();

    // Fill in the form
    await page.locator('[data-testid="preset-name-input"]').fill('Test Preset');
    await page.locator('[data-testid="preset-url-input"]').fill('https://test.example.com');
    await page.locator('[data-testid="add-preset-btn"]').click();

    // Close modal
    await page.locator('[data-testid="close-modal-btn"]').click();

    // Check preset appears in dropdown
    const dropdown = page.locator('[data-testid="preset-dropdown"]');
    await dropdown.click();
    await expect(page.getByText('Test Preset')).toBeVisible();
  });

  test('route health grid is visible', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('[data-testid="route-health-grid"]')).toBeVisible();
  });

  test('route health grid has refresh button', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('[data-testid="route-health-refresh"]')).toBeVisible();
  });

  test('open current route button is visible', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('[data-testid="open-current-route-btn"]')).toBeVisible();
  });

  test('deep link with route param loads that route', async ({ page }) => {
    await page.goto('/preview?route=/runs');
    // The iframe should be set to load /runs
    const iframe = page.locator('[data-testid="preview-iframe"]');
    // Check that the route is reflected in the URL bar or state
    await expect(page.locator('[data-testid="current-route-display"]')).toContainText('/runs');
  });

  test('deep link with preset param selects that preset', async ({ page }) => {
    await page.goto('/preview?preset=local-dev');
    const dropdown = page.locator('[data-testid="preset-dropdown"]');
    await expect(dropdown).toContainText('Local Dev');
  });

  test('route persistence saves to localStorage', async ({ page }) => {
    await page.goto('/preview');

    // Click on a route in the health grid
    await page.locator('[data-testid="route-row-runs"] button').click();

    // Check localStorage
    const savedRoute = await page.evaluate(() => localStorage.getItem('afc_preview_route'));
    expect(savedRoute).toBe('/runs');
  });

  test('route health grid shows status legend', async ({ page }) => {
    await page.goto('/preview');
    const grid = page.locator('[data-testid="route-health-grid"]');
    await expect(grid).toContainText('200');
    await expect(grid).toContainText('Auth');
    await expect(grid).toContainText('Redirect');
    await expect(grid).toContainText('404');
    await expect(grid).toContainText('Error');
  });
});
