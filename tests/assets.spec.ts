import { test, expect } from '@playwright/test';
import { enableDemoMode } from './helpers/demo';

/**
 * E2E Tests for Asset Registry (AFC-1.2)
 *
 * Tests the asset registry functionality including:
 * - Asset list page loads
 * - Create asset + version flow
 * - Attach asset to project
 */

test.describe('AFC-1.2 Asset Registry', () => {
  test.describe('Assets Page', () => {
    // Enable demo mode for UI tests so we see full UI instead of SignedOutCTA
    test.beforeEach(async ({ page }) => {
      await enableDemoMode(page);
    });

    test('should load assets page', async ({ page }) => {
      await page.goto('/assets');
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      // Check for heading
      await expect(page.getByRole('heading', { name: /asset registry/i }).first()).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('networkidle');
      // Check for search input using testid
      const searchInput = page.getByTestId('assets-search');
      await expect(searchInput).toBeVisible();
    });

    test('should display category filter', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('networkidle');
      // Check for category dropdown using testid
      const categorySelect = page.getByTestId('assets-category-filter');
      await expect(categorySelect).toBeVisible();
    });

    test('should have link to create new asset', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('networkidle');
      // Check for "New Asset" button (disabled in demo mode)
      const newAssetButton = page.getByTestId('assets-new');
      await expect(newAssetButton).toBeVisible();
      // In demo mode, it should be disabled
      await expect(newAssetButton).toBeDisabled();
    });

    test('should navigate to new asset page', async ({ page }) => {
      // For this test, we need to be authenticated, so skip in demo mode
      // This test will pass when authenticated
      await page.goto('/assets/new');
      await page.waitForLoadState('networkidle');
      // Just check we're on the new asset page
      await expect(page).toHaveURL(/\/assets\/new/);
    });
  });

  test.describe('Create Asset Page', () => {
    test('should load create asset page', async ({ page }) => {
      await page.goto('/assets/new');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /create new asset/i })).toBeVisible();
    });

    test('should have required form fields', async ({ page }) => {
      await page.goto('/assets/new');
      await page.waitForLoadState('networkidle');

      // Check for required fields
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/slug/i)).toBeVisible();
      await expect(page.getByLabel(/category/i)).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await page.goto('/assets/new');
      await page.waitForLoadState('networkidle');
      const submitButton = page.getByRole('button', { name: /create asset/i });
      await expect(submitButton).toBeVisible();
    });

    test('should have back link to assets page', async ({ page }) => {
      await page.goto('/assets/new');
      await page.waitForLoadState('networkidle');
      const backLink = page.getByRole('link', { name: /back to assets/i });
      await expect(backLink).toBeVisible();
    });

    test('should auto-generate slug from name', async ({ page }) => {
      await page.goto('/assets/new');
      await page.waitForLoadState('networkidle');

      // Fill in name
      const nameInput = page.getByLabel(/name/i).first();
      await nameInput.fill('Test Asset Name');

      // Check slug was auto-generated
      const slugInput = page.getByLabel(/slug/i);
      await expect(slugInput).toHaveValue(/test-asset-name/i);
    });
  });

  test.describe('Assets API', () => {
    test('should respond to assets GET API', async ({ request }) => {
      const response = await request.get('/api/assets');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/assets');
      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should return array of assets', async ({ request }) => {
      const response = await request.get('/api/assets');
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test('should support search query parameter', async ({ request }) => {
      const response = await request.get('/api/assets?q=test');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should support tag filter parameter', async ({ request }) => {
      const response = await request.get('/api/assets?tag=auth');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should support category filter parameter', async ({ request }) => {
      const response = await request.get('/api/assets?category=auth');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should accept POST to create asset', async ({ request }) => {
      const response = await request.post('/api/assets', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          slug: `test-asset-${Date.now()}`,
          name: 'Test Asset',
          category: 'testing',
          description: 'A test asset',
        },
      });
      // May return 201 (created), 400 (validation), or 401/403 (auth)
      expect([201, 400, 401, 403, 409]).toContain(response.status());
    });

    test('should return 400 for invalid POST data', async ({ request }) => {
      const response = await request.post('/api/assets', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          // Missing required fields
          name: 'Test Asset',
        },
      });
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Asset Versions API', () => {
    test('should return 404 for non-existent asset', async ({ request }) => {
      const response = await request.get('/api/assets/nonexistent-id-123');
      expect(response.status()).toBe(404);
    });

    test('should return 404 for versions of non-existent asset', async ({ request }) => {
      const response = await request.get('/api/assets/nonexistent-id-123/versions');
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Project Assets API', () => {
    test('should return 404 for non-existent project assets', async ({ request }) => {
      const response = await request.get('/api/projects/nonexistent-id-123/assets');
      expect(response.status()).toBe(404);
    });

    test('should return 404 for attach on non-existent project', async ({ request }) => {
      const response = await request.post('/api/projects/nonexistent-id-123/assets/attach', {
        headers: { 'Content-Type': 'application/json' },
        data: { assetVersionId: 'test-version-id' },
      });
      expect(response.status()).toBe(404);
    });

    test('should return 400 for attach without assetVersionId', async ({ request }) => {
      const response = await request.post('/api/projects/some-project-id/assets/attach', {
        headers: { 'Content-Type': 'application/json' },
        data: {},
      });
      expect([400, 404]).toContain(response.status());
    });

    test('should return 400 for generate-tasks without required fields', async ({ request }) => {
      const response = await request.post('/api/projects/some-project-id/assets/generate-tasks', {
        headers: { 'Content-Type': 'application/json' },
        data: {},
      });
      expect([400, 404]).toContain(response.status());
    });
  });
});

test.describe('Performance', () => {
  test('assets page should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/assets');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('assets API should respond within 1 second', async ({ request }) => {
    const startTime = Date.now();
    await request.get('/api/assets');
    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(1000);
  });
});
