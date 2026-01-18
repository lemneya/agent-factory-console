/**
 * AFC-RUNNER-UX-0: E2E Proof Snippet
 *
 * This snippet demonstrates the key E2E test that validates the complete
 * Execute from UI flow with DRY RUN mode for CI determinism.
 */

import { test, expect } from '@playwright/test';
// Note: This is a proof snippet showing the test structure
// In actual tests, import from: import { enableDemoMode } from './helpers/demo';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enableDemoMode = async (page: any) => {
  await page.goto('/?demo=1');
};

test.describe('Complete Flow: Execute → Navigate → Verify', () => {
  test('should complete full execution flow with DRY RUN', async ({ page, request }) => {
    // Enable demo mode
    await enableDemoMode(page);

    // Step 1: Create a PENDING work order
    const timestamp = Date.now();
    const createWoRes = await request.post('/api/workorders', {
      data: {
        key: `e2e-flow-wo-${timestamp}`,
        domain: 'e2e-test',
        title: `E2E Flow Test WorkOrder ${timestamp}`,
        spec: 'Full flow test specification',
        status: 'PENDING',
      },
    });

    const woData = await createWoRes.json();
    const workOrderId = woData.workOrder?.id;

    // Step 2: Navigate to workorders page
    await page.goto('/workorders?demo=1');
    await page.waitForLoadState('networkidle');

    // Step 3: Find and click the execute button for our work order
    const executeButton = page.getByTestId(`execute-workorder-${workOrderId}`);
    await executeButton.click();

    // Step 4: Fill in the modal and submit
    await expect(page.getByTestId('runner-exec-modal')).toBeVisible();

    // Verify default values
    await expect(page.getByTestId('runner-owner')).toHaveValue('lemneya');
    await expect(page.getByTestId('runner-branch')).toHaveValue('main');

    // Fill in repository name
    await page.getByTestId('runner-repo').fill('test-repo');

    // Submit the form
    await page.getByTestId('runner-submit').click();

    // Step 5: Wait for navigation to execution detail page
    await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 10000 });

    // Step 6: Verify we're on the execution detail page
    await expect(page.getByTestId('page-root')).toBeVisible();
    await expect(page.getByTestId('execution-status')).toBeVisible();
    await expect(page.getByTestId('execution-logs')).toBeVisible();

    // Step 7: In DRY RUN mode, status should be COMPLETED with PR link
    await page.getByTestId('execution-refresh').click();
    await page.waitForTimeout(500);

    // Verify COMPLETED status
    const statusText = await page.getByTestId('execution-status').textContent();
    expect(statusText).toContain('Completed');

    // Verify PR link is present (dummy URL in DRY RUN mode)
    await expect(page.getByTestId('execution-pr-link')).toBeVisible();
  });
});
