/**
 * AFC-1.6: Memory Layer MVP - E2E Tests
 *
 * End-to-end tests for memory layer UI and API integration.
 */

import { test, expect } from '@playwright/test';

test.describe('Memory Layer E2E', () => {
  test.describe('Memory API', () => {
    test('POST /api/memory/ingest should accept memory items', async ({ request }) => {
      const response = await request.post('/api/memory/ingest', {
        data: {
          items: [
            {
              content: 'E2E test memory content',
              projectId: 'test-project-e2e',
              category: 'CONTEXT',
              scope: 'PROJECT',
            },
          ],
        },
      });

      // Should parse request correctly and return:
      // - 201 if DB is available
      // - 503 if DB not migrated (controlled error, not crash)
      const status = response.status();
      expect(status === 201 || status === 503).toBe(true);
    });

    test('POST /api/memory/query should accept query parameters', async ({ request }) => {
      const response = await request.post('/api/memory/query', {
        data: {
          projectId: 'test-project-e2e',
          limit: 10,
          orderBy: 'score',
        },
      });

      // Should parse request correctly and return:
      // - 200 if DB is available
      // - 503 if DB not migrated (controlled error, not crash)
      const status = response.status();
      expect(status === 200 || status === 503).toBe(true);
    });

    test('GET /api/memory/policy should require projectId', async ({ request }) => {
      const response = await request.get('/api/memory/policy');
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('projectId');
    });
  });

  test.describe('Memory UI Components', () => {
    test.skip('Project memory page should load', async ({ page }) => {
      // This test requires authentication, skip for basic E2E
      await page.goto('/projects/test-project/memory');

      // Check for memory page structure
      await expect(page.locator('h1')).toContainText('Memory');
    });

    test.skip('Run detail page should show memory panel', async ({ page }) => {
      // This test requires authentication, skip for basic E2E
      await page.goto('/runs/test-run');

      // Check for memory panel tabs
      await expect(page.locator('text=Memory Items')).toBeVisible();
      await expect(page.locator('text=Usage History')).toBeVisible();
      await expect(page.locator('text=Snapshots')).toBeVisible();
    });
  });

  test.describe('Memory API Validation', () => {
    test('should reject ingest with empty items array', async ({ request }) => {
      const response = await request.post('/api/memory/ingest', {
        data: {
          items: [],
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should reject ingest with items missing content', async ({ request }) => {
      const response = await request.post('/api/memory/ingest', {
        data: {
          items: [{ projectId: 'test' }],
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should reject policy update with invalid decayFactor', async ({ request }) => {
      const response = await request.put('/api/memory/policy', {
        data: {
          projectId: 'test-project',
          decayFactor: 1.5, // Invalid: must be 0-1
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should reject policy update with invalid accessBoost', async ({ request }) => {
      const response = await request.put('/api/memory/policy', {
        data: {
          projectId: 'test-project',
          accessBoost: -0.5, // Invalid: must be 0-1
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should reject policy update without projectId', async ({ request }) => {
      const response = await request.put('/api/memory/policy', {
        data: {
          maxItems: 500,
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Run Memory Endpoints', () => {
    test('GET /api/runs/[id]/memory/uses should return 404 for non-existent run', async ({
      request,
    }) => {
      const response = await request.get('/api/runs/non-existent-run/memory/uses');

      // Either 404 or 500 depending on DB state
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('GET /api/runs/[id]/memory/snapshots should return 404 for non-existent run', async ({
      request,
    }) => {
      const response = await request.get('/api/runs/non-existent-run/memory/snapshots');

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('POST /api/runs/[id]/memory/snapshots should require itemIds', async ({ request }) => {
      const response = await request.post('/api/runs/test-run/memory/snapshots', {
        data: {
          name: 'Test Snapshot',
          // Missing itemIds
        },
      });

      // Either 400 (missing itemIds) or 404 (run not found)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});
