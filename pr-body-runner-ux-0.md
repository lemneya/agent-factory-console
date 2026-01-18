## Summary

Implements **AFC-RUNNER-UX-0: Execute from UI + Executions** - allowing users to execute PENDING WorkOrders directly from the UI, track execution status, view logs, and access PR links.

## Features

### 1. WorkOrders Page Enhancement
- Added **Execute** button on PENDING WorkOrder rows
- Button triggers execution modal with repository configuration
- TestID: `execute-workorder-{id}`

### 2. Execute Modal
- Modal for configuring execution target repository
- Fields: Repository Owner (default: `lemneya`), Repository Name, Base Branch (default: `main`)
- On submit: calls `POST /api/runner/execute`
- TestIDs: `runner-exec-modal`, `runner-owner`, `runner-repo`, `runner-branch`, `runner-submit`

### 3. Executions List Page (`/executions`)
- Lists all ExecutionRun records
- Shows: ID, Repository, Status, PR link, Created date
- TestIDs: `executions-table`, `execution-row-{id}`

### 4. Execution Detail Page (`/executions/[id]`)
- Shows execution status with visual indicators
- Displays execution logs with phase/level/message
- Shows PR link when available
- Auto-refreshes for in-progress executions
- TestIDs: `execution-status`, `execution-logs`, `execution-pr-link`, `execution-refresh`

### 5. CI Determinism (DRY RUN Mode)
- When `RUNNER_DRY_RUN=1` and `NODE_ENV=test`:
  - Skips actual GitHub operations
  - Returns COMPLETED status with dummy PR URL
  - Writes mock logs for all phases

## Files Changed

| File | Change |
|------|--------|
| `src/components/workorders/ExecuteWorkOrderModal.tsx` | New - Execute modal component |
| `src/components/workorders/index.ts` | New - Component exports |
| `src/app/workorders/page.tsx` | Modified - Added Execute button and table |
| `src/app/executions/page.tsx` | New - Executions list page |
| `src/app/executions/[id]/page.tsx` | New - Execution detail page |
| `src/services/runner/index.ts` | Modified - Added DRY RUN mode logic |
| `src/app/api/workorders/route.ts` | Modified - Added POST endpoint for E2E seeding |
| `tests/runner-ux.spec.ts` | New - E2E tests for runner UI |
| `evidence/AFC-RUNNER-UX-0/README.md` | New - Evidence documentation |
| `evidence/AFC-RUNNER-UX-0/e2e-proof-snippet.ts` | New - E2E proof snippet |

## E2E Tests

```typescript
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

  // Complete Flow test
  - should complete full execution flow with DRY RUN
});
```

## Required TestIDs (All Implemented)

| TestID | Location |
|--------|----------|
| `execute-workorder-{id}` | WorkOrders table |
| `runner-exec-modal` | Execute modal |
| `runner-owner` | Execute modal |
| `runner-repo` | Execute modal |
| `runner-branch` | Execute modal |
| `runner-submit` | Execute modal |
| `executions-table` | Executions page |
| `execution-row-{id}` | Executions page |
| `execution-status` | Execution detail |
| `execution-logs` | Execution detail |
| `execution-pr-link` | Execution detail |
| `execution-refresh` | Execution detail |

## CI Note

**Manual action required:** Add `RUNNER_DRY_RUN: '1'` to `.github/workflows/e2e.yml` job env section for CI determinism. See `evidence/AFC-RUNNER-UX-0/README.md` for details.

## Verification

- [x] TypeScript compiles without errors
- [x] ESLint passes (only pre-existing warnings)
- [x] Build succeeds
- [x] Unit tests pass
- [x] All required testids implemented
- [x] Evidence documentation created
