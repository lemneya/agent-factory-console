# AFC-COPILOT-UX-1: Zenflow-style HITL Copilot UX

## Summary

Implemented a Human-in-the-Loop (HITL) Copilot UX that allows tasks to be blocked waiting for human input, with UI components for answering questions and reviewing patches.

## Implementation

### Database Changes

**Prisma Schema** (`prisma/schema.prisma`)
- Added `hitlJson Json?` field to Task model - stores HITL data (questions, patches)
- Added `blockedReason String?` field to Task model - human-readable reason for blocking

**Migration** (`prisma/migrations/20260123000000_afc_copilot_ux_1_hitl_fields/`)
- `ALTER TABLE "Task" ADD COLUMN "hitlJson" JSONB;`
- `ALTER TABLE "Task" ADD COLUMN "blockedReason" TEXT;`

### API Routes

**GET /api/tasks/[id]/hitl** (`src/app/api/tasks/[id]/hitl/route.ts`)
- Returns current HITL state for a task
- Response: `{ taskId, title, status, hitl, blockedReason, isBlocked }`

**PUT /api/tasks/[id]/hitl** (`src/app/api/tasks/[id]/hitl/route.ts`)
- Updates HITL state (used by workers to set questions/patches)
- Accepts: `{ hitl, blockedReason, status }`
- Auto-sets status to BLOCKED if blockedReason provided

**POST /api/tasks/[id]/hitl/answer** (`src/app/api/tasks/[id]/hitl/answer/route.ts`)
- Submit answer to a HITL question
- Accepts: `{ questionId, answer }`
- Returns: `{ taskId, questionId, answer, allAnswered, hitl }`

**POST /api/tasks/[id]/hitl/patch/apply** (`src/app/api/tasks/[id]/hitl/patch/apply/route.ts`)
- Approve or reject a patch
- Accepts: `{ patchId, action: 'approve' | 'reject', reviewedBy? }`
- Returns: `{ taskId, patchId, action, status, allReviewed, hitl }`

**POST /api/tasks/[id]/hitl/unblock** (`src/app/api/tasks/[id]/hitl/unblock/route.ts`)
- Unblock a BLOCKED task after human input complete
- Accepts: `{ clearHitl?: boolean, newStatus?: string }`
- Returns: `{ taskId, title, status, hitl, blockedReason, isBlocked, message }`

### UI Components

**CopilotHITLPanel** (`src/components/hitl/CopilotHITLPanel.tsx`)
- Main panel showing all blocked tasks for a run
- Expandable task list with questions and patches
- "Ready to unblock" indicator when all inputs complete
- Refresh button to poll for new blocked tasks

**QuestionCard** (`src/components/hitl/QuestionCard.tsx`)
- Displays a single HITL question
- Supports three question types:
  - `text`: Free-form textarea input
  - `choice`: Multiple choice buttons
  - `confirm`: Yes/No buttons
- Visual feedback: amber for pending, green for answered

**PatchViewer** (`src/components/hitl/PatchViewer.tsx`)
- Displays a diff with syntax highlighting
- Approve/Reject buttons for pending patches
- Collapsible diff view
- Status badges for reviewed patches

### Integration

**Run Detail Page** (`src/app/runs/[id]/page.tsx`)
- Added CopilotHITLPanel between Ralph Mode and Memory panels
- Auto-refreshes on task unblock

## HITL Data Schema

```typescript
interface HITLData {
  questions?: HITLQuestion[];
  patches?: HITLPatch[];
}

interface HITLQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'confirm';
  options?: string[];  // for 'choice' type
  answer?: string;
  answeredAt?: string;
}

interface HITLPatch {
  id: string;
  filename: string;
  diff: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt?: string;
  reviewedBy?: string;
}
```

## Task Status Flow

```
TODO -> DOING -> BLOCKED (HITL) -> DOING -> DONE
                    ^                |
                    |                |
                    +-- human input -+
```

## Evidence Required (Screenshots)

1. `01-hitl-panel-questions.png` - Panel with question cards
2. `02-hitl-panel-patches.png` - Panel with patch viewer
3. `03-question-answered.png` - Question card after answer submitted
4. `04-patch-approved.png` - Patch viewer after approval
5. `05-ready-to-unblock.png` - "Ready to unblock" state
6. `06-task-unblocked.png` - Task returned to DOING state

## DoD Checklist

- [x] hitlJson and blockedReason fields added to Task model
- [x] Migration created and applied
- [x] GET /api/tasks/[id]/hitl route
- [x] PUT /api/tasks/[id]/hitl route
- [x] POST /api/tasks/[id]/hitl/answer route
- [x] POST /api/tasks/[id]/hitl/patch/apply route
- [x] POST /api/tasks/[id]/hitl/unblock route
- [x] CopilotHITLPanel component
- [x] QuestionCard component with text/choice/confirm support
- [x] PatchViewer component with diff syntax highlighting
- [x] Panel integrated into Run detail page
- [x] TypeScript + ESLint pass
