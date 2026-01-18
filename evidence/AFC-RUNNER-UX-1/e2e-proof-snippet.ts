/**
 * AFC-RUNNER-UX-1: E2E Proof Snippet
 *
 * This snippet demonstrates the key assertions from the multi-select E2E tests.
 * Full tests are in tests/runner-ux-multiselect.spec.ts
 */

// === Multi-select Flow Test ===
// Step 1: Create 2 PENDING work orders via API
const createWo1Res = await request.post('/api/workorders', {
  data: {
    key: `multi-flow-wo1-${timestamp}`,
    domain: 'e2e-test',
    title: `Multi Flow Test WorkOrder 1 - ${timestamp}`,
    spec: 'Multi-select flow test specification 1',
    status: 'PENDING',
  },
});
const createWo2Res = await request.post('/api/workorders', {
  data: {
    key: `multi-flow-wo2-${timestamp}`,
    domain: 'e2e-test',
    title: `Multi Flow Test WorkOrder 2 - ${timestamp}`,
    spec: 'Multi-select flow test specification 2',
    status: 'PENDING',
  },
});

// Step 2: Navigate to workorders page
await page.goto('/workorders?demo=1');

// Step 3: Select both work orders using checkboxes
const checkbox1 = page.getByTestId(`workorders-select-${workOrder1Id}`);
const checkbox2 = page.getByTestId(`workorders-select-${workOrder2Id}`);
await checkbox1.click();
await checkbox2.click();

// Step 4: Click Execute Selected button
const executeSelectedBtn = page.getByTestId('execute-selected');
await expect(executeSelectedBtn).toContainText('Execute Selected (2)');
await executeSelectedBtn.click();

// Step 5: Submit modal
await expect(page.getByTestId('runner-exec-modal')).toBeVisible();
await page.getByTestId('runner-repo').fill('test-multi-repo');
await page.getByTestId('runner-submit').click();

// Step 6: Wait for navigation to execution detail
await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 15000 });

// Step 7: Assert execution detail shows 2 workorders in list
await expect(page.getByTestId('execution-workorders-list')).toBeVisible();
const woLink1 = page.getByTestId(`execution-workorder-link-${workOrder1Id}`);
const woLink2 = page.getByTestId(`execution-workorder-link-${workOrder2Id}`);
await expect(woLink1).toBeVisible();
await expect(woLink2).toBeVisible();

// Step 8: Assert status=COMPLETED (DRY RUN mode)
const statusText = await page.getByTestId('execution-status').textContent();
expect(statusText).toContain('Completed');

// Step 9: Assert PR link visible (dummy URL from DRY RUN)
await expect(page.getByTestId('execution-pr-link')).toBeVisible();

// Step 10: Assert Re-run button is visible
await expect(page.getByTestId('execution-rerun')).toBeVisible();

// Step 11: Test focus param - click workorder link
await woLink1.click();
await page.waitForURL(/\/workorders\?focus=/, { timeout: 5000 });

// Step 12: Verify focused row is highlighted
const focusedRow = page.getByTestId(`workorder-row-${workOrder1Id}`);
await expect(focusedRow).toHaveClass(/ring-cyan-500/);
