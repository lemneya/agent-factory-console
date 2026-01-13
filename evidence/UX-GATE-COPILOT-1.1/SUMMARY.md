# UX-GATE-COPILOT-1.1: Draft Diff View

## Summary

This gate implements the Draft Diff View feature, which shows users exactly what operations will be performed when a draft is approved. This ensures transparency and prevents any divergence between "what UI shows" and "what approve does."

## Features Implemented

### 1. planDraftActions Function

A deterministic function that generates a `DraftPlan` describing exactly what operations will be performed when a draft is approved.

**Location:** `src/services/draft/planner.ts`

**Capabilities:**

- Generates operations for BLUEPRINT, WORKORDERS, and COUNCIL drafts
- Includes warnings for potential issues (name collisions, missing refs, etc.)
- Performs pre-flight checks (Council Gate, etc.)
- Returns estimated counts of records to be created

### 2. Diff API Route

**Endpoint:** `GET /api/copilot/drafts/[id]/diff`

Returns the DraftPlan for a given draft without performing any mutations (dry run).

**Features:**

- Demo mode support (`?demo=1`)
- Auth check (unless demo mode)
- Returns mock plan for demo mode

### 3. Refactored Approve Route

**Endpoint:** `POST /api/copilot/drafts/[id]/approve`

Now uses `planDraftActions` to generate the plan before execution, ensuring no divergence.

**New Requirements:**

- Requires `diffReviewed: true` in request body
- Returns the plan in the response for audit purposes
- Logs the plan in the CopilotDraftEvent

### 4. Updated Draft Detail Page

**Location:** `src/app/drafts/[id]/page.tsx`

**New UI Elements:**

- **Diff Panel:** Shows all planned operations with CREATE/UPDATE/CALL_API badges
- **Fields Preview:** Shows what fields will be set for each operation
- **Warnings:** Displays any warnings (e.g., name collisions)
- **Pre-flight Checks:** Shows Council Gate status and record counts
- **Reviewed Checkbox:** Must be checked before approve button is enabled

## API Changes

### Diff API Response

```typescript
interface DraftPlan {
  draftId: string;
  kind: 'BLUEPRINT' | 'WORKORDERS' | 'COUNCIL';
  operations: DraftOperation[];
  checks: {
    councilRequired: boolean;
    councilSatisfied: boolean;
    willCreateCount: Record<string, number>;
  };
}

interface DraftOperation {
  op: 'CREATE' | 'UPDATE' | 'CALL_API';
  model: string;
  ref: string;
  summary: string;
  fieldsPreview: Record<string, unknown>;
  warnings: string[];
}
```

### Approve API Changes

**Request Body:**

```json
{
  "diffReviewed": true
}
```

**Response:**

```json
{
  "resultRef": "...",
  "status": "APPROVED",
  "plan": { ... }
}
```

## Hard Constraints

1. **No divergence:** The same `planDraftActions` function is used by both diff and approve routes
2. **Diff review required:** Approve route requires `diffReviewed: true` in request body
3. **Audit logging:** The plan is logged in CopilotDraftEvent for audit purposes
4. **Read-only diff:** The diff endpoint performs no mutations

## Tests

### Unit Tests

- `__tests__/services/draft/planner.test.ts`
  - BLUEPRINT draft planning
  - COUNCIL draft planning
  - WORKORDERS draft planning
  - Plan determinism

### E2E Tests

- `tests/copilot-diff.spec.ts`
  - Diff panel visibility
  - Operation badges (CREATE/UPDATE/CALL_API)
  - Reviewed checkbox behavior
  - Approve button enable/disable
  - Pre-flight checks display
  - Navigation

## Files Changed

| File                                               | Change     |
| -------------------------------------------------- | ---------- |
| `src/services/draft/planner.ts`                    | New        |
| `src/app/api/copilot/drafts/[id]/diff/route.ts`    | New        |
| `src/app/api/copilot/drafts/[id]/approve/route.ts` | Refactored |
| `src/app/drafts/[id]/page.tsx`                     | Updated    |
| `__tests__/services/draft/planner.test.ts`         | New        |
| `tests/copilot-diff.spec.ts`                       | New        |
| `evidence/UX-GATE-COPILOT-1.1/SUMMARY.md`          | New        |

## Dependencies

- Requires UX-GATE-COPILOT-1 (Draft Mode) to be merged first
