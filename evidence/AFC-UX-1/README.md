# AFC-UX-1: Zenflow-style New Task Modal

## Summary

Upgraded the "Add Task" modal on Run Detail page (`/runs/[id]`) into a Zenflow-style task creator with:
- Mode picker: Quick change / Fix bug / Spec and build / Full SDD workflow
- Task title (required)
- Optional description textarea
- Optional assignee
- Toggle: Auto-start next steps on success
- Buttons: Cancel | Create | Create & Run

## Implementation

### API Changes

**POST /api/tasks** (src/app/api/tasks/route.ts)
- Now accepts `kind` parameter
- Valid kinds: `INTEGRATE_ASSET`, `BUILD_CUSTOM`, `RESEARCH`, `QA`, `QUICK_CHANGE`, `FIX_BUG`, `SPEC_BUILD`, `FULL_SDD`
- Default: `BUILD_CUSTOM`

**PUT /api/tasks/[id]** (src/app/api/tasks/[id]/route.ts)
- Now accepts `kind` parameter for updates

### UI Components

**CreateTaskModal** (src/components/tasks/CreateTaskModal.tsx)
- Zenflow-style modal with rounded-xl corners, calm typography
- 4 mode cards with icons and descriptions
- Create button: Creates task and closes modal
- Create & Run button:
  1. Creates task
  2. Fetches workers via GET /api/workers
  3. Finds first IDLE worker
  4. Claims task via POST /api/workers/[id]/claim with { runId }
  5. Shows success message or warning if no workers available

### Mode Mapping

| UI Mode | Task Kind |
|---------|-----------|
| Quick change | QUICK_CHANGE |
| Fix bug | FIX_BUG |
| Spec and build | SPEC_BUILD |
| Full SDD workflow | FULL_SDD |

## Evidence Required (Screenshots)

1. `01-modal-default.png` - Modal default state
2. `02-mode-selected.png` - Mode selection states
3. `03-create-success.png` - Task created, appears on board
4. `04-create-run-success.png` - Task created and claimed by worker
5. `05-no-workers.png` - "No workers registered; task queued" message

## DoD Checklist

- [x] Mode picker with 4 options
- [x] Task title field (required)
- [x] Description textarea (optional)
- [x] Assignee field (optional)
- [x] Auto-start toggle
- [x] Cancel / Create / Create & Run buttons
- [x] API accepts and persists `kind` field
- [x] Create & Run attempts worker claim
- [x] Graceful handling of no workers
- [x] TypeScript + ESLint pass
