import { test, expect } from '@playwright/test';

test.describe('UX-GATE-1: Auth CTA and Demo Mode', () => {
  test.describe('Signed-out CTA Panel', () => {
    test('shows CTA panel on /runs when signed out', async ({ page }) => {
      await page.goto('/runs');

      // Should show the SignedOutCTA component
      const ctaPanel = page.getByTestId('signed-out-cta');
      await expect(ctaPanel).toBeVisible();

      // Should have all three options
      await expect(page.getByTestId('sign-in-github-btn')).toBeVisible();
      await expect(page.getByTestId('view-demo-data-btn')).toBeVisible();
      await expect(page.getByTestId('quick-setup-link')).toBeVisible();
    });

    test('shows CTA panel on /projects when signed out', async ({ page }) => {
      await page.goto('/projects');

      const ctaPanel = page.getByTestId('signed-out-cta');
      await expect(ctaPanel).toBeVisible();
      await expect(page.getByTestId('sign-in-github-btn')).toBeVisible();
    });

    test('shows CTA panel on /blueprints when signed out', async ({ page }) => {
      await page.goto('/blueprints');

      const ctaPanel = page.getByTestId('signed-out-cta');
      await expect(ctaPanel).toBeVisible();
      await expect(page.getByTestId('sign-in-github-btn')).toBeVisible();
    });

    test('shows CTA panel on /workorders when signed out', async ({ page }) => {
      await page.goto('/workorders');

      const ctaPanel = page.getByTestId('signed-out-cta');
      await expect(ctaPanel).toBeVisible();
      await expect(page.getByTestId('sign-in-github-btn')).toBeVisible();
    });
  });

  test.describe('Demo Mode', () => {
    test('clicking "View Demo Data" navigates to demo mode', async ({ page }) => {
      await page.goto('/runs');

      // Click the View Demo Data button
      await page.getByTestId('view-demo-data-btn').click();

      // Should navigate to /runs?demo=1
      await expect(page).toHaveURL(/\/runs\?demo=1/);

      // Should show the demo mode badge
      const demoBadge = page.getByTestId('demo-mode-badge');
      await expect(demoBadge).toBeVisible();
      await expect(demoBadge).toContainText('DEMO MODE (read-only)');
    });

    test('demo mode shows page content instead of CTA', async ({ page }) => {
      // Navigate directly to demo mode
      await page.goto('/runs?demo=1');

      // CTA should NOT be visible
      const ctaPanel = page.getByTestId('signed-out-cta');
      await expect(ctaPanel).not.toBeVisible();

      // Page title should be visible
      await expect(page.getByTestId('page-title')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('Runs');
    });

    test('demo mode disables mutation buttons', async ({ page }) => {
      await page.goto('/runs?demo=1');

      // New Run button should be disabled in demo mode
      const newRunBtn = page.getByTestId('new-run-btn');
      await expect(newRunBtn).toBeDisabled();
    });

    test('exit demo mode button works', async ({ page }) => {
      await page.goto('/runs?demo=1');

      // Click exit demo mode
      await page.getByTestId('exit-demo-mode-btn').click();

      // Should redirect to page without demo param
      await expect(page).toHaveURL(/\/runs$/);

      // CTA should be visible again
      const ctaPanel = page.getByTestId('signed-out-cta');
      await expect(ctaPanel).toBeVisible();
    });
  });

  test.describe('Page Navigation', () => {
    test('all nav routes render without 404', async ({ page }) => {
      const routes = [
        '/',
        '/projects',
        '/runs',
        '/blueprints',
        '/workorders',
        '/council',
        '/notifications',
      ];

      for (const route of routes) {
        await page.goto(route);
        // Should have page-root testid
        await expect(page.getByTestId('page-root')).toBeVisible();
        // Should have page-title testid
        await expect(page.getByTestId('page-title')).toBeVisible();
      }
    });
  });

  test.describe('Demo Mode Persistence', () => {
    test('demo mode persists across page navigation', async ({ page }) => {
      // Start demo mode on runs
      await page.goto('/runs?demo=1');
      await expect(page.getByTestId('demo-mode-badge')).toBeVisible();

      // Navigate to blueprints with demo param
      await page.goto('/blueprints?demo=1');
      await expect(page.getByTestId('demo-mode-badge')).toBeVisible();

      // Navigate to workorders with demo param
      await page.goto('/workorders?demo=1');
      await expect(page.getByTestId('demo-mode-badge')).toBeVisible();
    });
  });
});
