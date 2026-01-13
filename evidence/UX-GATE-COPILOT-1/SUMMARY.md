# UX-GATE-COPILOT-1: Copilot Draft Mode

## Summary

This gate implements Draft Mode for the Copilot feature, allowing users to generate structured drafts for Blueprints, WorkOrders, and Council Decisions with human approval required before execution.

## Features Implemented

### 1. Prisma Models

- **CopilotDraft**: Stores draft payloads with status tracking (DRAFT, APPROVED, REJECTED, EXPIRED)
- **CopilotDraftEvent**: Audit trail for all draft events (CREATED, UPDATED, APPROVED, REJECTED, EXPIRED)

### 2. API Routes

| Route                              | Method | Description                  |
| ---------------------------------- | ------ | ---------------------------- |
| `/api/copilot/draft`               | POST   | Create a new draft           |
| `/api/copilot/drafts`              | GET    | List drafts with filters     |
| `/api/copilot/drafts/[id]`         | GET    | Get draft detail with events |
| `/api/copilot/drafts/[id]/approve` | POST   | Approve a draft              |
| `/api/copilot/drafts/[id]/reject`  | POST   | Reject a draft               |

### 3. Copilot Page Updates

- **Ask/Draft mode toggle**: Switch between read-only Ask mode and Draft mode
- **Draft type selector**: Choose between Blueprint, WorkOrders, or Council drafts
- **Dynamic placeholders**: Context-aware input placeholders for each draft type
- **Draft output panel**: Shows generated draft payload with Save Draft button

### 4. Drafts Management Pages

- **/drafts**: List all drafts with filtering by kind and status
- **/drafts/[id]**: Detail page with payload view, sources, and approve/reject buttons

### 5. LLM Provider Updates

- **Draft mode prompting**: Specialized system prompts for each draft type
- **JSON output parsing**: Extracts structured payloads from LLM responses
- **Fallback handling**: Graceful degradation when LLM is not configured

### 6. Navigation

- Added "Drafts" nav item to sidebar

## Hard Constraints

1. **No autopilot**: All drafts require human approval
2. **Read-only DB access**: Draft mode only generates payloads, does not execute them
3. **Audit logging**: All draft events are logged to CopilotDraftEvent table

## Files Changed

### New Files

- `prisma/migrations/20260113100000_ux_copilot_1_draft_mode/migration.sql`
- `src/app/api/copilot/draft/route.ts`
- `src/app/api/copilot/drafts/route.ts`
- `src/app/api/copilot/drafts/[id]/route.ts`
- `src/app/api/copilot/drafts/[id]/approve/route.ts`
- `src/app/api/copilot/drafts/[id]/reject/route.ts`
- `src/app/drafts/page.tsx`
- `src/app/drafts/[id]/page.tsx`
- `tests/copilot-draft.spec.ts`
- `__tests__/api/copilot/draft.test.ts`

### Modified Files

- `prisma/schema.prisma` - Added CopilotDraft and CopilotDraftEvent models
- `src/app/copilot/page.tsx` - Added Ask/Draft mode toggle and draft output panel
- `src/services/llm/provider.ts` - Added draft mode prompting
- `src/app/api/copilot/chat/route.ts` - Added draft mode support
- `src/config/nav.tsx` - Added Drafts nav item

## Test Coverage

### Unit Tests

- Draft schema validation (Blueprint, WorkOrders, Council)
- Approve guards (status checks, Council gate)

### E2E Tests

- Ask/Draft mode toggle
- Draft type selector
- Dynamic placeholders
- Drafts list page
- Navigation to Copilot and Drafts

## Demo Mode

- Demo mode works without database connection
- Shows placeholder data for drafts list
- Draft creation requires LLM to be configured

## Date

January 13, 2026
