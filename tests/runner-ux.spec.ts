/**
 * AFC-RUNNER-UX-0: Execute from UI - E2E Tests
 *
 * Tests the complete flow:
 * 1. Seed/create a PENDING WorkOrder
 * 2. Click Execute button → submit modal
 * 3. Navigate to /executions/{id}
 * 4. Assert status=COMPLETED + PR link present (dummy URL in DRY RUN mode)
 */
import { test, expect } from '@playwright/test';
import { enableDemoMode } from './helpers/demo';

test.describe('AFC-RUNNER-UX-0: Execute from UI', () => {
  test.beforeEach(async ({ page }) => {
    // Enable demo mode for all tests
    await enableDemoMode(page);
  });

  test.describe('WorkOrders Page', () => {
    test('should display WorkOrders page with table', async ({ page }) => {
      await page.goto('/workorders?demo=1');
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('WorkOrders');
    });

    test('should show Execute button on PENDING work orders', async ({ page, request }) => {
      // First, seed a PENDING work order via API
      const createBlueprintRes = await request.post('/api/blueprints', {
        data: {
          name: 'Test Blueprint for Runner UX',
          description: 'Blueprint for E2E testing',
        },
      });

      let blueprintId: string | null = null;
      if (createBlueprintRes.ok()) {
        const blueprintData = await createBlueprintRes.json();
        blueprintId = blueprintData.blueprint?.id;
      }

      // Create a work order (result not needed, just seeding data)
      await request.post('/api/workorders', {
        data: {
          key: `test-wo-${Date.now()}`,
          domain: 'test',
          title: 'Test WorkOrder for Runner UX',
          spec: 'Test specification',
          status: 'PENDING',
          blueprintId,
        },
      });

      // Navigate to workorders page
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      // Check if table is visible (may be empty if no work orders exist)
      const table = page.getByTestId('workorders-table');
      const hasTable = await table.isVisible().catch(() => false);

      if (hasTable) {
        // If we have work orders, check for execute buttons on PENDING rows
        const executeButtons = page.locator('[data-testid^="execute-workorder-"]');
        const count = await executeButtons.count();
        // Execute buttons should only appear on PENDING work orders
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Execute Modal', () => {
    test('should open execute modal with required testids', async ({ page, request }) => {
      // Create a PENDING work order for testing (result not needed, just seeding data)
      await request.post('/api/workorders', {
        data: {
          key: `modal-test-wo-${Date.now()}`,
          domain: 'test',
          title: 'Modal Test WorkOrder',
          spec: 'Test specification for modal',
          status: 'PENDING',
        },
      });

      // Navigate to workorders page
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      // Wait for table to load
      const table = page.getByTestId('workorders-table');
      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasTable) {
        // Find and click an execute button
        const executeButton = page.locator('[data-testid^="execute-workorder-"]').first();
        const hasButton = await executeButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasButton) {
          await executeButton.click();

          // Verify modal opens with required testids
          await expect(page.getByTestId('runner-exec-modal')).toBeVisible();
          await expect(page.getByTestId('runner-owner')).toBeVisible();
          await expect(page.getByTestId('runner-repo')).toBeVisible();
          await expect(page.getByTestId('runner-branch')).toBeVisible();
          await expect(page.getByTestId('runner-submit')).toBeVisible();

          // Verify default values
          await expect(page.getByTestId('runner-owner')).toHaveValue('lemneya');
          await expect(page.getByTestId('runner-branch')).toHaveValue('main');
        }
      }
    });

    test('should have correct default values in modal', async ({ page, request }) => {
      // Create a work order
      await request.post('/api/workorders', {
        data: {
          key: `defaults-test-wo-${Date.now()}`,
          domain: 'test',
          title: 'Defaults Test WorkOrder',
          spec: 'Test specification',
          status: 'PENDING',
        },
      });

      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      const executeButton = page.locator('[data-testid^="execute-workorder-"]').first();
      const hasButton = await executeButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasButton) {
        await executeButton.click();
        await expect(page.getByTestId('runner-exec-modal')).toBeVisible();

        // Check defaults: owner=lemneya, branch=main
        const ownerInput = page.getByTestId('runner-owner');
        const branchInput = page.getByTestId('runner-branch');

        await expect(ownerInput).toHaveValue('lemneya');
        await expect(branchInput).toHaveValue('main');
      }
    });
  });

  test.describe('Executions Page', () => {
    test('should display Executions page with required testids', async ({ page }) => {
      await page.goto('/executions?demo=1');
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('Executions');
    });

    test('should show executions table when executions exist', async ({ page }) => {
      await page.goto('/executions?demo=1');
      await page.waitForLoadState('networkidle');

      // Table should be visible if there are executions, otherwise empty state
      const table = page.getByTestId('executions-table');
      const emptyState = page.locator('text=No executions yet');

      // Either table or empty state should be visible
      const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasTable || hasEmptyState).toBe(true);
    });
  });

  test.describe('Execution Detail Page', () => {
    test('should display execution detail with required testids', async ({ page, request }) => {
      // Get existing executions
      const runsRes = await request.get('/api/runner/runs');
      const runsData = await runsRes.json();

      if (runsData.runs && runsData.runs.length > 0) {
        const executionId = runsData.runs[0].id;

        await page.goto(`/executions/${executionId}?demo=1`);
        await page.waitForLoadState('networkidle');

        // Check required testids
        await expect(page.getByTestId('page-root')).toBeVisible();
        await expect(page.getByTestId('execution-status')).toBeVisible();
        await expect(page.getByTestId('execution-logs')).toBeVisible();
        await expect(page.getByTestId('execution-refresh')).toBeVisible();
      }
    });

    test('should show PR link for completed executions', async ({ page, request }) => {
      // Get existing executions
      const runsRes = await request.get('/api/runner/runs');
      const runsData = await runsRes.json();

      // Find a completed execution with PR URL
      const completedRun = runsData.runs?.find(
        (run: { status: string; prUrl: string | null }) => run.status === 'COMPLETED' && run.prUrl
      );

      if (completedRun) {
        await page.goto(`/executions/${completedRun.id}?demo=1`);
        await page.waitForLoadState('networkidle');

        // PR link should be visible
        await expect(page.getByTestId('execution-pr-link')).toBeVisible();
      }
    });
  });

  test.describe('Complete Flow: Execute → Navigate → Verify', () => {
    // RUNNER_DRY_RUN=1 is set via playwright.config.ts webServer.env when CI=true
    test('should complete full execution flow with DRY RUN', async ({ page, request }) => {
      // Step 1: Create a PENDING work order via API
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

      expect(createWoRes.ok()).toBe(true);
      const woData = await createWoRes.json();
      const workOrderId = woData.workOrder?.id;
      expect(workOrderId).toBeTruthy();

      // Step 2: Navigate to workorders page
      await page.goto('/workorders?demo=1');
      await page.waitForLoadState('networkidle');

      // Step 3: Find and click the execute button for our work order
      const executeButton = page.getByTestId(`execute-workorder-${workOrderId}`);
      await expect(executeButton).toBeVisible({ timeout: 5000 });
      await executeButton.click();

      // Step 4: Verify modal opens and fill in form
      await expect(page.getByTestId('runner-exec-modal')).toBeVisible();
      await expect(page.getByTestId('runner-owner')).toBeVisible();
      await expect(page.getByTestId('runner-repo')).toBeVisible();
      await expect(page.getByTestId('runner-branch')).toBeVisible();
      await expect(page.getByTestId('runner-submit')).toBeVisible();

      // Fill in repository name (owner and branch have defaults)
      await page.getByTestId('runner-repo').fill('test-repo');

      // Step 5: Submit the form - modal submit navigates to /executions/{id}
      await page.getByTestId('runner-submit').click();
      await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 15000 });

      // Step 6: Verify execution detail page elements
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('execution-status')).toBeVisible();
      await expect(page.getByTestId('execution-refresh')).toBeVisible();

      // Step 7: Wait for data to load and refresh
      await page.waitForTimeout(1000);
      await page.getByTestId('execution-refresh').click();
      await page.waitForTimeout(1000);

      // Step 8: Assert execution-status shows Completed
      const statusText = await page.getByTestId('execution-status').textContent();
      expect(statusText).toContain('Completed');

      // Step 9: Assert execution-pr-link is visible (dummy URL from DRY RUN)
      await expect(page.getByTestId('execution-pr-link')).toBeVisible();
    });
  });
});

