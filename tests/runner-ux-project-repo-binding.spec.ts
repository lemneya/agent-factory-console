/**
 * AFC-RUNNER-UX-3: Project Repo Binding E2E Tests
 *
 * Tests that blueprint batch execute uses project repo config
 * to execute immediately without showing the modal.
 *
 * Uses DRY RUN mode in CI for deterministic execution.
 */

import { test, expect } from '@playwright/test';

test.describe('AFC-RUNNER-UX-3: Project Repo Binding (Zero Typing)', () => {
  // Helper to seed a project via API
  async function seedProject(
    request: ReturnType<typeof test.request>,
    name: string,
    repoOwner?: string,
    repoName?: string,
    baseBranch?: string
  ): Promise<string> {
    const response = await request.post('/api/test/seed/project', {
      data: {
        repoName: name,
        repoFullName: `${repoOwner || 'test-owner'}/${name}`,
        description: `Test project for ${name}`,
        htmlUrl: `https://github.com/${repoOwner || 'test-owner'}/${name}`,
        repoOwner,
        baseBranch,
      },
    });
    expect(response.ok()).toBe(true);
    const data = await response.json();
    return data.project.id;
  }

  // Helper to seed a blueprint via API
  async function seedBlueprint(
    request: ReturnType<typeof test.request>,
    name: string,
    projectId?: string,
    description?: string
  ): Promise<string> {
    const response = await request.post('/api/blueprints', {
      data: { name, description, projectId },
    });
    expect(response.ok()).toBe(true);
    const data = await response.json();
    return data.blueprint.id;
  }

  // Helper to seed a work order via API
  async function seedWorkOrder(
    request: ReturnType<typeof test.request>,
    blueprintId: string,
    key: string,
    title: string,
    domain: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'SKIPPED' = 'PENDING'
  ): Promise<string> {
    const response = await request.post('/api/workorders', {
      data: {
        blueprintId,
        key,
        title,
        domain,
        spec: `Spec for ${title}`,
        status,
      },
    });
    expect(response.ok()).toBe(true);
    const data = await response.json();
    return data.workOrder.id;
  }

  test('executes blueprint batch without modal when project repo config exists', async ({
    page,
    request,
  }) => {
    // Seed: create project with repo config
    const projectId = await seedProject(
      request,
      'test-repo-binding',
      'lemneya',
      'test-repo-binding',
      'main'
    );

    // Seed: create blueprint attached to project
    const blueprintId = await seedBlueprint(
      request,
      'Blueprint with Project Config',
      projectId,
      'This blueprint has project repo binding'
    );

    // Seed: create 2 PENDING work orders
    const woId1 = await seedWorkOrder(request, blueprintId, 'auth-module', 'Auth Module', 'auth');
    const woId2 = await seedWorkOrder(request, blueprintId, 'crud-api', 'CRUD API', 'crud');

    // Navigate to blueprint detail page in demo mode
    await page.goto(`/blueprints/${blueprintId}?demo=1`);

    // Assert page loaded correctly
    await expect(page.getByTestId('page-title')).toContainText('Blueprint with Project Config');

    // Assert execute button shows correct count
    const executeButton = page.getByTestId('blueprint-execute-pending');
    await expect(executeButton).toContainText('Execute all PENDING (2)');

    // Assert missing repo config warning is NOT visible (config exists)
    await expect(page.getByTestId('blueprint-missing-repo-config')).not.toBeVisible();

    // Click execute button
    await executeButton.click();

    // Wait for navigation to execution detail page WITHOUT modal appearing
    await page.waitForURL(/\/executions\/[a-zA-Z0-9]+/, { timeout: 30000 });

    // Wait for page root to be visible first
    await expect(page.getByTestId('page-root')).toBeVisible({ timeout: 10000 });

    // Wait for execution status to be visible
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('execution-status')).toBeVisible({ timeout: 15000 });

    // Assert status is COMPLETED (DRY RUN mode)
    const statusBadge = page.getByTestId('execution-status');
    await expect(statusBadge).toContainText('Completed');

    // Assert PR link is visible (dummy URL from DRY RUN)
    const prLink = page.getByTestId('execution-pr-link');
    await expect(prLink).toBeVisible();

    // Assert run summary card is visible
    const summaryCard = page.getByTestId('run-summary-card');
    await expect(summaryCard).toBeVisible();

    // Assert total count reflects the 2 pending executed
    const totalCount = page.getByTestId('run-summary-total');
    await expect(totalCount).toHaveText('2');

    // Assert WorkOrders Executed list shows exactly 2 work orders
    const workordersList = page.getByTestId('execution-workorders-list');
    await expect(workordersList).toBeVisible();

    // Check the individual work order links
    await expect(page.getByTestId(`execution-workorder-link-${woId1}`)).toBeVisible();
    await expect(page.getByTestId(`execution-workorder-link-${woId2}`)).toBeVisible();
  });

  test('shows warning and link to settings when project repo config is missing', async ({
    page,
    request,
  }) => {
    // Seed: create project WITHOUT repo config
    const projectId = await seedProject(request, 'test-no-config');

    // Seed: create blueprint attached to project
    const blueprintId = await seedBlueprint(
      request,
      'Blueprint without Config',
      projectId,
      'This blueprint has no project repo binding'
    );

    // Seed: create 1 PENDING work order
    await seedWorkOrder(request, blueprintId, 'wo-1', 'Work Order 1', 'auth');

    // Navigate to blueprint detail page in demo mode
    await page.goto(`/blueprints/${blueprintId}?demo=1`);

    // Assert page loaded correctly
    await expect(page.getByTestId('page-title')).toContainText('Blueprint without Config');

    // Assert missing repo config warning IS visible
    const warningBanner = page.getByTestId('blueprint-missing-repo-config');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText('Repository Configuration Required');

    // Assert link to project settings is visible
    const settingsLink = page.getByTestId('blueprint-go-to-project-settings');
    await expect(settingsLink).toBeVisible();
    await expect(settingsLink).toHaveAttribute('href', `/projects/${projectId}/settings`);

    // Click execute button - should show modal since config is missing
    await page.getByTestId('blueprint-execute-pending').click();

    // Assert modal is visible
    const modal = page.getByTestId('runner-exec-modal');
    await expect(modal).toBeVisible();
  });

  test('project settings page allows configuring repo binding', async ({ page, request }) => {
    // Seed: create project WITHOUT repo config
    const projectId = await seedProject(request, 'test-settings-page');

    // Navigate to project settings page in demo mode
    await page.goto(`/projects/${projectId}/settings?demo=1`);

    // Assert page loaded correctly
    await expect(page.getByTestId('page-title')).toContainText('Project Settings');

    // Assert form fields are visible
    const ownerInput = page.getByTestId('project-repo-owner');
    const nameInput = page.getByTestId('project-repo-name');
    const branchInput = page.getByTestId('project-repo-branch');
    const saveButton = page.getByTestId('project-repo-save');

    await expect(ownerInput).toBeVisible();
    await expect(nameInput).toBeVisible();
    await expect(branchInput).toBeVisible();
    await expect(saveButton).toBeVisible();

    // Fill in the form
    await ownerInput.fill('lemneya');
    await nameInput.fill('agent-factory-console');
    await branchInput.fill('main');

    // Click save button
    await saveButton.click();

    // Wait for success message
    await expect(page.getByText('Settings saved successfully!')).toBeVisible({ timeout: 5000 });
  });
});
