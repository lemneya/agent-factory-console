import { test, expect } from '@playwright/test';

test.describe('Preview Page', () => {
  test('renders preview page with all components', async ({ page }) => {
    await page.goto('/preview');

    // Check page structure
    await expect(page.getByTestId('page-root')).toBeVisible();
    await expect(page.getByTestId('page-title')).toHaveText('Preview');

    // Check route health grid is present
    await expect(page.getByTestId('route-health-grid')).toBeVisible();

    // Check smoke status card is present
    await expect(page.getByTestId('smoke-status-card')).toBeVisible();
  });

  test('preview page is accessible from sidebar', async ({ page }) => {
    await page.goto('/');

    // Click on Preview in sidebar
    await page.getByTestId('nav-preview').click();

    // Should navigate to preview page
    await expect(page).toHaveURL('/preview');
    await expect(page.getByTestId('page-title')).toHaveText('Preview');
  });

  test('route health grid shows all routes', async ({ page }) => {
    await page.goto('/preview');

    // Check that route health grid has rows for key routes
    await expect(page.getByTestId('route-row-projects')).toBeVisible();
    await expect(page.getByTestId('route-row-runs')).toBeVisible();
    await expect(page.getByTestId('route-row-blueprints')).toBeVisible();
    await expect(page.getByTestId('route-row-workorders')).toBeVisible();
  });

  test('smoke status card shows test status', async ({ page }) => {
    await page.goto('/preview');

    // Smoke status card should be visible
    const smokeCard = page.getByTestId('smoke-status-card');
    await expect(smokeCard).toBeVisible();

    // Should show status (PASS, FAIL, or UNKNOWN)
    await expect(smokeCard).toContainText(/PASS|FAIL|UNKNOWN/);
  });
});

test.describe('Preview API', () => {
  test('smoke-status endpoint returns valid response', async ({ request }) => {
    const response = await request.get('/api/preview/smoke-status');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('tests');
    expect(['PASS', 'FAIL', 'UNKNOWN']).toContain(data.status);
  });

  test('route-health endpoint validates path parameter', async ({ request }) => {
    // Test with invalid path (no leading /)
    const response = await request.post('/api/preview/route-health', {
      data: { path: 'invalid-path' },
    });

    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Path must start with /');
  });
});
