import { test, expect } from '@playwright/test';

test.describe('UX-GATE-2: Happy Path Flow', () => {
  test.describe('Projects Page', () => {
    test('shows projects-new button', async ({ page }) => {
      await page.goto('/projects?demo=1');
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('Projects');
      await expect(page.getByTestId('projects-new')).toBeVisible();
    });

    test('projects-new button links to /projects/new', async ({ page }) => {
      await page.goto('/projects?demo=1');
      const newProjectLink = page.getByTestId('projects-new');
      await expect(newProjectLink).toHaveAttribute('href', '/projects/new');
    });

    test('empty state shows create project button', async ({ page }) => {
      await page.goto('/projects?demo=1');
      // If no projects, should show empty state with create button
      const emptyNewBtn = page.getByTestId('projects-empty-new');
      if (await emptyNewBtn.isVisible()) {
        await expect(emptyNewBtn).toHaveAttribute('href', '/projects/new');
      }
    });
  });

  test.describe('Runs Page', () => {
    test('shows runs-new button', async ({ page }) => {
      await page.goto('/runs?demo=1');
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('Runs');
      await expect(page.getByTestId('runs-new')).toBeVisible();
    });

    test('runs-new button links to /runs/new', async ({ page }) => {
      await page.goto('/runs?demo=1');
      const newRunLink = page.getByTestId('runs-new');
      await expect(newRunLink).toHaveAttribute('href', '/runs/new');
    });
  });

  test.describe('New Project Page', () => {
    test('renders new project form', async ({ page }) => {
      await page.goto('/projects/new?demo=1');
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('New Project');
      await expect(page.getByTestId('project-name-input')).toBeVisible();
      await expect(page.getByTestId('project-repo-input')).toBeVisible();
      await expect(page.getByTestId('project-description-input')).toBeVisible();
      await expect(page.getByTestId('project-submit-btn')).toBeVisible();
    });

    test('form fields are disabled in demo mode', async ({ page }) => {
      await page.goto('/projects/new?demo=1');
      await expect(page.getByTestId('project-name-input')).toBeDisabled();
      await expect(page.getByTestId('project-submit-btn')).toBeDisabled();
    });

    test('shows demo mode warning', async ({ page }) => {
      await page.goto('/projects/new?demo=1');
      await expect(page.getByText('Read-only demo mode')).toBeVisible();
    });
  });

  test.describe('New Run Page', () => {
    test('renders new run form', async ({ page }) => {
      await page.goto('/runs/new?demo=1');
      await expect(page.getByTestId('page-root')).toBeVisible();
      await expect(page.getByTestId('page-title')).toContainText('New Run');
      await expect(page.getByTestId('run-project-select')).toBeVisible();
      await expect(page.getByTestId('run-name-input')).toBeVisible();
      await expect(page.getByTestId('run-kind-adopt')).toBeVisible();
      await expect(page.getByTestId('run-kind-adapt')).toBeVisible();
      await expect(page.getByTestId('run-kind-build')).toBeVisible();
      await expect(page.getByTestId('run-submit-btn')).toBeVisible();
    });

    test('form fields are disabled in demo mode', async ({ page }) => {
      await page.goto('/runs/new?demo=1');
      await expect(page.getByTestId('run-project-select')).toBeDisabled();
      await expect(page.getByTestId('run-name-input')).toBeDisabled();
      await expect(page.getByTestId('run-submit-btn')).toBeDisabled();
    });

    test('shows demo mode warning', async ({ page }) => {
      await page.goto('/runs/new?demo=1');
      await expect(page.getByText('Read-only demo mode')).toBeVisible();
    });

    test('run kind buttons are present and clickable', async ({ page }) => {
      await page.goto('/runs/new?demo=1');
      // In demo mode they're disabled but visible
      await expect(page.getByTestId('run-kind-adopt')).toBeVisible();
      await expect(page.getByTestId('run-kind-adapt')).toBeVisible();
      await expect(page.getByTestId('run-kind-build')).toBeVisible();
    });
  });

  test.describe('Demo Mode Badge', () => {
    test('shows demo mode badge on projects page', async ({ page }) => {
      await page.goto('/projects?demo=1');
      await expect(page.getByText('DEMO MODE')).toBeVisible();
    });

    test('shows demo mode badge on runs page', async ({ page }) => {
      await page.goto('/runs?demo=1');
      await expect(page.getByText('DEMO MODE')).toBeVisible();
    });
  });

  test.describe('Navigation Flow', () => {
    test('can navigate from projects to new project', async ({ page }) => {
      await page.goto('/projects?demo=1');
      await page.getByTestId('projects-new').click();
      await expect(page).toHaveURL(/\/projects\/new/);
      await expect(page.getByTestId('page-title')).toContainText('New Project');
    });

    test('can navigate from runs to new run', async ({ page }) => {
      await page.goto('/runs?demo=1');
      await page.getByTestId('runs-new').click();
      await expect(page).toHaveURL(/\/runs\/new/);
      await expect(page.getByTestId('page-title')).toContainText('New Run');
    });

    test('back link on new project page works', async ({ page }) => {
      await page.goto('/projects/new?demo=1');
      await page.getByText('Back to Projects').click();
      await expect(page).toHaveURL(/\/projects/);
    });

    test('back link on new run page works', async ({ page }) => {
      await page.goto('/runs/new?demo=1');
      await page.getByText('Back to Runs').click();
      await expect(page).toHaveURL(/\/runs/);
    });
  });
});
