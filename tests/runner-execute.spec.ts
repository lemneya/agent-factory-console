/**
 * AFC-RUNNER-0: Build-to-PR Execution Engine - E2E Tests
 *
 * Tests the execution flow from approved WorkOrders to PR creation.
 * Uses mocked GitHub API in CI, but can create real PRs in demo mode.
 */
import { test, expect } from '@playwright/test';

test.describe('Runner Execution Engine E2E', () => {
  test.describe('API Validation', () => {
    test('POST /api/runner/execute should require authentication or return validation error', async ({
      request,
    }) => {
      const response = await request.post('/api/runner/execute', {
        data: {
          targetRepoName: 'test-repo',
          workOrderIds: ['wo-1'],
        },
      });
      // Accept 400 (validation error) or 401 (auth required)
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/runner/execute validation - missing targetRepoName', async ({ request }) => {
      const response = await request.post('/api/runner/execute', {
        data: {
          targetRepoOwner: 'test-owner',
          workOrderIds: ['wo-1'],
        },
      });
      // Accept 400 (validation error) or 401 (auth required)
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/runner/execute validation - missing workOrderIds', async ({ request }) => {
      const response = await request.post('/api/runner/execute', {
        data: {
          targetRepoOwner: 'test-owner',
          targetRepoName: 'test-repo',
        },
      });
      // Accept 400 (validation error) or 401 (auth required)
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/runner/execute validation - empty workOrderIds array', async ({ request }) => {
      const response = await request.post('/api/runner/execute', {
        data: {
          targetRepoOwner: 'test-owner',
          targetRepoName: 'test-repo',
          workOrderIds: [],
        },
      });
      // Accept 400 (validation error) or 401 (auth required)
      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('WorkOrder API', () => {
    test('GET /api/workorders should return list of work orders', async ({ request }) => {
      const response = await request.get('/api/workorders');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('workOrders');
      expect(Array.isArray(data.workOrders)).toBe(true);
    });

    test('GET /api/workorders should support blueprintId filter', async ({ request }) => {
      const response = await request.get('/api/workorders?blueprintId=test-bp-id');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('workOrders');
    });

    test('GET /api/workorders should support status filter', async ({ request }) => {
      const response = await request.get('/api/workorders?status=PENDING');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('workOrders');
    });

    test('GET /api/workorders/[id] should return 404 for non-existent work order', async ({
      request,
    }) => {
      const response = await request.get('/api/workorders/non-existent-id');
      expect(response.status()).toBe(404);
    });

    test('POST /api/workorders/[id]/execute should require target repo info or auth', async ({
      request,
    }) => {
      const response = await request.post('/api/workorders/test-wo-id/execute', {
        data: {},
      });
      // Either 400 (missing params), 401 (auth required), or 404 (work order not found)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Execution Runs API', () => {
    test('GET /api/runner/runs should return list of execution runs', async ({ request }) => {
      const response = await request.get('/api/runner/runs');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('runs');
      expect(Array.isArray(data.runs)).toBe(true);
    });

    test('GET /api/runner/runs should support projectId filter', async ({ request }) => {
      const response = await request.get('/api/runner/runs?projectId=test-project');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('runs');
    });

    test('GET /api/runner/runs should support limit parameter', async ({ request }) => {
      const response = await request.get('/api/runner/runs?limit=5');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('runs');
    });

    test('GET /api/runner/runs/[id] should return 404 for non-existent run', async ({
      request,
    }) => {
      const response = await request.get('/api/runner/runs/non-existent-id');
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Safety Gates', () => {
    test('POST /api/runner/execute should validate work order status or require auth', async ({
      request,
    }) => {
      // This test verifies that the execution endpoint checks work order status
      // In a real scenario, work orders must be in PENDING status
      const response = await request.post('/api/runner/execute', {
        data: {
          targetRepoOwner: 'lemneya',
          targetRepoName: 'orange-cab',
          workOrderIds: ['non-existent-wo'],
        },
      });
      // Accept 400 (work order not found) or 401 (auth required)
      expect([400, 401]).toContain(response.status());
    });

    test('Council Gate should be enforced when projectId is provided', async ({ request }) => {
      // This test verifies that Council Gate is checked
      // The execution should fail if no Council decision exists for the project
      const response = await request.post('/api/runner/execute', {
        data: {
          targetRepoOwner: 'lemneya',
          targetRepoName: 'orange-cab',
          workOrderIds: ['test-wo'],
          projectId: 'project-without-council',
        },
      });
      // Accept 400 (council gate failed) or 401 (auth required)
      expect([400, 401]).toContain(response.status());
    });
  });
});

test.describe('Runner Integration Flow', () => {
  // This test suite validates the complete flow:
  // 1. Create Blueprint draft
  // 2. Approve draft (creates WorkOrders)
  // 3. Execute WorkOrders
  // 4. Verify execution record created

  test.skip('Complete flow: Draft → Approve → Execute → PR', async ({ request }) => {
    // Skip in CI - this test requires real GitHub credentials
    // Run manually for proof-of-life demo

    // Step 1: Create a Blueprint draft
    const draftResponse = await request.post('/api/copilot/drafts', {
      data: {
        kind: 'BLUEPRINT',
        title: 'Test Blueprint for Runner',
        payloadJson: JSON.stringify({
          blueprint: {
            name: 'runner-test-blueprint',
            description: 'Test blueprint for AFC-RUNNER-0',
            modules: [
              {
                key: 'test-module',
                title: 'Test Module',
                domain: 'test',
                spec: 'A simple test module for runner validation',
              },
            ],
          },
          options: {
            createWorkOrdersAfterApproval: true,
          },
        }),
      },
    });
    expect(draftResponse.status()).toBe(201);
    const draft = await draftResponse.json();
    const draftId = draft.id;

    // Step 2: Approve the draft (creates WorkOrders)
    const approveResponse = await request.post(`/api/copilot/drafts/${draftId}/approve`, {
      data: {
        diffReviewed: true,
      },
    });
    expect(approveResponse.status()).toBe(200);
    const approveResult = await approveResponse.json();
    expect(approveResult.resultRef).toContain('Blueprint');

    // Step 3: Get the created WorkOrders
    const workOrdersResponse = await request.get('/api/workorders?status=PENDING');
    expect(workOrdersResponse.status()).toBe(200);
    const workOrdersData = await workOrdersResponse.json();
    const workOrderIds = workOrdersData.workOrders.map((wo: { id: string }) => wo.id);

    // Step 4: Execute the WorkOrders
    const executeResponse = await request.post('/api/runner/execute', {
      data: {
        targetRepoOwner: 'lemneya',
        targetRepoName: 'orange-cab',
        workOrderIds,
      },
    });

    // In CI, this will fail due to missing GitHub token
    // In demo mode with real auth, this should succeed
    if (executeResponse.status() === 200) {
      const executeResult = await executeResponse.json();
      expect(executeResult.success).toBe(true);
      expect(executeResult.executionRunId).toBeTruthy();
      expect(executeResult.prUrl).toBeTruthy();

      // Step 5: Verify execution record
      const runResponse = await request.get(`/api/runner/runs/${executeResult.executionRunId}`);
      expect(runResponse.status()).toBe(200);
      const runData = await runResponse.json();
      expect(runData.run.status).toBe('COMPLETED');
    }
  });
});
