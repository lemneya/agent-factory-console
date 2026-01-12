import { test, expect } from '@playwright/test';

test.describe('AFC-1.3 Adoptability Council', () => {
  test.describe('Council Dashboard', () => {
    test('should load council page', async ({ page }) => {
      await page.goto('/council');
      await expect(page).toHaveTitle(/Agent Factory/);
    });

    test('should display page header', async ({ page }) => {
      await page.goto('/council');
      await expect(page.locator('h1')).toContainText('Adoptability Council');
    });

    test('should have new evaluation button', async ({ page }) => {
      await page.goto('/council');
      await expect(page.getByRole('link', { name: /new evaluation/i })).toBeVisible();
    });

    test('should have decision type filter', async ({ page }) => {
      await page.goto('/council');
      await expect(page.getByLabel(/decision type/i)).toBeVisible();
    });

    test('should have maintenance risk filter', async ({ page }) => {
      await page.goto('/council');
      await expect(page.getByLabel(/maintenance risk/i)).toBeVisible();
    });

    test('should display stats cards', async ({ page }) => {
      await page.goto('/council');
      await expect(page.getByText('Total Decisions')).toBeVisible();
      await expect(page.getByText('ADOPT').first()).toBeVisible();
      await expect(page.getByText('ADAPT').first()).toBeVisible();
      await expect(page.getByText('BUILD').first()).toBeVisible();
    });

    test('should navigate to new evaluation page', async ({ page }) => {
      await page.goto('/council');
      await page.getByRole('link', { name: /new evaluation/i }).click();
      await expect(page).toHaveURL('/council/new');
    });
  });

  test.describe('New Evaluation Page', () => {
    test('should load new evaluation page', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.locator('h1')).toContainText('New Council Evaluation');
    });

    test('should have back link to council', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByRole('link', { name: /back to council/i })).toBeVisible();
    });

    test('should have project selector', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/project/i)).toBeVisible();
    });

    test('should have decision type buttons', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByRole('button', { name: /adopt/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /adapt/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /build/i })).toBeVisible();
    });

    test('should have candidate name input', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/candidate name/i)).toBeVisible();
    });

    test('should have candidate url input', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/candidate url/i)).toBeVisible();
    });

    test('should have license type selector', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/license type/i)).toBeVisible();
    });

    test('should have maintenance risk selector', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/maintenance risk/i)).toBeVisible();
    });

    test('should have confidence slider', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/confidence/i)).toBeVisible();
    });

    test('should have integration plan textarea', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/integration plan/i)).toBeVisible();
    });

    test('should have red team critique textarea', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/red team critique/i)).toBeVisible();
    });

    test('should have sources textarea', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/sources/i)).toBeVisible();
    });

    test('should have reasoning textarea', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByLabel(/reasoning/i)).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await page.goto('/council/new');
      await expect(page.getByRole('button', { name: /create decision/i })).toBeVisible();
    });

    test('should select decision type on click', async ({ page }) => {
      await page.goto('/council/new');
      const adoptButton = page.getByRole('button', { name: /adopt/i });
      await adoptButton.click();
      await expect(adoptButton).toHaveClass(/border-green-500/);
    });
  });

  test.describe('Council API', () => {
    test('should respond to council decisions GET API', async ({ request }) => {
      const response = await request.get('/api/council/decisions');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('decisions');
      expect(data).toHaveProperty('total');
    });

    test('should support decision filter parameter', async ({ request }) => {
      const response = await request.get('/api/council/decisions?decision=BUILD');
      expect(response.status()).toBe(200);
    });

    test('should support maintenanceRisk filter parameter', async ({ request }) => {
      const response = await request.get('/api/council/decisions?maintenanceRisk=LOW');
      expect(response.status()).toBe(200);
    });

    test('should return 400 for evaluate without projectId', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          decision: 'BUILD',
          confidence: 0.8,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
          reasoning: 'Test reasoning',
        },
      });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('projectId');
    });

    test('should return 400 for evaluate without decision', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          projectId: 'test-project',
          confidence: 0.8,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
          reasoning: 'Test reasoning',
        },
      });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('decision');
    });

    test('should return 400 for invalid decision type', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          projectId: 'test-project',
          decision: 'INVALID',
          confidence: 0.8,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
          reasoning: 'Test reasoning',
        },
      });
      expect(response.status()).toBe(400);
    });

    test('should return 400 for confidence out of range', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          projectId: 'test-project',
          decision: 'BUILD',
          confidence: 1.5,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
          reasoning: 'Test reasoning',
        },
      });
      expect(response.status()).toBe(400);
    });

    test('should return 400 for invalid maintenanceRisk', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          projectId: 'test-project',
          decision: 'BUILD',
          confidence: 0.8,
          maintenanceRisk: 'INVALID',
          sources: ['https://example.com'],
          reasoning: 'Test reasoning',
        },
      });
      expect(response.status()).toBe(400);
    });

    test('should return 400 for sources not array', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          projectId: 'test-project',
          decision: 'BUILD',
          confidence: 0.8,
          maintenanceRisk: 'LOW',
          sources: 'https://example.com',
          reasoning: 'Test reasoning',
        },
      });
      expect(response.status()).toBe(400);
    });

    test('should return 400 for missing reasoning', async ({ request }) => {
      const response = await request.post('/api/council/evaluate', {
        data: {
          projectId: 'test-project',
          decision: 'BUILD',
          confidence: 0.8,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
        },
      });
      expect(response.status()).toBe(400);
    });

    test('should return 404 for non-existent decision', async ({ request }) => {
      const response = await request.get('/api/council/decisions/nonexistent-id-123');
      expect(response.status()).toBe(404);
    });

    test('should return 404 for non-existent project council', async ({ request }) => {
      const response = await request.get('/api/projects/nonexistent-id-123/council');
      expect(response.status()).toBe(404);
    });

    test('should return 404 for override non-existent decision', async ({ request }) => {
      const response = await request.post('/api/council/decisions/nonexistent-id-123/override', {
        data: {
          decision: 'ADOPT',
          confidence: 0.9,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
          reasoning: 'Override test',
          overrideReason: 'Testing',
        },
      });
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Decision Types', () => {
    test('ADOPT option should be available', async ({ page }) => {
      await page.goto('/council/new');
      const adoptButton = page.getByRole('button', { name: /adopt/i });
      await expect(adoptButton).toBeVisible();
      await expect(adoptButton).toContainText('Use existing solution');
    });

    test('ADAPT option should be available', async ({ page }) => {
      await page.goto('/council/new');
      const adaptButton = page.getByRole('button', { name: /adapt/i });
      await expect(adaptButton).toBeVisible();
      await expect(adaptButton).toContainText('Modify existing solution');
    });

    test('BUILD option should be available', async ({ page }) => {
      await page.goto('/council/new');
      const buildButton = page.getByRole('button', { name: /build/i });
      await expect(buildButton).toBeVisible();
      await expect(buildButton).toContainText('Build from scratch');
    });
  });
});
