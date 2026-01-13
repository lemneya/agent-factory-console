import { test, expect } from '@playwright/test';

test.describe('AFC-UX-PREVIEW-1: Preview Presets + Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/preview');
    await page.evaluate(() => {
      localStorage.removeItem('afc_preview_presets');
      localStorage.removeItem('afc_preview_current');
    });
  });

  test('/preview page renders with preset dropdown', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('[data-testid="page-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Preview');
    await expect(page.locator('[data-testid="preview-preset-select"]')).toBeVisible();
  });

  test('preset dropdown shows default presets', async ({ page }) => {
    await page.goto('/preview');
    const dropdown = page.locator('[data-testid="preview-preset-select"]');
    await expect(dropdown).toBeVisible();
    // Should have at least the default "Local" preset
    await expect(dropdown).toContainText('Local');
  });

  test('edit presets button opens modal', async ({ page }) => {
    await page.goto('/preview');
    const editBtn = page.locator('[data-testid="preset-editor-open"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page.locator('[data-testid="preset-editor-modal"]')).toBeVisible();
  });

  test('preset editor modal has add preset button', async ({ page }) => {
    await page.goto('/preview');
    await page.locator('[data-testid="preset-editor-open"]').click();
    const modal = page.locator('[data-testid="preset-editor-modal"]');
    await expect(modal).toBeVisible();
    // The modal has preset rows with inputs and an add button
    await expect(modal.locator('[data-testid="add-preset-btn"]')).toBeVisible();
  });

  test('can add a new preset', async ({ page }) => {
    await page.goto('/preview');
    await page.locator('[data-testid="preset-editor-open"]').click();

    // Click add preset button to create a new row
    await page.locator('[data-testid="add-preset-btn"]').click();

    // Fill in the new preset row (last one)
    const nameInputs = page.locator('[data-testid="preset-name-input"]');
    const urlInputs = page.locator('[data-testid="preset-url-input"]');

    // Get the last inputs (the newly added preset)
    const lastNameInput = nameInputs.last();
    const lastUrlInput = urlInputs.last();

    await lastNameInput.fill('Test Preset');
    await lastUrlInput.fill('https://test.example.com');

    // Save changes
    await page.locator('[data-testid="preset-save"]').click();

    // Modal should close
    await expect(page.locator('[data-testid="preset-editor-modal"]')).not.toBeVisible();

    // Check preset appears in dropdown
    const dropdown = page.locator('[data-testid="preview-preset-select"]');
    await expect(dropdown).toContainText('Test Preset');
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
    await expect(page.locator('[data-testid="preview-open-current"]')).toBeVisible();
  });

  test('deep link with path param loads that route', async ({ page }) => {
    await page.goto('/preview?path=/runs');
    // Check that the route is reflected in the current path display
    await expect(page.locator('[data-testid="preview-current-path"]')).toContainText('/runs');
  });

  test('deep link with preset param selects that preset', async ({ page }) => {
    await page.goto('/preview?preset=local');
    const dropdown = page.locator('[data-testid="preview-preset-select"]');
    await expect(dropdown).toContainText('Local');
  });

  test('preset persistence saves to localStorage', async ({ page }) => {
    await page.goto('/preview');

    // Open editor and add a preset
    await page.locator('[data-testid="preset-editor-open"]').click();
    await page.locator('[data-testid="add-preset-btn"]').click();

    // Fill in the new preset
    const nameInputs = page.locator('[data-testid="preset-name-input"]');
    const urlInputs = page.locator('[data-testid="preset-url-input"]');
    await nameInputs.last().fill('Persistent Preset');
    await urlInputs.last().fill('https://persistent.example.com');
    await page.locator('[data-testid="preset-save"]').click();

    // Check localStorage
    const savedPresets = await page.evaluate(() => localStorage.getItem('afc_preview_presets'));
    expect(savedPresets).toContain('Persistent Preset');
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
