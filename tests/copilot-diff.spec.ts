import { test, expect } from '@playwright/test';

/**
 * E2E tests for UX-GATE-COPILOT-1.1: Draft Diff View
 *
 * Tests the diff panel, reviewed checkbox, and approve flow.
 */

test.describe('Copilot Draft Diff View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to drafts page
    await page.goto('/drafts');
  });

  test('should display diff panel on draft detail page', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    // Check for drafts list or empty state
    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      // Click on first draft
      await page.locator('[data-testid^="draft-row-"]').first().click();

      // Wait for detail page to load
      await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });

      // Check for diff panel
      await expect(page.getByTestId('diff-panel')).toBeVisible();
    } else {
      // Empty state - just verify page loaded
      await expect(page.getByText(/no drafts/i)).toBeVisible();
    }
  });

  test('should show diff operations with CREATE/UPDATE/CALL_API badges', async ({ page }) => {
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      await page.locator('[data-testid^="draft-row-"]').first().click();
      await expect(page.getByTestId('diff-panel')).toBeVisible({ timeout: 10000 });

      // Check for operation badges (at least one should be visible)
      const operations = page.locator('[data-testid^="diff-operation-"]');
      const opCount = await operations.count();

      if (opCount > 0) {
        // Check first operation has expected structure
        const firstOp = operations.first();
        await expect(firstOp).toBeVisible();

        // Should have an operation type badge (CREATE, UPDATE, or CALL_API)
        const hasBadge = await firstOp
          .locator('span:has-text("CREATE"), span:has-text("UPDATE"), span:has-text("CALL_API")')
          .count();
        expect(hasBadge).toBeGreaterThan(0);
      }
    }
  });

  test('should display reviewed checkbox for DRAFT status', async ({ page }) => {
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      // Find a draft with DRAFT status
      const draftRow = page.locator('[data-testid^="draft-row-"]:has-text("DRAFT")').first();
      const hasDraftStatus = (await draftRow.count()) > 0;

      if (hasDraftStatus) {
        await draftRow.click();
        await expect(page.getByTestId('diff-panel')).toBeVisible({ timeout: 10000 });

        // Check for reviewed checkbox
        await expect(page.getByTestId('diff-reviewed-checkbox')).toBeVisible();

        // Checkbox should be unchecked by default
        const checkbox = page.getByTestId('diff-reviewed-checkbox');
        await expect(checkbox).not.toBeChecked();
      }
    }
  });

  test('should enable approve button only after checking reviewed checkbox', async ({ page }) => {
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      const draftRow = page.locator('[data-testid^="draft-row-"]:has-text("DRAFT")').first();
      const hasDraftStatus = (await draftRow.count()) > 0;

      if (hasDraftStatus) {
        await draftRow.click();
        await expect(page.getByTestId('diff-panel')).toBeVisible({ timeout: 10000 });

        const approveBtn = page.getByTestId('approve-draft-btn');
        const checkbox = page.getByTestId('diff-reviewed-checkbox');

        // Approve button should be disabled initially
        await expect(approveBtn).toBeDisabled();

        // Check the reviewed checkbox
        await checkbox.check();

        // Approve button should now be enabled
        await expect(approveBtn).toBeEnabled();
      }
    }
  });

  test('should show pre-flight checks in diff panel', async ({ page }) => {
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      await page.locator('[data-testid^="draft-row-"]').first().click();
      await expect(page.getByTestId('diff-panel')).toBeVisible({ timeout: 10000 });

      // Check for pre-flight checks section
      await expect(page.getByText(/pre-flight checks/i)).toBeVisible();

      // Check for Council Gate status
      await expect(page.getByText(/council gate/i)).toBeVisible();

      // Check for "Will create" summary
      await expect(page.getByText(/will create/i)).toBeVisible();
    }
  });

  test('should show warnings in diff operations when present', async ({ page }) => {
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      await page.locator('[data-testid^="draft-row-"]').first().click();
      await expect(page.getByTestId('diff-panel')).toBeVisible({ timeout: 10000 });

      // Warnings are optional, just verify the structure is correct
      const operations = page.locator('[data-testid^="diff-operation-"]');
      const opCount = await operations.count();

      if (opCount > 0) {
        // Each operation should have a summary
        const firstOp = operations.first();
        const summaryText = await firstOp.locator('p').first().textContent();
        expect(summaryText).toBeTruthy();
      }
    }
  });

  test('should navigate back to drafts list', async ({ page }) => {
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    const hasDrafts = await page.locator('[data-testid^="draft-row-"]').count();

    if (hasDrafts > 0) {
      await page.locator('[data-testid^="draft-row-"]').first().click();
      await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });

      // Click back link
      await page.getByText('← Drafts').click();

      // Should be back on drafts list
      await expect(page.getByTestId('page-root')).toBeVisible();
    }
  });
});

test.describe('Diff API Route', () => {
  test('should return plan for valid draft ID', async ({ request }) => {
    // Test the diff API endpoint with demo mode
    const response = await request.get('/api/copilot/drafts/test-draft-id/diff?demo=1');

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Should have plan structure
    expect(data).toHaveProperty('draftId');
    expect(data).toHaveProperty('kind');
    expect(data).toHaveProperty('operations');
    expect(data).toHaveProperty('checks');

    // Operations should be an array
    expect(Array.isArray(data.operations)).toBe(true);

    // Checks should have expected properties
    expect(data.checks).toHaveProperty('councilRequired');
    expect(data.checks).toHaveProperty('councilSatisfied');
    expect(data.checks).toHaveProperty('willCreateCount');
  });
});