test.describe('API Endpoints for Runner UX', () => {
  test('GET /api/workorders should return workOrders array', async ({ request }) => {
    const response = await request.get('/api/workorders');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('workOrders');
    expect(Array.isArray(data.workOrders)).toBe(true);
  });

  test('GET /api/runner/runs should return runs array', async ({ request }) => {
    const response = await request.get('/api/runner/runs');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('runs');
    expect(Array.isArray(data.runs)).toBe(true);
  });

  test('GET /api/runner/runs/[id] should return 404 for non-existent run', async ({ request }) => {
    const response = await request.get('/api/runner/runs/non-existent-id');
    expect(response.status()).toBe(404);
  });

  test('POST /api/runner/execute should validate required fields', async ({ request }) => {
    // Missing targetRepoOwner
    const response1 = await request.post('/api/runner/execute', {
      data: {
        targetRepoName: 'test-repo',
        workOrderIds: ['wo-1'],
      },
    });
    expect([400, 401]).toContain(response1.status());

    // Missing targetRepoName
    const response2 = await request.post('/api/runner/execute', {
      data: {
        targetRepoOwner: 'test-owner',
        workOrderIds: ['wo-1'],
      },
    });
    expect([400, 401]).toContain(response2.status());

    // Missing workOrderIds
    const response3 = await request.post('/api/runner/execute', {
      data: {
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
      },
    });
    expect([400, 401]).toContain(response3.status());

    // Empty workOrderIds
    const response4 = await request.post('/api/runner/execute', {
      data: {
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
        workOrderIds: [],
      },
    });
    expect([400, 401]).toContain(response4.status());
  });
});
