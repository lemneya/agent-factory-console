/**
 * AFC-RUNNER-UX-1: Multi-select WorkOrders Execution - E2E Tests
 *
 * Tests the complete multi-select flow:
 * 1. Seed 2 PENDING WorkOrders via API
 * 2. Select both → Execute Selected → submit modal
 * 3. Assert execution detail shows 2 workorders in list
 * 4. Assert status=COMPLETED (DRY RUN) + PR link visible
 * 5. Test WorkOrders list links and focus param
 * 6. Test Re-run button
 */
import { test, expect } from '@playwright/test';
import { enableDemoMode } from './helpers/demo';

test.describe('AFC-RUNNER-UX-1: Multi-select WorkOrders Execution', () => {
  test.beforeEach(async ({ page }) => {
    // Enable demo mode for all tests
    await enableDemoMode(page);
  });

  test.describe('WorkOrders Page - Multi-select', () => {
    test('should display checkboxes for PENDING work orders', async ({ page, request }) => {
      // Create a PENDING work order
      const timestamp = Date.now();
      const createRes = await request.post('/api/workorders', {
        data: {
          key: `multiselect-test-${timestamp}`,
          domain: 'test',
          title: `Multiselect Test WorkOrder ${timestamp}`,
          spec: 'Test specification',
          status: 'PENDING',
        },
      });

      expect(createRes.ok()).toBe(true);
      const woData = await createRes.json();
      const workOrderId = woData.workOrder?.id;

      // Navigate to workorders page
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      // Check for checkbox with correct testid
      if (workOrderId) {
        const checkbox = page.getByTestId(`workorders-select-${workOrderId}`);
        await expect(checkbox).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show Execute Selected button when items are selected', async ({
      page,
      request,
    }) => {
      // Create a PENDING work order
      const timestamp = Date.now();
      const createRes = await request.post('/api/workorders', {
        data: {
          key: `exec-selected-test-${timestamp}`,
          domain: 'test',
          title: `Execute Selected Test ${timestamp}`,
          spec: 'Test specification',
          status: 'PENDING',
        },
      });

      expect(createRes.ok()).toBe(true);
      const woData = await createRes.json();
      const workOrderId = woData.workOrder?.id;

      // Navigate to workorders page
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      // Execute Selected button should not be visible initially
      const executeSelectedBtn = page.getByTestId('execute-selected');
      await expect(executeSelectedBtn).not.toBeVisible();

      // Select the work order
      if (workOrderId) {
        const checkbox = page.getByTestId(`workorders-select-${workOrderId}`);
        await checkbox.click();

        // Execute Selected button should now be visible
        await expect(executeSelectedBtn).toBeVisible();
        await expect(executeSelectedBtn).toContainText('Execute Selected');
      }
    });
  });

  test.describe('Execution Detail - WorkOrders List', () => {
    test('should display execution-workorders-list testid', async ({ page, request }) => {
      // Get existing executions
      const runsRes = await request.get('/api/runner/runs');
      const runsData = await runsRes.json();

      if (runsData.runs && runsData.runs.length > 0) {
        const executionId = runsData.runs[0].id;

        await page.goto(`/executions/${executionId}?demo=1`);
        await page.waitForLoadState('networkidle');

        // Check for workorders list
        await expect(page.getByTestId('execution-workorders-list')).toBeVisible();
      }
    });

    test('should display workorder links with correct testids', async ({ page, request }) => {
      // Get existing executions
      const runsRes = await request.get('/api/runner/runs');
      const runsData = await runsRes.json();

      if (runsData.runs && runsData.runs.length > 0) {
        const run = runsData.runs[0];
        const executionId = run.id;

        await page.goto(`/executions/${executionId}?demo=1`);
        await page.waitForLoadState('networkidle');

        // Check for workorder links
        if (run.workOrderIds && run.workOrderIds.length > 0) {
          const firstWoId = run.workOrderIds[0];
          const woLink = page.getByTestId(`execution-workorder-link-${firstWoId}`);
          await expect(woLink).toBeVisible();
        }
      }
    });
  });

  test.describe('Execution Detail - Re-run Button', () => {
    test('should display execution-rerun button', async ({ page, request }) => {
      // Get existing executions
      const runsRes = await request.get('/api/runner/runs');
      const runsData = await runsRes.json();

      if (runsData.runs && runsData.runs.length > 0) {
        const executionId = runsData.runs[0].id;

        await page.goto(`/executions/${executionId}?demo=1`);
        await page.waitForLoadState('networkidle');

        // Check for re-run button
        await expect(page.getByTestId('execution-rerun')).toBeVisible();
      }
    });
  });

  test.describe('WorkOrders Page - Focus Param', () => {
    test('should highlight row when focus param is provided', async ({ page, request }) => {
      // Create a work order
      const timestamp = Date.now();
      const createRes = await request.post('/api/workorders', {
        data: {
          key: `focus-test-${timestamp}`,
          domain: 'test',
          title: `Focus Test WorkOrder ${timestamp}`,
          spec: 'Test specification',
          status: 'PENDING',
        },
      });

      expect(createRes.ok()).toBe(true);
      const woData = await createRes.json();
      const workOrderId = woData.workOrder?.id;

      if (workOrderId) {
        // Navigate with focus param
        await page.goto(`/workorders?demo=1&focus=${workOrderId}`);
        await page.waitForLoadState('networkidle');

        // The row should be highlighted (has ring-cyan-500 class)
        const row = page.getByTestId(`workorder-row-${workOrderId}`);
        await expect(row).toBeVisible();
        // Check that the row has the focus styling
        await expect(row).toHaveClass(/ring-cyan-500/);
      }
    });
  });

  test.describe('Complete Multi-select Flow', () => {
    // RUNNER_DRY_RUN=1 is set via playwright.config.ts webServer.env when CI=true
    test('should complete full multi-select execution flow with DRY RUN', async ({
      page,
      request,
    }) => {
      // Step 1: Create 2 PENDING work orders via API
      const timestamp = Date.now();

      const createWo1Res = await request.post('/api/workorders', {
        data: {
          key: `multi-flow-wo1-${timestamp}`,
          domain: 'e2e-test',
          title: `Multi Flow Test WorkOrder 1 - ${timestamp}`,
          spec: 'Multi-select flow test specification 1',
          status: 'PENDING',
        },
      });
      expect(createWo1Res.ok()).toBe(true);
      const wo1Data = await createWo1Res.json();
      const workOrder1Id = wo1Data.workOrder?.id;
      expect(workOrder1Id).toBeTruthy();

      const createWo2Res = await request.post('/api/workorders', {
        data: {
          key: `multi-flow-wo2-${timestamp}`,
          domain: 'e2e-test',
          title: `Multi Flow Test WorkOrder 2 - ${timestamp}`,
          spec: 'Multi-select flow test specification 2',
          status: 'PENDING',
        },
      });
      expect(createWo2Res.ok()).toBe(true);
      const wo2Data = await createWo2Res.json();
      const workOrder2Id = wo2Data.workOrder?.id;
      expect(workOrder2Id).toBeTruthy();

      // Step 2: Navigate to workorders page
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      // Step 3: Select both work orders
      const checkbox1 = page.getByTestId(`workorders-select-${workOrder1Id}`);
      const checkbox2 = page.getByTestId(`workorders-select-${workOrder2Id}`);

      await expect(checkbox1).toBeVisible({ timeout: 5000 });
      await expect(checkbox2).toBeVisible({ timeout: 5000 });

      await checkbox1.click();
      await checkbox2.click();

      // Step 4: Click Execute Selected button
      const executeSelectedBtn = page.getByTestId('execute-selected');
      await expect(executeSelectedBtn).toBeVisible();
      await expect(executeSelectedBtn).toContainText('Execute Selected (2)');
      await executeSelectedBtn.click();

      // Step 5: Verify modal opens and shows both work orders
      await expect(page.getByTestId('runner-exec-modal')).toBeVisible();

      // Fill in repository name
      await page.getByTestId('runner-repo').fill('test-multi-repo');

      // Step 6: Submit the form - modal submit navigates to /executions/{id}
      await page.getByTestId('runner-submit').click();
      await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 15000 });

      // Step 7: Verify execution detail page elements
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('execution-status')).toBeVisible();
      await expect(page.getByTestId('execution-refresh')).toBeVisible();
      await expect(page.getByTestId('execution-workorders-list')).toBeVisible();
      await expect(page.getByTestId('execution-rerun')).toBeVisible();

      // Step 8: Wait for data to load and refresh
      await page.waitForTimeout(1000);
      await page.getByTestId('execution-refresh').click();
      await page.waitForTimeout(1000);

      // Step 9: Assert execution detail shows 2 workorders in list
      const woLink1 = page.getByTestId(`execution-workorder-link-${workOrder1Id}`);
      const woLink2 = page.getByTestId(`execution-workorder-link-${workOrder2Id}`);
      await expect(woLink1).toBeVisible();
      await expect(woLink2).toBeVisible();

      // Step 10: Assert execution-status shows Completed
      const statusText = await page.getByTestId('execution-status').textContent();
      expect(statusText).toContain('Completed');

      // Step 11: Assert execution-pr-link is visible (dummy URL from DRY RUN)
      await expect(page.getByTestId('execution-pr-link')).toBeVisible();

      // Step 12: Test clicking a workorder link navigates to workorders page with focus
      await woLink1.click();
      await page.waitForURL(/\/workorders\?focus=/, { timeout: 5000 });

      // Verify the focused row is highlighted
      const focusedRow = page.getByTestId(`workorder-row-${workOrder1Id}`);
      await expect(focusedRow).toBeVisible();
      await expect(focusedRow).toHaveClass(/ring-cyan-500/);
    });

    test('should re-run execution with same work orders', async ({ page, request }) => {
      // First, create and execute a work order to get an execution
      const timestamp = Date.now();

      const createWoRes = await request.post('/api/workorders', {
        data: {
          key: `rerun-test-wo-${timestamp}`,
          domain: 'e2e-test',
          title: `Re-run Test WorkOrder ${timestamp}`,
          spec: 'Re-run test specification',
          status: 'PENDING',
        },
      });
      expect(createWoRes.ok()).toBe(true);
      const woData = await createWoRes.json();
      const workOrderId = woData.workOrder?.id;

      // Navigate to workorders and execute
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      const executeButton = page.getByTestId(`execute-workorder-${workOrderId}`);
      await expect(executeButton).toBeVisible({ timeout: 5000 });
      await executeButton.click();

      await expect(page.getByTestId('runner-exec-modal')).toBeVisible();
      await page.getByTestId('runner-repo').fill('rerun-test-repo');
      await page.getByTestId('runner-submit').click();

      await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 15000 });

      // Wait for execution to complete
      await page.waitForTimeout(1000);
      await page.getByTestId('execution-refresh').click();
      await page.waitForTimeout(1000);

      // Get current URL to compare after re-run
      const originalUrl = page.url();
      const originalExecutionId = originalUrl.split('/executions/')[1]?.split('?')[0];

      // Click re-run button
      const rerunButton = page.getByTestId('execution-rerun');
      await expect(rerunButton).toBeVisible();
      await rerunButton.click();

      // Should navigate to a new execution
      await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 15000 });
      const newUrl = page.url();
      const newExecutionId = newUrl.split('/executions/')[1]?.split('?')[0];

      // New execution should be different from original
      expect(newExecutionId).not.toBe(originalExecutionId);

      // New execution should also complete with DRY RUN
      await page.waitForTimeout(1000);
      await page.getByTestId('execution-refresh').click();
      await page.waitForTimeout(1000);

      const statusText = await page.getByTestId('execution-status').textContent();
      expect(statusText).toContain('Completed');
    });
  });
});
