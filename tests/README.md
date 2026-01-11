# End-to-End Tests

This directory contains E2E tests for the Agent Factory Console application using Playwright.

## Structure

```
tests/
├── auth/              # Authentication flow tests
│   └── login.spec.ts
├── projects/          # Projects page tests
│   └── projects.spec.ts
├── runs/              # Runs and tasks tests
│   ├── runs.spec.ts
│   └── task-board.spec.ts
├── notifications/     # Notifications page tests
│   └── notifications.spec.ts
├── fixtures/          # Test fixtures and helpers
│   └── index.ts
└── e2e.spec.ts       # Basic E2E smoke tests
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Prerequisites

Before running E2E tests:

1. Start the development environment:

   ```bash
   docker-compose up -d
   ```

2. Ensure database is seeded (if needed):
   ```bash
   npm run db:seed
   ```

## Writing Tests

### Basic Page Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test('should display projects list', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });
});
```

### Authentication Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show GitHub login button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in with github/i })).toBeVisible();
  });
});
```

### Task Board Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Board', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login and navigate to task board
    await page.goto('/runs/test-run-id');
  });

  test('should display kanban columns', async ({ page }) => {
    await expect(page.getByTestId('column-TODO')).toBeVisible();
    await expect(page.getByTestId('column-DOING')).toBeVisible();
    await expect(page.getByTestId('column-DONE')).toBeVisible();
    await expect(page.getByTestId('column-BLOCKED')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByLabel('Title').fill('New test task');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('New test task')).toBeVisible();
  });
});
```

## Test Fixtures

### Custom Fixtures

```typescript
// tests/fixtures/index.ts
import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Perform authentication
    await page.goto('/login');
    // ... login steps
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### Using Fixtures

```typescript
import { test, expect } from './fixtures';

test('authenticated user can see projects', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/projects');
  await expect(authenticatedPage.getByRole('heading', { name: 'Projects' })).toBeVisible();
});
```

## Test Data

### Seeding Test Data

For E2E tests, you may need test data in the database:

```bash
# Create test seed script
npm run db:seed:test
```

### Cleaning Up

Tests should clean up after themselves or use isolated data:

```typescript
test.afterEach(async ({ page }) => {
  // Cleanup test data via API or database
});
```

## CI/CD Integration

E2E tests run in CI with the following configuration:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Start services
        run: docker-compose up -d
      - name: Run E2E tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging

### Visual Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run in debug mode (step through)
npx playwright test --debug

# Run with trace viewer
npx playwright test --trace on
```

### Viewing Traces

```bash
# After test run
npx playwright show-trace trace.zip
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Selectors**: Use data-testid attributes for reliable selection
3. **Waiting**: Use Playwright's auto-waiting, avoid arbitrary timeouts
4. **Assertions**: Use specific assertions for clearer failures
5. **Cleanup**: Clean up test data to prevent flaky tests
