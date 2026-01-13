# UX-GATE-2: Project + Run Creation (Happy Path Flow)

## Summary

This gate implements the first "MVP factory motion" - allowing users to create a Project and start a Run from that Project.

## Implementation Details

### A) Projects List: Real CTA + Empty State

- **File**: `src/app/projects/page.tsx`
- **Changes**:
  - Added header action button "New Project" with `data-testid="projects-new"`
  - Routes to `/projects/new`
  - Empty state shows "Create Project" button with `data-testid="projects-empty-new"`
  - Demo mode: buttons visible but disabled with helper text

### B) Create Project Page

- **File**: `src/app/projects/new/page.tsx`
- **Form Fields**:
  - `name` (required) - `data-testid="project-name-input"`
  - `repoFullName` (optional) - `data-testid="project-repo-input"`
  - `description` (optional) - `data-testid="project-description-input"`
- **Submit**: `data-testid="project-submit-btn"`
- **Behavior**:
  - Calls POST `/api/projects`
  - On success redirects to `/projects/[id]`
  - Demo mode: form disabled, shows "Read-only demo mode" warning

### C) Project Detail Page: "Start Run" CTA

- **File**: `src/app/projects/[id]/page.tsx`
- **Changes**:
  - Primary action: "Start Run" button with `data-testid="project-start-run"`
  - Links to `/runs/new?projectId=<id>`
  - Shows project stats (runs, events, council decisions)
  - Lists recent runs with status badges

### D) Create Run Page (non-BUILD)

- **File**: `src/app/runs/new/page.tsx`
- **Form Fields**:
  - Project dropdown - `data-testid="run-project-select"`
  - Run name - `data-testid="run-name-input"`
  - Run kind selector:
    - ADOPT - `data-testid="run-kind-adopt"`
    - ADAPT - `data-testid="run-kind-adapt"`
    - BUILD - `data-testid="run-kind-build"`
- **Submit**: `data-testid="run-submit-btn"`
- **BUILD Protection**:
  - If BUILD selected and no CouncilDecision exists, shows inline message
  - "Council decision required for BUILD runs"
  - Submit button disabled
- **Behavior**:
  - Query param `projectId` preselects project
  - Calls POST `/api/runs`
  - On success redirects to `/runs/[id]`

### E) Runs Page: New Run Header Action

- **File**: `src/app/runs/page.tsx`
- **Changes**:
  - Header action "New Run" with `data-testid="runs-new"`
  - Links to `/runs/new`
  - Demo mode: link disabled with error message

## E2E Tests

- **File**: `tests/ux-gate-2-happy-path.spec.ts`
- **Coverage**:
  - Projects page shows `projects-new` button
  - Runs page shows `runs-new` button
  - `/projects/new` renders form
  - `/runs/new` renders form
  - Demo mode shows disabled forms
  - Navigation flow works (projects → new project, runs → new run)
  - Back links work

## Demo Mode Behavior

- All pages show "DEMO MODE (read-only)" badge
- Form fields are disabled
- Submit buttons are disabled
- Helper text explains sign-in requirement

## Acceptance Criteria

- [x] New Project flow works end-to-end (create → redirect → project detail)
- [x] New Run flow works end-to-end for ADOPT/ADAPT (create → redirect → run detail)
- [x] BUILD is blocked unless council decision exists
- [x] Demo mode shows same UX but read-only/disabled
- [x] CI green + evidence committed
