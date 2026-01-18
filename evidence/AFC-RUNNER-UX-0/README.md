# AFC-RUNNER-UX-0: Execute from UI + Executions

## Summary

This gate implements the **Execute from UI** feature that allows users to execute PENDING WorkOrders directly from the WorkOrders page, track execution status, view logs, and access PR links.

## Features Implemented

### 1. WorkOrders Page Enhancement

- Added **Execute** button on PENDING WorkOrder rows
- Button triggers execution modal with repository configuration
- Required testid: `execute-workorder-{id}`

### 2. Execute Modal

- Modal for configuring execution target repository
- Fields: Repository Owner (default: `lemneya`), Repository Name, Base Branch (default: `main`)
- On submit: calls `POST /api/runner/execute`
- Required testids:
  - `runner-exec-modal`
  - `runner-owner`
  - `runner-repo`
  - `runner-branch`
  - `runner-submit`

### 3. Executions List Page (`/executions`)

- Lists all ExecutionRun records
- Shows: ID, Repository, Status, PR link, Created date
- Required testids:
  - `executions-table`
  - `execution-row-{id}`

### 4. Execution Detail Page (`/executions/[id]`)

- Shows execution status with visual indicators
- Displays execution logs with phase/level/message
- Shows PR link when available
- Auto-refreshes for in-progress executions
- Required testids:
  - `execution-status`
  - `execution-logs`
  - `execution-pr-link`
  - `execution-refresh`

### 5. CI Determinism (DRY RUN Mode)

- Configured via `playwright.config.ts` webServer env
- When `RUNNER_DRY_RUN=1` (automatically set in CI):
  - Skips actual GitHub operations
  - Returns COMPLETED status with dummy PR URL
  - Writes mock logs for all phases
- Ensures E2E tests pass deterministically in CI

## New/Modified Files

| File                                                  | Purpose                               |
| ----------------------------------------------------- | ------------------------------------- |
| `src/components/workorders/ExecuteWorkOrderModal.tsx` | Execute modal component               |
| `src/components/workorders/index.ts`                  | Component exports                     |
| `src/app/workorders/page.tsx`                         | Updated with Execute button and table |
| `src/app/executions/page.tsx`                         | Executions list page                  |
| `src/app/executions/[id]/page.tsx`                    | Execution detail page                 |
| `src/services/runner/index.ts`                        | Added DRY RUN mode logic              |
| `src/app/api/workorders/route.ts`                     | Added POST endpoint for E2E seeding   |
| `src/app/api/runner/execute/route.ts`                 | Updated auth bypass for CI            |
| `playwright.config.ts`                                | Added RUNNER_DRY_RUN env for CI       |
| `tests/runner-ux.spec.ts`                             | E2E tests for runner UI               |

## E2E Test Coverage

```typescript
// tests/runner-ux.spec.ts

test.describe('AFC-RUNNER-UX-0: Execute from UI', () => {
  // WorkOrders Page tests
  - should display WorkOrders page with table
  - should show Execute button on PENDING work orders

  // Execute Modal tests
  - should open execute modal with required testids
  - should have correct default values in modal

  // Executions Page tests
  - should display Executions page with required testids
  - should show executions table when executions exist

  // Execution Detail Page tests
  - should display execution detail with required testids
  - should show PR link for completed executions

  // Complete Flow test (DRY RUN)
  - should complete full execution flow with DRY RUN
    - Seed PENDING WorkOrder via API
    - Click Execute button
    - Submit modal with repo name
    - Assert navigates to /executions/{id}
    - Assert status=COMPLETED
    - Assert PR link visible (dummy URL)
});

test.describe('API Endpoints for Runner UX', () => {
  - GET /api/workorders should return workOrders array
  - GET /api/runner/runs should return runs array
  - GET /api/runner/runs/[id] should return 404 for non-existent run
  - POST /api/runner/execute should validate required fields
});
```

## Required TestIDs Summary

| TestID                   | Location         | Purpose                             |
| ------------------------ | ---------------- | ----------------------------------- |
| `execute-workorder-{id}` | WorkOrders table | Execute button for each PENDING row |
| `runner-exec-modal`      | Execute modal    | Modal container                     |
| `runner-owner`           | Execute modal    | Repository owner input              |
| `runner-repo`            | Execute modal    | Repository name input               |
| `runner-branch`          | Execute modal    | Base branch input                   |
| `runner-submit`          | Execute modal    | Submit button                       |
| `executions-table`       | Executions page  | Table container                     |
| `execution-row-{id}`     | Executions page  | Row for each execution              |
| `execution-status`       | Execution detail | Status badge                        |
| `execution-logs`         | Execution detail | Logs container                      |
| `execution-pr-link`      | Execution detail | PR link button                      |
| `execution-refresh`      | Execution detail | Refresh button                      |

## DRY RUN Mode

The DRY RUN mode is activated when `RUNNER_DRY_RUN=1` is set. This is automatically configured in `playwright.config.ts` when `CI=true`:

```typescript
// playwright.config.ts
webServer: {
  env: {
    ...process.env,
    RUNNER_DRY_RUN: process.env.CI ? '1' : (process.env.RUNNER_DRY_RUN ?? ''),
  },
}
```

In DRY RUN mode:

1. ExecutionRun record is created normally
2. Mock logs are written for each phase (CLONE, APPLY, BUILD, TEST, PR_CREATE)
3. Status is set to COMPLETED
4. Dummy PR URL is returned: `https://github.com/{owner}/{repo}/pull/999`

This ensures E2E tests can verify the complete flow without requiring real GitHub credentials or making actual API calls.

## API Endpoints

| Endpoint                | Method | Description                         |
| ----------------------- | ------ | ----------------------------------- |
| `/api/workorders`       | GET    | List work orders                    |
| `/api/workorders`       | POST   | Create work order (for E2E seeding) |
| `/api/runner/execute`   | POST   | Execute work orders                 |
| `/api/runner/runs`      | GET    | List execution runs                 |
| `/api/runner/runs/[id]` | GET    | Get execution run details           |

## Verification Steps

1. Navigate to `/workorders`
2. Find a PENDING work order
3. Click the "Execute" button
4. Fill in repository name in the modal
5. Click "Execute" to submit
6. Verify navigation to `/executions/{id}`
7. Verify status shows COMPLETED (in DRY RUN mode)
8. Verify PR link is present and clickable

## CI Status (All Passing)

| Check        | Status     |
| ------------ | ---------- |
| Lint         | ✅ SUCCESS |
| Type Check   | ✅ SUCCESS |
| Test         | ✅ SUCCESS |
| Build        | ✅ SUCCESS |
| Docker Build | ✅ SUCCESS |
| E2E Tests    | ✅ SUCCESS |

## PR

- **Title:** AFC-RUNNER-UX-0: Execute from UI + Executions
- **URL:** https://github.com/lemneya/agent-factory-console/pull/32
- **Branch:** `feature/afc-runner-ux-0`
