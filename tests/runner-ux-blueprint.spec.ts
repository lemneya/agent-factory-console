/**
 * AFC-RUNNER-UX-2: Blueprint Batch Execute E2E Tests
 *
 * Tests the Blueprint detail page "Execute all PENDING" button
 * and the Run Summary card on the execution detail page.
 *
 * Uses DRY RUN mode in CI for deterministic execution.
 */

import { test, expect } from '@playwright/test';

test.describe('AFC-RUNNER-UX-2: Blueprint Batch Execute', () => {
  // Helper to seed a blueprint via API
  async function seedBlueprint(
    request: ReturnType<typeof test.request>,
    name: string,
    description?: string
  ): Promise<string> {
    const response = await request.post('/api/blueprints', {
      data: { name, description },
    });
    expect(response.ok()).toBe(true);
    const data = await response.json();
    return data.blueprint.id;
  }

  // Helper to seed a work order via API
  async function seedWorkOrder(
    request: ReturnType<typeof test.request>,
    blueprintId: string,
    key: string,
    title: string,
    domain: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'SKIPPED' = 'PENDING'
  ): Promise<string> {
    const response = await request.post('/api/workorders', {
      data: {
        blueprintId,
        key,
        title,
        domain,
        spec: `Spec for ${title}`,
        status,
      },
    });
    expect(response.ok()).toBe(true);
    const data = await response.json();
    return data.workOrder.id;
  }

  test.describe('Blueprint Detail Page', () => {
    test('displays Execute all PENDING button', async ({ page, request }) => {
      // Seed a blueprint with work orders
      const blueprintId = await seedBlueprint(request, 'Test Blueprint for Execute Button');
      await seedWorkOrder(request, blueprintId, 'wo-1', 'Work Order 1', 'auth');
      await seedWorkOrder(request, blueprintId, 'wo-2', 'Work Order 2', 'crud');

      // Navigate to blueprint detail page
      await page.goto(`/blueprints/${blueprintId}?demo=1`);

      // Assert the execute button is visible
      const executeButton = page.getByTestId('blueprint-execute-pending');
      await expect(executeButton).toBeVisible();
      await expect(executeButton).toContainText('Execute all PENDING (2)');
    });

    test('shows disabled button when no PENDING work orders', async ({ page, request }) => {
      // Seed a blueprint with only completed work orders
      const blueprintId = await seedBlueprint(request, 'Blueprint with no PENDING');
      await seedWorkOrder(request, blueprintId, 'wo-1', 'Completed WO', 'auth', 'COMPLETED');

      // Navigate to blueprint detail page
      await page.goto(`/blueprints/${blueprintId}?demo=1`);

      // Assert the execute button is disabled
      const executeButton = page.getByTestId('blueprint-execute-pending');
      await expect(executeButton).toBeVisible();
      await expect(executeButton).toBeDisabled();
      await expect(executeButton).toContainText('Execute all PENDING (0)');
    });

    test('opens execute modal on button click', async ({ page, request }) => {
      // Seed a blueprint with pending work orders
      const blueprintId = await seedBlueprint(request, 'Blueprint for Modal Test');
      await seedWorkOrder(request, blueprintId, 'wo-1', 'Pending WO', 'auth');

      // Navigate to blueprint detail page
      await page.goto(`/blueprints/${blueprintId}?demo=1`);

      // Click the execute button
      await page.getByTestId('blueprint-execute-pending').click();

      // Assert modal is visible
      const modal = page.getByTestId('runner-exec-modal');
      await expect(modal).toBeVisible();

      // Assert form fields are present
      await expect(page.getByTestId('runner-owner')).toBeVisible();
      await expect(page.getByTestId('runner-repo')).toBeVisible();
      await expect(page.getByTestId('runner-branch')).toBeVisible();
      await expect(page.getByTestId('runner-submit')).toBeVisible();
    });
  });

  test.describe('Run Summary Card', () => {
    test('displays run summary card on execution detail page', async ({ page, request }) => {
      // Seed a blueprint and work orders
      const blueprintId = await seedBlueprint(request, 'Blueprint for Summary Test');
      await seedWorkOrder(request, blueprintId, 'wo-1', 'WO 1', 'auth');
      await seedWorkOrder(request, blueprintId, 'wo-2', 'WO 2', 'crud');

      // Navigate to blueprint detail page
      await page.goto(`/blueprints/${blueprintId}?demo=1`);

      // Click execute button
      await page.getByTestId('blueprint-execute-pending').click();

      // Fill in repo name and submit
      await page.getByTestId('runner-repo').fill('test-repo');
      await page.getByTestId('runner-submit').click();

      // Wait for navigation to execution detail page
      await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/);

      // Assert run summary card is visible
      const summaryCard = page.getByTestId('run-summary-card');
      await expect(summaryCard).toBeVisible();

      // Assert total count
      const totalCount = page.getByTestId('run-summary-total');
      await expect(totalCount).toBeVisible();
      await expect(totalCount).toHaveText('2');
    });
  });

  test.describe('Complete Flow: Blueprint Execute → Run Summary', () => {
    test('executes pending work orders and shows run summary', async ({ page, request }) => {
      // Seed: create blueprint + 3 workorders (2 PENDING, 1 COMPLETED)
      const blueprintId = await seedBlueprint(
        request,
        'E2E Blueprint Test',
        'Blueprint for E2E testing'
      );
      const woId1 = await seedWorkOrder(request, blueprintId, 'pending-1', 'Pending WO 1', 'auth');
      const woId2 = await seedWorkOrder(request, blueprintId, 'pending-2', 'Pending WO 2', 'crud');
      await seedWorkOrder(request, blueprintId, 'completed-1', 'Completed WO', 'ui', 'COMPLETED');

      // Navigate to blueprint detail page in demo mode
      await page.goto(`/blueprints/${blueprintId}?demo=1`);

      // Assert page loaded correctly
      await expect(page.getByTestId('page-title')).toContainText('E2E Blueprint Test');

      // Assert execute button shows correct count (only 2 PENDING)
      const executeButton = page.getByTestId('blueprint-execute-pending');
      await expect(executeButton).toContainText('Execute all PENDING (2)');

      // Click execute button
      await executeButton.click();

      // Assert modal is visible with work order list
      const modal = page.getByTestId('runner-exec-modal');
      await expect(modal).toBeVisible();

      // Fill in repo name and submit
      await page.getByTestId('runner-repo').fill('e2e-test-repo');
      await page.getByTestId('runner-submit').click();

      // Wait for navigation to execution detail page
      await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 30000 });

      // Assert run summary card is visible
      const summaryCard = page.getByTestId('run-summary-card');
      await expect(summaryCard).toBeVisible();

      // Assert total count reflects only the 2 pending executed
      const totalCount = page.getByTestId('run-summary-total');
      await expect(totalCount).toHaveText('2');

      // Assert status is COMPLETED (DRY RUN mode)
      const statusBadge = page.getByTestId('execution-status');
      await expect(statusBadge).toContainText('Completed');

      // Assert PR link is visible (dummy URL from DRY RUN)
      const prLink = page.getByTestId('execution-pr-link');
      await expect(prLink).toBeVisible();

      // Also check run-summary-pr-link
      const summaryPrLink = page.getByTestId('run-summary-pr-link');
      await expect(summaryPrLink).toBeVisible();

      // Assert WorkOrders Executed list shows exactly 2 work orders
      const workordersList = page.getByTestId('execution-workorders-list');
      await expect(workordersList).toBeVisible();

      // Check the individual work order links
      await expect(page.getByTestId(`execution-workorder-link-${woId1}`)).toBeVisible();
      await expect(page.getByTestId(`execution-workorder-link-${woId2}`)).toBeVisible();
    });
  });
});
