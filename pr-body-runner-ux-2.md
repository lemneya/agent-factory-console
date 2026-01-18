## Summary

Implements 1-click execution of all PENDING WorkOrders from a Blueprint detail page, with a comprehensive Run Summary card on the execution detail page.

## Features

### Blueprint Detail Page (`/blueprints/[id]`)

- **Execute all PENDING button** - Shows count of pending work orders, opens execute modal
- **Status Summary Grid** - Shows counts for each status (PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED)
- **Work Orders List** - Lists all work orders with status badges and links

### Run Summary Card

Added to execution detail page with:

- Total count, status breakdown (Pending, In Progress, Completed, Failed, Skipped)
- PR Link in summary section

### Blueprints API

- `GET /api/blueprints` - List all blueprints with work order counts
- `POST /api/blueprints` - Create blueprint (for seeding/testing, guarded)
- `GET /api/blueprints/[id]` - Get blueprint details with work orders

## Required Test IDs

| Test ID                     | Component        |
| --------------------------- | ---------------- |
| `blueprint-execute-pending` | Blueprint Detail |
| `run-summary-card`          | Execution Detail |
| `run-summary-total`         | Execution Detail |
| `run-summary-completed`     | Execution Detail |
| `run-summary-failed`        | Execution Detail |
| `run-summary-pr-link`       | Execution Detail |

## E2E Tests

File: `tests/runner-ux-blueprint.spec.ts`

- Blueprint Detail Page tests (button display, disabled state, modal)
- Run Summary Card tests
- Complete Flow: Blueprint Execute → Run Summary (DRY RUN deterministic)

## Files Changed

### New Files

- `src/app/api/blueprints/route.ts`
- `src/app/api/blueprints/[id]/route.ts`
- `src/app/blueprints/[id]/page.tsx`
- `tests/runner-ux-blueprint.spec.ts`
- `evidence/AFC-RUNNER-UX-2/README.md`
- `evidence/AFC-RUNNER-UX-2/e2e-proof-snippet.ts`

### Modified Files

- `src/app/executions/[id]/page.tsx` - Added Run Summary card

## DoD Checklist

- [x] Blueprint detail page: Execute all PENDING button
- [x] Auto-fill repo/branch (defaults: owner=lemneya, branch=main)
- [x] Execution detail Run Summary card with counts
- [x] PR link in summary if prUrl exists
- [x] Required testids implemented
- [x] E2E tests for complete flow
- [x] Evidence documentation
