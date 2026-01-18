## Summary

Implements multi-select WorkOrder execution from the UI, allowing users to select multiple PENDING work orders and execute them in a single run. The execution detail page now shows the list of executed work orders with links back to the WorkOrders page.

## Features

### WorkOrders Page - Multi-select

- ✅ Checkboxes for PENDING work orders (`workorders-select-{id}`)
- ✅ Selection toolbar with count
- ✅ "Execute Selected" button (`execute-selected`)
- ✅ "Select all PENDING" quick action
- ✅ Focus param support (`?focus={id}`) for auto-scroll/highlight

### Execution Detail - WorkOrders List

- ✅ "WorkOrders Executed" section (`execution-workorders-list`)
- ✅ Work order links with focus param (`execution-workorder-link-{id}`)
- ✅ Shows work order key, title, and domain

### Re-run Button

- ✅ Re-run button (`execution-rerun`) on execution detail
- ✅ Re-executes with same repo/branch and work order IDs
- ✅ Works with DRY RUN mode in CI

## Required TestIDs

| TestID                          | Status |
| ------------------------------- | ------ |
| `workorders-select-{id}`        | ✅     |
| `execute-selected`              | ✅     |
| `execution-workorders-list`     | ✅     |
| `execution-workorder-link-{id}` | ✅     |
| `execution-rerun`               | ✅     |

## E2E Tests

New test file: `tests/runner-ux-multiselect.spec.ts`

- Multi-select checkbox display
- Execute Selected button visibility
- WorkOrders list in execution detail
- Re-run button functionality
- Focus param highlighting
- **Complete multi-select flow** (DRY RUN):
  - Seed 2 PENDING work orders
  - Select both → Execute Selected → submit modal
  - Assert execution detail shows 2 workorders in list
  - Assert status=COMPLETED + PR link visible

## CI Determinism

DRY RUN mode activated via `playwright.config.ts` webServer env when `CI=true`. No workflow file changes required.

## Files Changed

- `src/app/workorders/page.tsx` - Multi-select UI
- `src/app/executions/[id]/page.tsx` - WorkOrders list + Re-run
- `src/services/runner/index.ts` - Include workOrder details in getExecutionRun
- `tests/runner-ux-multiselect.spec.ts` - E2E tests
- `evidence/AFC-RUNNER-UX-1/` - Documentation

## Evidence

- `evidence/AFC-RUNNER-UX-1/README.md`
- `evidence/AFC-RUNNER-UX-1/e2e-proof-snippet.ts`
