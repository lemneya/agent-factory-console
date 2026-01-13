/**
 * E2E tests for Copilot Draft Mode
 * UX-GATE-COPILOT-1: Draft mode UI and workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Copilot Draft Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Copilot page in demo mode
    await page.goto('/copilot?demo=1');
    await page.waitForSelector('[data-testid="page-root"]');
  });

  test('should display Ask/Draft mode toggle', async ({ page }) => {
    // Check for mode toggle buttons
    await expect(page.getByTestId('copilot-mode-ask')).toBeVisible();
    await expect(page.getByTestId('copilot-mode-draft')).toBeVisible();

    // Ask mode should be active by default
    await expect(page.getByTestId('copilot-mode-ask')).toHaveClass(/bg-blue-600/);
  });

  test('should switch to Draft mode when clicked', async ({ page }) => {
    // Click Draft mode button
    await page.getByTestId('copilot-mode-draft').click();

    // Draft mode should now be active
    await expect(page.getByTestId('copilot-mode-draft')).toHaveClass(/bg-blue-600/);

    // Draft type selector should appear
    await expect(page.getByTestId('copilot-draft-type')).toBeVisible();
  });

  test('should show draft type selector in Draft mode', async ({ page }) => {
    // Switch to Draft mode
    await page.getByTestId('copilot-mode-draft').click();

    // Check draft type selector options
    const draftTypeSelect = page.getByTestId('copilot-draft-type');
    await expect(draftTypeSelect).toBeVisible();

    // Check options
    await expect(draftTypeSelect.locator('option')).toHaveCount(3);
    await expect(draftTypeSelect.locator('option:nth-child(1)')).toHaveText('Blueprint Draft');
    await expect(draftTypeSelect.locator('option:nth-child(2)')).toHaveText('WorkOrders Draft');
    await expect(draftTypeSelect.locator('option:nth-child(3)')).toHaveText('Council Draft');
  });

  test('should update placeholder text in Draft mode', async ({ page }) => {
    // Check Ask mode placeholder
    const input = page.getByTestId('copilot-input');
    await expect(input).toHaveAttribute('placeholder', /Ask about projects/);

    // Switch to Draft mode
    await page.getByTestId('copilot-mode-draft').click();

    // Check Draft mode placeholder
    await expect(input).toHaveAttribute('placeholder', /Describe the blueprint/i);
  });

  test('should show different placeholder for different draft types', async ({ page }) => {
    // Switch to Draft mode
    await page.getByTestId('copilot-mode-draft').click();

    const input = page.getByTestId('copilot-input');
    const draftTypeSelect = page.getByTestId('copilot-draft-type');

    // Blueprint placeholder
    await draftTypeSelect.selectOption('BLUEPRINT');
    await expect(input).toHaveAttribute('placeholder', /blueprint/i);

    // WorkOrders placeholder
    await draftTypeSelect.selectOption('WORKORDERS');
    await expect(input).toHaveAttribute('placeholder', /workorders/i);

    // Council placeholder
    await draftTypeSelect.selectOption('COUNCIL');
    await expect(input).toHaveAttribute('placeholder', /council/i);
  });

  test('should hide quick prompts in Draft mode', async ({ page }) => {
    // Quick prompts should be visible in Ask mode
    await expect(page.getByText('Explain Council Gate')).toBeVisible();

    // Switch to Draft mode
    await page.getByTestId('copilot-mode-draft').click();

    // Quick prompts should be hidden
    await expect(page.getByText('Explain Council Gate')).not.toBeVisible();
  });

  test('should show draft mode info text', async ({ page }) => {
    // Switch to Draft mode
    await page.getByTestId('copilot-mode-draft').click();

    // Check for draft mode info text
    await expect(page.getByText(/Draft mode:/)).toBeVisible();
    await expect(page.getByText(/human approval/i)).toBeVisible();
  });
});

test.describe('Drafts List Page', () => {
  test('should navigate to Drafts page', async ({ page }) => {
    await page.goto('/drafts');
    await page.waitForSelector('[data-testid="page-root"]');

    // Check page title
    await expect(page.getByTestId('page-title')).toHaveText('Drafts');
  });

  test('should display drafts table', async ({ page }) => {
    await page.goto('/drafts');
    await page.waitForSelector('[data-testid="page-root"]');

    // Check for table
    await expect(page.getByTestId('drafts-table')).toBeVisible();
  });

  test('should display filter dropdowns', async ({ page }) => {
    await page.goto('/drafts');
    await page.waitForSelector('[data-testid="page-root"]');

    // Check for filter dropdowns
    await expect(page.getByText('Kind')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('should show empty state when no drafts', async ({ page }) => {
    await page.goto('/drafts');
    await page.waitForSelector('[data-testid="page-root"]');

    // Check for empty state message
    await expect(page.getByText(/No drafts found/)).toBeVisible();
  });
});

test.describe('Copilot Navigation', () => {
  test('should have Copilot in sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-root"]');

    // Check for Copilot nav item
    await expect(page.getByRole('link', { name: /Copilot/i })).toBeVisible();
  });

  test('should have Drafts in sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-root"]');

    // Check for Drafts nav item
    await expect(page.getByRole('link', { name: /Drafts/i })).toBeVisible();
  });

  test('should navigate to Copilot from sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-root"]');

    // Click Copilot link
    await page.getByRole('link', { name: /Copilot/i }).click();

    // Should be on Copilot page
    await expect(page).toHaveURL(/\/copilot/);
    await expect(page.getByTestId('page-title')).toHaveText('Copilot');
  });

  test('should navigate to Drafts from sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="page-root"]');

    // Click Drafts link
    await page.getByRole('link', { name: /Drafts/i }).click();

    // Should be on Drafts page
    await expect(page).toHaveURL(/\/drafts/);
    await expect(page.getByTestId('page-title')).toHaveText('Drafts');
  });
});
