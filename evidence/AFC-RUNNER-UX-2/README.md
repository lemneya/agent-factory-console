# AFC-RUNNER-UX-2: Blueprint Batch Execute + Run Summary

## Overview

This feature enables 1-click execution of all PENDING WorkOrders from a Blueprint detail page, with a comprehensive Run Summary card on the execution detail page.

## Features Implemented

### 1. Blueprint Detail Page (`/blueprints/[id]`)

- **Execute all PENDING button** (`blueprint-execute-pending`)
  - Shows count of pending work orders
  - Disabled when no pending work orders exist
  - Opens execute modal on click

- **Status Summary Grid**
  - Shows counts for each status: PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED

- **Work Orders List**
  - Lists all work orders in the blueprint
  - Status badges with icons
  - Links to work orders page with focus param

### 2. Execute Modal

- Pre-fills owner (lemneya) and branch (main) as defaults
- Shows list of work orders being executed
- Requires repo name input
- Navigates to execution detail on success

### 3. Run Summary Card (`run-summary-card`)

Added to execution detail page with:
- **Total count** (`run-summary-total`)
- **Status breakdown**: Pending, In Progress, Completed, Failed, Skipped
- **Completed count** (`run-summary-completed`)
- **Failed count** (`run-summary-failed`)
- **PR Link** (`run-summary-pr-link`) - if prUrl exists

### 4. Blueprints API

- `GET /api/blueprints` - List all blueprints with work order counts
- `POST /api/blueprints` - Create blueprint (for seeding/testing, guarded)
- `GET /api/blueprints/[id]` - Get blueprint details with work orders

## Required Test IDs

| Test ID | Component | Description |
|---------|-----------|-------------|
| `blueprint-execute-pending` | Blueprint Detail | Execute all PENDING button |
| `run-summary-card` | Execution Detail | Run Summary card container |
| `run-summary-total` | Execution Detail | Total work orders count |
| `run-summary-completed` | Execution Detail | Completed count |
| `run-summary-failed` | Execution Detail | Failed count |
| `run-summary-pr-link` | Execution Detail | PR link in summary |

## E2E Test Coverage

File: `tests/runner-ux-blueprint.spec.ts`

### Test Cases

1. **Blueprint Detail Page**
   - Displays Execute all PENDING button with correct count
   - Shows disabled button when no PENDING work orders
   - Opens execute modal on button click

2. **Run Summary Card**
   - Displays run summary card on execution detail page
   - Shows correct total count

3. **Complete Flow: Blueprint Execute → Run Summary**
   - Seeds blueprint with 3 work orders (2 PENDING, 1 COMPLETED)
   - Navigates to blueprint detail page
   - Clicks Execute all PENDING (shows count of 2)
   - Submits modal with repo name
   - Verifies navigation to execution detail
   - Asserts run-summary-card visible
   - Asserts total count = 2 (only pending executed)
   - Asserts status = COMPLETED (DRY RUN mode)
   - Asserts PR link visible
   - Asserts WorkOrders Executed list shows exactly 2 items

## CI Determinism

Uses existing DRY RUN mode configured in `playwright.config.ts`:
- When `CI=true`, sets `RUNNER_DRY_RUN=1`
- Returns COMPLETED status + dummy prUrl
- No external dependencies required

## Files Changed

### New Files
- `src/app/api/blueprints/route.ts` - Blueprints list/create API
- `src/app/api/blueprints/[id]/route.ts` - Blueprint detail API
- `src/app/blueprints/[id]/page.tsx` - Blueprint detail page
- `tests/runner-ux-blueprint.spec.ts` - E2E tests
- `evidence/AFC-RUNNER-UX-2/README.md` - This file

### Modified Files
- `src/app/executions/[id]/page.tsx` - Added Run Summary card

## CI Status

- [ ] Lint: PENDING
- [ ] Type Check: PENDING
- [ ] Test: PENDING
- [ ] Build: PENDING
- [ ] Docker Build: PENDING
- [ ] E2E Tests: PENDING

## Screenshots

Screenshots will be added after CI passes.
