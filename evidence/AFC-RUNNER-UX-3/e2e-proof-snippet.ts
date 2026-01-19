/**
 * AFC-RUNNER-UX-3: E2E Proof Snippet
 *
 * This snippet demonstrates the core test case that proves
 * project repo binding works as specified.
 */

import { test, expect } from '@playwright/test';

test('executes blueprint batch without modal when project repo config exists', async ({
  page,
  request,
}) => {
  // Seed: create project with repo config
  const projectId = await seedProject(
    request,
    'test-repo-binding',
    'lemneya',
    'test-repo-binding',
    'main'
  );

  // Seed: create blueprint attached to project
  const blueprintId = await seedBlueprint(
    request,
    'Blueprint with Project Config',
    projectId,
    'This blueprint has project repo binding'
  );

  // Seed: create 2 PENDING work orders
  const woId1 = await seedWorkOrder(request, blueprintId, 'auth-module', 'Auth Module', 'auth');
  const woId2 = await seedWorkOrder(request, blueprintId, 'crud-api', 'CRUD API', 'crud');

  // Navigate to blueprint detail page in demo mode
  await page.goto(`/blueprints/${blueprintId}?demo=1`);

  // Assert page loaded correctly
  await expect(page.getByTestId('page-title')).toContainText('Blueprint with Project Config');

  // Assert execute button shows correct count
  const executeButton = page.getByTestId('blueprint-execute-pending');
  await expect(executeButton).toContainText('Execute all PENDING (2)');

  // Assert missing repo config warning is NOT visible (config exists)
  await expect(page.getByTestId('blueprint-missing-repo-config')).not.toBeVisible();

  // Click execute button
  await executeButton.click();

  // ✅ PROOF: Navigation happens WITHOUT modal appearing
  await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 30000 });

  // Wait for page root to be visible first
  await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

  // Wait for execution status to be visible
  await page.waitForTimeout(1000);
  await expect(page.getByTestId('execution-status')).toBeVisible({ timeout: 15000 });

  // ✅ PROOF: Status is COMPLETED (DRY RUN mode)
  const statusBadge = page.getByTestId('execution-status');
  await expect(statusBadge).toContainText('Completed');

  // ✅ PROOF: PR link is visible (dummy URL from DRY RUN)
  const prLink = page.getByTestId('execution-pr-link');
  await expect(prLink).toBeVisible();

  // ✅ PROOF: Run summary shows correct counts
  const summaryCard = page.getByTestId('run-summary-card');
  await expect(summaryCard).toBeVisible();

  const totalCount = page.getByTestId('run-summary-total');
  await expect(totalCount).toHaveText('2');

  // ✅ PROOF: WorkOrders Executed list shows exactly 2 work orders
  const workordersList = page.getByTestId('execution-workorders-list');
  await expect(workordersList).toBeVisible();

  await expect(page.getByTestId(`execution-workorder-link-${woId1}`)).toBeVisible();
  await expect(page.getByTestId(`execution-workorder-link-${woId2}`)).toBeVisible();
});
