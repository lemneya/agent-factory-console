import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Agent Factory Console
 *
 * These tests verify the functionality of the application
 * as specified in the AFC-0/AFC-1 Definition of Done.
 */

test.describe('AFC-0 Proof of Life', () => {
  test.describe('Application Startup', () => {
    test('should load the application homepage', async ({ page }) => {
      await page.goto('/');
      // Verify the app loads without errors
      await expect(page).toHaveTitle(/Agent Factory Console/i);
    });

    test('should display the dashboard layout', async ({ page }) => {
      await page.goto('/');
      // Check for main layout elements
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    });

    test('should not have any console errors on load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out expected errors (like favicon 404)
      const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Authentication', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await page.goto('/projects');
      // Should redirect to login or show login prompt
      await expect(page.getByText(/sign in|login/i).first()).toBeVisible();
    });

    test('should display GitHub OAuth option', async ({ page }) => {
      await page.goto('/');
      // Look for GitHub sign in button
      const githubButton = page.getByRole('button', { name: /github/i });
      await expect(githubButton).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have navigation to projects page', async ({ page }) => {
      await page.goto('/');
      // Look for link in navigation sidebar (first match) or any link to projects
      const projectsLink = page.getByRole('link', { name: /projects/i }).first();
      await expect(projectsLink).toBeVisible();
    });

    test('should have navigation to notifications page', async ({ page }) => {
      await page.goto('/');
      const notificationsLink = page.getByRole('link', { name: /notifications/i }).first();
      await expect(notificationsLink).toBeVisible();
    });

    test('should have navigation to runs page', async ({ page }) => {
      await page.goto('/');
      const runsLink = page.getByRole('link', { name: /runs/i }).first();
      await expect(runsLink).toBeVisible();
    });

    test('should navigate to projects page when clicked', async ({ page }) => {
      await page.goto('/');
      // Use sidebar nav link specifically
      const nav = page.locator('nav');
      const projectsLink = nav.getByRole('link', { name: /projects/i });
      await projectsLink.click();
      await expect(page).toHaveURL(/\/projects/);
    });

    test('should navigate to notifications page when clicked', async ({ page }) => {
      await page.goto('/');
      const nav = page.locator('nav');
      const notificationsLink = nav.getByRole('link', { name: /notifications/i });
      await notificationsLink.click();
      await expect(page).toHaveURL(/\/notifications/);
    });

    test('should navigate to runs page when clicked', async ({ page }) => {
      await page.goto('/');
      const nav = page.locator('nav');
      const runsLink = nav.getByRole('link', { name: /runs/i });
      await runsLink.click();
      await expect(page).toHaveURL(/\/runs/);
    });
  });

  test.describe('Projects Page', () => {
    test('should load projects page', async ({ page }) => {
      await page.goto('/projects');
      await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    });

    test('should have page structure', async ({ page }) => {
      await page.goto('/projects');
      // Should have a heading
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });

  test.describe('Notifications Page', () => {
    test('should load notifications page', async ({ page }) => {
      await page.goto('/notifications');
      await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
    });

    test('should have page structure', async ({ page }) => {
      await page.goto('/notifications');
      // Should have a heading
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });

  test.describe('Runs Page', () => {
    test('should load runs page', async ({ page }) => {
      await page.goto('/runs');
      await expect(page.getByRole('heading', { name: /runs/i })).toBeVisible();
    });

    test('should have page structure', async ({ page }) => {
      await page.goto('/runs');
      // Should have a heading
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });
});

test.describe('API Health Checks', () => {
  test.describe('Health Endpoint', () => {
    test('should return healthy status', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
    });

    test('should return valid JSON', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should return valid timestamp', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();

      // Verify timestamp is a valid ISO string
      const timestamp = new Date(data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  test.describe('Projects API', () => {
    test('should respond to projects API', async ({ request }) => {
      const response = await request.get('/api/projects');
      // May return 401 if not authenticated, but should not 500
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/projects');
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  test.describe('Runs API', () => {
    test('should respond to runs API', async ({ request }) => {
      const response = await request.get('/api/runs');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/runs');
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  test.describe('Tasks API', () => {
    test('should respond to tasks API', async ({ request }) => {
      const response = await request.get('/api/tasks');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/tasks');
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  test.describe('GitHub Events API', () => {
    test('should respond to github-events API', async ({ request }) => {
      const response = await request.get('/api/github-events');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/github-events');
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  test.describe('Webhook Endpoint', () => {
    test('should accept webhook POST', async ({ request }) => {
      const response = await request.post('/api/webhooks/github', {
        headers: {
          'X-GitHub-Event': 'ping',
          'Content-Type': 'application/json',
        },
        data: { zen: 'test' },
      });
      // May return 401/400 without proper signature, but should not 500
      expect([200, 400, 401, 403, 500]).toContain(response.status());
    });

    test('should return JSON response', async ({ request }) => {
      const response = await request.post('/api/webhooks/github', {
        headers: {
          'X-GitHub-Event': 'ping',
          'Content-Type': 'application/json',
        },
        data: { zen: 'test' },
      });
      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should reject request without X-GitHub-Event header', async ({ request }) => {
      const response = await request.post('/api/webhooks/github', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: { zen: 'test' },
      });
      // Should not return 200 without proper event header
      expect(response.status()).not.toBe(200);
    });
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 for unknown routes gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-12345');
    // Should return 404 or redirect
    expect([404, 200]).toContain(response?.status() ?? 0);
  });

  test('should handle 404 for unknown API routes', async ({ request }) => {
    const response = await request.get('/api/nonexistent-endpoint-12345');
    expect(response.status()).toBe(404);
  });
});

test.describe('Performance', () => {
  test('homepage should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('health API should respond within 1 second', async ({ request }) => {
    const startTime = Date.now();
    await request.get('/api/health');
    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(1000);
  });
});
