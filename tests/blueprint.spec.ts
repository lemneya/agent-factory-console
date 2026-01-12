import { test, expect } from '@playwright/test';

/**
 * AFC-1.7 E2E Tests: Blueprints + Deterministic Slicer (WorkOrders MVP)
 *
 * Tests the full flow: create blueprint → publish → slice → view workorders
 */

test.describe('AFC-1.7 Blueprint + Slicer E2E', () => {
  test.describe('Navigation', () => {
    test('should have navigation to blueprints page', async ({ page }) => {
      await page.goto('/');
      const blueprintsLink = page.getByRole('link', { name: /blueprints/i }).first();
      await expect(blueprintsLink).toBeVisible();
    });

    test('should have navigation to workorders page', async ({ page }) => {
      await page.goto('/');
      const workordersLink = page.getByRole('link', { name: /workorders/i }).first();
      await expect(workordersLink).toBeVisible();
    });

    test('should navigate to blueprints page', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('blueprints-link').click();
      await expect(page).toHaveURL(/\/blueprints/);
      await expect(page.getByTestId('page-title')).toContainText('Blueprints');
    });

    test('should navigate to workorders page', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('workorders-link').click();
      await expect(page).toHaveURL(/\/workorders/);
      await expect(page.getByTestId('page-title')).toContainText('WorkOrders');
    });
  });

  test.describe('Blueprints Page', () => {
    test('should display blueprints list page', async ({ page }) => {
      await page.goto('/blueprints');
      await expect(page.getByTestId('page-title')).toContainText('Blueprints');
    });

    test('should show new blueprint button', async ({ page }) => {
      await page.goto('/blueprints');
      await expect(page.getByTestId('new-blueprint-btn')).toBeVisible();
    });

    test('should navigate to new blueprint page', async ({ page }) => {
      await page.goto('/blueprints');
      await page.getByTestId('new-blueprint-btn').click();
      await expect(page).toHaveURL(/\/blueprints\/new/);
      await expect(page.getByTestId('page-title')).toContainText('New Blueprint');
    });
  });

  test.describe('New Blueprint Page', () => {
    test('should display new blueprint form', async ({ page }) => {
      await page.goto('/blueprints/new');
      await expect(page.getByTestId('blueprint-name-input')).toBeVisible();
      await expect(page.getByTestId('blueprint-project-select')).toBeVisible();
      await expect(page.getByTestId('blueprint-spec-input')).toBeVisible();
    });

    test('should have validate button', async ({ page }) => {
      await page.goto('/blueprints/new');
      await expect(page.getByTestId('validate-spec-btn')).toBeVisible();
    });

    test('should have create button', async ({ page }) => {
      await page.goto('/blueprints/new');
      await expect(page.getByTestId('create-blueprint-btn')).toBeVisible();
    });

    test('should pre-populate with sample spec', async ({ page }) => {
      await page.goto('/blueprints/new');
      const specInput = page.getByTestId('blueprint-spec-input');
      const value = await specInput.inputValue();
      expect(value).toContain('blueprint_id');
      expect(value).toContain('modules');
      expect(value).toContain('spec_items');
    });
  });

  test.describe('WorkOrders Page', () => {
    test('should display workorders list page', async ({ page }) => {
      await page.goto('/workorders');
      await expect(page.getByTestId('page-title')).toContainText('WorkOrders');
    });

    test('should show empty state when no workorders', async ({ page }) => {
      await page.goto('/workorders');
      // Either shows workorders or empty state
      const pageContent = await page.textContent('main');
      expect(pageContent?.includes('WorkOrders') || pageContent?.includes('No WorkOrders')).toBe(
        true
      );
    });
  });

  test.describe('API Endpoints', () => {
    test('GET /api/blueprints should return array', async ({ request }) => {
      const response = await request.get('/api/blueprints');
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('GET /api/workorders should return array', async ({ request }) => {
      const response = await request.get('/api/workorders');
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('POST /api/blueprints/validate should validate spec', async ({ request }) => {
      const validSpec = {
        blueprint_id: 'TEST',
        title: 'Test Blueprint',
        modules: [
          {
            module_id: 'MOD-001',
            title: 'Test Module',
            domains: ['BACKEND'],
            spec_items: [
              {
                spec_id: 'SPEC-001',
                must: 'Test requirement',
                acceptance: ['Test passes'],
              },
            ],
          },
        ],
      };

      const response = await request.post('/api/blueprints/validate', {
        data: { specJson: validSpec },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.errors).toHaveLength(0);
      expect(data.specIds).toContain('SPEC-001');
      expect(data.specHash).toBeDefined();
    });

    test('POST /api/blueprints/validate should reject invalid spec', async ({ request }) => {
      const invalidSpec = {
        blueprint_id: '',
        title: '',
        modules: [],
      };

      const response = await request.post('/api/blueprints/validate', {
        data: { specJson: invalidSpec },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.errors.length).toBeGreaterThan(0);
    });

    test('POST /api/blueprints/validate should detect duplicate spec_ids', async ({ request }) => {
      const specWithDuplicates = {
        blueprint_id: 'TEST',
        title: 'Test Blueprint',
        modules: [
          {
            module_id: 'MOD-001',
            title: 'Test Module',
            domains: ['BACKEND'],
            spec_items: [
              { spec_id: 'DUP', must: 'Test 1', acceptance: [] },
              { spec_id: 'DUP', must: 'Test 2', acceptance: [] },
            ],
          },
        ],
      };

      const response = await request.post('/api/blueprints/validate', {
        data: { specJson: specWithDuplicates },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.errors.some((e: string) => e.includes('Duplicate spec_id'))).toBe(true);
    });
  });

  test.describe('Slicer Determinism', () => {
    test('should produce same specHash for same input', async ({ request }) => {
      const spec = {
        blueprint_id: 'DETERMINISM-TEST',
        title: 'Determinism Test',
        modules: [
          {
            module_id: 'MOD-001',
            title: 'Module 1',
            domains: ['BACKEND', 'FRONTEND'],
            spec_items: [{ spec_id: 'S1', must: 'Test', acceptance: ['Pass'] }],
          },
        ],
      };

      const response1 = await request.post('/api/blueprints/validate', {
        data: { specJson: spec },
      });
      const response2 = await request.post('/api/blueprints/validate', {
        data: { specJson: spec },
      });

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.specHash).toBe(data2.specHash);
    });

    test('should produce same specHash regardless of key order', async ({ request }) => {
      const spec1 = {
        blueprint_id: 'ORDER-TEST',
        title: 'Order Test',
        modules: [],
      };

      const spec2 = {
        title: 'Order Test',
        modules: [],
        blueprint_id: 'ORDER-TEST',
      };

      const response1 = await request.post('/api/blueprints/validate', {
        data: { specJson: spec1 },
      });
      const response2 = await request.post('/api/blueprints/validate', {
        data: { specJson: spec2 },
      });

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.specHash).toBe(data2.specHash);
    });
  });

  test.describe('Schema Validation', () => {
    test('should validate all domain types', async ({ request }) => {
      const domains = ['FRONTEND', 'BACKEND', 'DEVOPS', 'QA', 'ALGO', 'INTEGRATION'];

      for (const domain of domains) {
        const spec = {
          blueprint_id: `DOMAIN-${domain}`,
          title: `${domain} Test`,
          modules: [
            {
              module_id: 'MOD',
              title: 'Module',
              domains: [domain],
              spec_items: [{ spec_id: 'S1', must: 'Test', acceptance: [] }],
            },
          ],
        };

        const response = await request.post('/api/blueprints/validate', {
          data: { specJson: spec },
        });

        const data = await response.json();
        expect(data.valid).toBe(true);
      }
    });

    test('should reject invalid domain', async ({ request }) => {
      const spec = {
        blueprint_id: 'INVALID-DOMAIN',
        title: 'Invalid Domain Test',
        modules: [
          {
            module_id: 'MOD',
            title: 'Module',
            domains: ['INVALID_DOMAIN'],
            spec_items: [{ spec_id: 'S1', must: 'Test', acceptance: [] }],
          },
        ],
      };

      const response = await request.post('/api/blueprints/validate', {
        data: { specJson: spec },
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.errors.some((e: string) => e.includes('invalid domain'))).toBe(true);
    });

    test('should validate interfaces structure', async ({ request }) => {
      const spec = {
        blueprint_id: 'INTERFACES-TEST',
        title: 'Interfaces Test',
        modules: [
          {
            module_id: 'MOD',
            title: 'Module',
            domains: ['BACKEND'],
            spec_items: [{ spec_id: 'S1', must: 'Test', acceptance: [] }],
            interfaces: [{ name: 'TestDTO', path: 'types/test.ts', description: 'Test DTO' }],
          },
        ],
      };

      const response = await request.post('/api/blueprints/validate', {
        data: { specJson: spec },
      });

      const data = await response.json();
      expect(data.valid).toBe(true);
    });

    test('should validate owned_paths_hint structure', async ({ request }) => {
      const spec = {
        blueprint_id: 'PATHS-TEST',
        title: 'Paths Test',
        modules: [
          {
            module_id: 'MOD',
            title: 'Module',
            domains: ['BACKEND', 'FRONTEND'],
            spec_items: [{ spec_id: 'S1', must: 'Test', acceptance: [] }],
            owned_paths_hint: {
              BACKEND: ['src/api/**'],
              FRONTEND: ['src/app/**'],
            },
          },
        ],
      };

      const response = await request.post('/api/blueprints/validate', {
        data: { specJson: spec },
      });

      const data = await response.json();
      expect(data.valid).toBe(true);
    });
  });
});
