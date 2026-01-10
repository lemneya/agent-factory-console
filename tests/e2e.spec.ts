import { test, expect } from '@playwright/test'

/**
 * E2E Smoke Tests for Agent Factory Console
 *
 * These tests verify the basic functionality of the application
 * as specified in the AFC-0 Definition of Done.
 */

test.describe('AFC-0 Proof of Life', () => {
  test.describe('Application Startup', () => {
    test('should load the application homepage', async ({ page }) => {
      await page.goto('/')
      // Verify the app loads without errors
      await expect(page).toHaveTitle(/Agent Factory Console/i)
    })

    test('should display the dashboard layout', async ({ page }) => {
      await page.goto('/')
      // Check for main layout elements
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()
    })
  })

  test.describe('Authentication', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await page.goto('/projects')
      // Should redirect to login or show login prompt
      await expect(page.getByText(/sign in|login/i).first()).toBeVisible()
    })

    test('should display GitHub OAuth option', async ({ page }) => {
      await page.goto('/')
      // Look for GitHub sign in button
      const githubButton = page.getByRole('button', { name: /github/i })
      await expect(githubButton).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should have navigation to projects page', async ({ page }) => {
      await page.goto('/')
      const projectsLink = page.getByRole('link', { name: /projects/i })
      await expect(projectsLink).toBeVisible()
    })

    test('should have navigation to notifications page', async ({ page }) => {
      await page.goto('/')
      const notificationsLink = page.getByRole('link', { name: /notifications/i })
      await expect(notificationsLink).toBeVisible()
    })

    test('should have navigation to runs page', async ({ page }) => {
      await page.goto('/')
      const runsLink = page.getByRole('link', { name: /runs/i })
      await expect(runsLink).toBeVisible()
    })
  })

  test.describe('Projects Page', () => {
    test('should load projects page', async ({ page }) => {
      await page.goto('/projects')
      await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()
    })
  })

  test.describe('Notifications Page', () => {
    test('should load notifications page', async ({ page }) => {
      await page.goto('/notifications')
      await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible()
    })
  })

  test.describe('Runs Page', () => {
    test('should load runs page', async ({ page }) => {
      await page.goto('/runs')
      await expect(page.getByRole('heading', { name: /runs/i })).toBeVisible()
    })
  })
})

test.describe('API Health Checks', () => {
  test('should respond to projects API', async ({ request }) => {
    const response = await request.get('/api/projects')
    // May return 401 if not authenticated, but should not 500
    expect([200, 401, 403]).toContain(response.status())
  })

  test('should respond to runs API', async ({ request }) => {
    const response = await request.get('/api/runs')
    expect([200, 401, 403]).toContain(response.status())
  })

  test('should respond to tasks API', async ({ request }) => {
    const response = await request.get('/api/tasks')
    expect([200, 401, 403]).toContain(response.status())
  })

  test('should accept webhook POST', async ({ request }) => {
    const response = await request.post('/api/webhooks/github', {
      headers: {
        'X-GitHub-Event': 'ping',
        'Content-Type': 'application/json',
      },
      data: { zen: 'test' },
    })
    // May return 401/400 without proper signature, but should not 500
    expect([200, 400, 401, 403]).toContain(response.status())
  })
})
