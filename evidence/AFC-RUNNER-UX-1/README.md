# AFC-RUNNER-UX-1: Multi-select WorkOrders Execution

## Summary

This gate implements multi-select WorkOrder execution from the UI, allowing users to select multiple PENDING work orders and execute them in a single run. The execution detail page now shows the list of executed work orders with links back to the WorkOrders page.

## Features Implemented

### 1. WorkOrders Page - Multi-select

- **Checkboxes** for PENDING work orders (`workorders-select-{id}`)
- **Selection toolbar** showing count of selected items
- **"Execute Selected" button** (`execute-selected`) appears when items are selected
- **"Select all PENDING"** quick action
- **Focus param support** (`?focus={id}`) for auto-scroll and highlighting

### 2. Execute Modal Enhancement

- Modal now shows list of work orders being executed
- Displays count when multiple items selected
- Same defaults: owner=lemneya, branch=main

### 3. Execution Detail - WorkOrders List

- **"WorkOrders Executed" section** (`execution-workorders-list`)
- Each work order links to `/workorders?focus={id}` (`execution-workorder-link-{id}`)
- Shows work order key, title, and domain

### 4. Re-run Button

- **Re-run button** (`execution-rerun`) on execution detail page
- Re-executes with same repo/branch and work order IDs
- Creates new execution run and navigates to it
- Works with DRY RUN mode in CI

### 5. Focus Param on WorkOrders Page

- URL param `?focus={id}` auto-scrolls to and highlights the specified row
- Visual highlight with cyan ring around focused row
- Enables quick navigation from execution detail back to specific work order

## Required TestIDs

| TestID | Location | Description |
|--------|----------|-------------|
| `workorders-select-{id}` | WorkOrders page | Checkbox for selecting PENDING work order |
| `execute-selected` | WorkOrders page | Button to execute selected work orders |
| `execution-workorders-list` | Execution detail | Container for work orders list |
| `execution-workorder-link-{id}` | Execution detail | Link to work order with focus |
| `execution-rerun` | Execution detail | Re-run button |

## E2E Tests

### Test File: `tests/runner-ux-multiselect.spec.ts`

**Test Cases:**

1. **WorkOrders Page - Multi-select**
   - Display checkboxes for PENDING work orders
   - Show Execute Selected button when items selected

2. **Execution Detail - WorkOrders List**
   - Display execution-workorders-list testid
   - Display workorder links with correct testids

3. **Execution Detail - Re-run Button**
   - Display execution-rerun button

4. **WorkOrders Page - Focus Param**
   - Highlight row when focus param is provided

5. **Complete Multi-select Flow** (DRY RUN)
   - Seed 2 PENDING work orders via API
   - Select both → Execute Selected → submit modal
   - Assert execution detail shows 2 workorders in list
   - Assert status=COMPLETED + PR link visible
   - Test clicking workorder link navigates with focus

6. **Re-run Execution**
   - Execute a work order
   - Click re-run button
   - Verify new execution is created
   - Verify new execution completes with DRY RUN

## CI Determinism

- **DRY RUN mode** activated via `playwright.config.ts` webServer env when `CI=true`
- Sets `RUNNER_DRY_RUN=1` automatically in CI environment
- Execute endpoint returns COMPLETED run + dummy prUrl
- No workflow file changes required

## Files Changed

| File | Change |
|------|--------|
| `src/app/workorders/page.tsx` | Added multi-select checkboxes, Execute Selected button, focus param support |
| `src/app/executions/[id]/page.tsx` | Added WorkOrders executed list, Re-run button |
| `src/services/runner/index.ts` | Updated getExecutionRun to include workOrder details |
| `tests/runner-ux-multiselect.spec.ts` | New E2E tests for multi-select flow |
| `evidence/AFC-RUNNER-UX-1/README.md` | This documentation |

## Local Verification

```bash
# Run format, lint, typecheck
npm run format && npm run lint && npm run typecheck

# Run unit tests
npm test

# Run build
npm run build

# Run E2E tests (with DRY RUN)
RUNNER_DRY_RUN=1 npx playwright test tests/runner-ux-multiselect.spec.ts
```

## CI Status

- Lint: ✅ Passing (2 warnings in unrelated files)
- Type Check: ✅ Passing
- Unit Tests: ✅ Passing
- Build: ✅ Passing
- E2E Tests: Pending CI run

## PR

**Title:** AFC-RUNNER-UX-1: Multi-select WorkOrders Execution + Run Summary

**Branch:** `feature/afc-runner-ux-1`
