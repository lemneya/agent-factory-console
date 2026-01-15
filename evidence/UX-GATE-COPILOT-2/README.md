# UX-GATE-COPILOT-2: End-to-End Factory Loop

## Overview

This gate implements the complete Factory Loop flow:
**Spec → Slice → Draft → Diff → Approve → Run**

## Features Implemented

### 1. Factory Quickstart Panel
- Added to Copilot page when in Blueprint draft mode
- Pre-built templates for common project types:
  - SaaS MVP (auth, dashboard, billing)
  - CRUD API (Prisma, validation, error handling)
  - Landing Page (marketing site with CMS)
  - Admin Panel (RBAC, data tables, audit logging)

### 2. Draft Options
- **Create WorkOrders on approval** (checked by default)
  - Automatically generates WorkOrders from Blueprint modules
  - Uses deterministic domain ordering
- **Start Run after approval** (unchecked by default)
  - Optionally triggers a new Run immediately after approval

### 3. Deterministic Planner
- Enhanced `src/services/draft/planner.ts` with:
  - Spec hash generation for reproducibility
  - Stable domain ordering for WorkOrder creation
  - Dependency graph generation between WorkOrders
  - Blueprint → BlueprintVersion → WorkOrders pipeline

### 4. Database Schema
- Added `Blueprint` model with:
  - `name`, `description`, `status`
  - Relation to `BlueprintVersion` for immutable snapshots
- Added `BlueprintVersion` model with:
  - `payloadJson` for immutable spec storage
  - `specHash` for determinism verification
- Added `WorkOrder` model with:
  - `key`, `domain`, `title`, `status`
  - `dependsOnJson` for dependency tracking
  - Relation to `BlueprintVersion`

## Files Changed

### New Files
- `tests/ux-gate-copilot-2-happy-path.spec.ts` - E2E test suite
- `prisma/migrations/20260115000000_add_blueprint_workorder/migration.sql` - Schema migration

### Modified Files
- `prisma/schema.prisma` - Added Blueprint, BlueprintVersion, WorkOrder models
- `src/app/copilot/page.tsx` - Added Factory Quickstart panel and draft options
- `src/services/draft/planner.ts` - Enhanced with deterministic Blueprint pipeline

## Test Coverage

The E2E test suite (`ux-gate-copilot-2-happy-path.spec.ts`) covers:
- Copilot page loads with correct elements
- Draft mode shows Blueprint options and Factory Quickstart
- Factory Quickstart panel hidden when not in Blueprint mode
- Draft options checkboxes are toggleable
- Mode toggle switches between Ask and Draft correctly
- Quickstart template button triggers message send
- Context panel shows correct info based on mode
- Draft type specific behavior (BLUEPRINT, WORKORDERS, COUNCIL)
- Input and send behavior

## Verification

### Typecheck
```
npm run typecheck
# ✅ No errors
```

### Build
```
npm run build
# ✅ Build successful
```

## Usage

1. Navigate to `/copilot`
2. Click "Draft" mode toggle
3. Select "Blueprint Draft" from draft type dropdown
4. Use Factory Quickstart templates or describe your own Blueprint
5. Review generated draft in the output panel
6. Toggle options:
   - ☑️ Create WorkOrders on approval
   - ☐ Start Run after approval
7. Save → Approve → Watch the Factory Loop execute

## Architecture

```
User Input (Spec)
       ↓
Copilot Chat API
       ↓
Draft Generation (LLM)
       ↓
Draft Review (UI)
       ↓
Save Draft (DB)
       ↓
Approve Draft
       ↓
executeDraftPlan()
       ↓
┌─────────────────────────────────────┐
│ BLUEPRINT type:                     │
│ 1. Create Blueprint record          │
│ 2. Create BlueprintVersion (hash)   │
│ 3. If options.createWorkOrders:     │
│    - Generate WorkOrders from spec  │
│    - Apply domain ordering          │
│    - Set dependencies               │
│ 4. If options.startRun:             │
│    - Create new Run                 │
│    - Link to WorkOrders             │
└─────────────────────────────────────┘
```

## Determinism Guarantees

1. **Spec Hash**: SHA-256 hash of sorted, stringified spec ensures same input = same output
2. **Domain Ordering**: WorkOrders are created in a stable, predictable order based on domain priority
3. **Immutable Versions**: BlueprintVersion stores the exact payload used, enabling replay
4. **Dependency Graph**: WorkOrder dependencies are computed deterministically from module relationships
