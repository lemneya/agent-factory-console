## Summary

Implements UX-GATE-2: Project + Run creation (first happy-path flow).

From a fresh install (empty DB), a user can now:

1. Create a Project
2. Create a Run from that Project (non-BUILD)
3. See the run appear in /runs and open the run detail page

## Changes

### New Pages

| Page             | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `/projects/new`  | Create Project form with name, repo, description fields |
| `/projects/[id]` | Project detail with stats and "Start Run" CTA           |
| `/runs/new`      | Create Run form with project dropdown and kind selector |

### Updated Pages

| Page        | Change                                                   |
| ----------- | -------------------------------------------------------- |
| `/projects` | Added "New Project" header action + improved empty state |
| `/runs`     | Changed "New Run" button to link to `/runs/new`          |

### Key Features

**Project Creation**

- Form fields: name (required), repoFullName (optional), description (optional)
- Redirects to project detail on success

**Run Creation**

- Project dropdown (preselectable via `?projectId=`)
- Run kind selector: ADOPT, ADAPT, BUILD
- BUILD protection: blocked without council decision, shows inline message

**Demo Mode**

- All forms show "Read-only demo mode" warning
- Form fields disabled
- Submit buttons disabled

## Testing

### E2E Tests (`tests/ux-gate-2-happy-path.spec.ts`)

- Projects page shows `projects-new` button
- Runs page shows `runs-new` button
- `/projects/new` renders form with all fields
- `/runs/new` renders form with kind selector
- Demo mode disables forms
- Navigation flow works

## Evidence

- `evidence/UX-GATE-2/happy-path-notes.md` - Implementation details

## Acceptance Criteria

- [x] New Project flow works end-to-end
- [x] New Run flow works for ADOPT/ADAPT
- [x] BUILD blocked without council decision
- [x] Demo mode shows read-only UX
- [x] E2E tests added
- [x] Evidence committed
