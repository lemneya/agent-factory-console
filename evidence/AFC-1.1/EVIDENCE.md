# AFC-1.1: Reliability + Determinism Upgrade - Evidence

## Implementation Date: 2026-01-11

## Features Implemented

### A) Worker Contract v0.2 - RunCheckpoint Model

**File: `prisma/schema.prisma`**

Added `RunCheckpoint` model for deterministic pause/resume:
- `threadId` always equals `runId` (AFC-1.1 binding rule)
- Stores `graphVersion`, `graphHash`, `checkpointId`
- `stateJson` contains entire RunState "values" payload

**API Endpoints:**
- `POST /api/runs/:id/checkpoints` - Create checkpoint
- `GET /api/runs/:id/checkpoints` - List checkpoints
- `GET /api/runs/:id/checkpoints/latest` - Get latest checkpoint

**Files:**
- `src/app/api/runs/[id]/checkpoints/route.ts`
- `src/app/api/runs/[id]/checkpoints/latest/route.ts`
- `src/app/api/runs/route.ts` (updated for threadId binding)

### B) Queue Lease Self-Healing

**File: `prisma/schema.prisma`**

Added lease fields to `Task` model:
- `claimedBy` - Worker ID that claimed the task
- `claimedAt` - Timestamp when claimed
- `leaseExpiresAt` - Lease expiration (60s default)
- `attempts` - Number of claim attempts

**Claim Logic:**
- Task claimable if `status='TODO'` OR (`status='DOING'` AND `leaseExpiresAt < now()`)
- Lease renewal endpoint: `POST /api/workers/:id/lease/renew`

**Files:**
- `src/lib/workers/queue.ts` (claimTask, renewLease)
- `src/app/api/workers/[id]/lease/renew/route.ts`

### C) SSE Reliability

**SSE Keepalive:**
- Keepalive ping every 15 seconds
- Status check every 2 seconds

**Client Fallback Polling:**
- Falls back to REST polling if SSE disconnects
- Polling interval: 5 seconds (configurable)
- Auto-reconnect to SSE after 5 seconds

**Files:**
- `src/app/api/runs/[id]/stream/route.ts` (SSE endpoint)
- `src/hooks/useRunStatus.ts` (client hook)

### D) Nested Logs for Pods/Subagents

**Schema Changes:**
- Added `parentId` to `WorkerLog` model
- Self-referential relation for log hierarchy

**UI Component:**
- `LogTree` component with collapsible tree view
- Shows orchestrator → pod leads → subagents hierarchy

**Files:**
- `prisma/schema.prisma` (WorkerLog.parentId)
- `src/components/logs/LogTree.tsx`

## Build & Test Results

```
Build: ✓ Compiled successfully
Lint: ✓ 0 errors
Tests: ✓ 121 passed, 0 failed
```

## Migration

File: `prisma/migrations/20260111100000_afc_1_1_worker_contract_v02/migration.sql`

Creates:
- `RunCheckpoint` table with indexes
- Adds lease fields to `Task` table
- Adds `parentId` to `WorkerLog` table
