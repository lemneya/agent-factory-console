# AFC-1.7: Blueprints + Deterministic Slicer (WorkOrders MVP)

## Gate Summary

**Status**: IMPLEMENTED  
**Date**: 2026-01-12  
**Branch**: `feature/afc-1.7-blueprint-slicer`

## Features Implemented

### 1. Prisma Models (Agent A - Backend/DB)

- **Blueprint**: Project-scoped container for versioned specs
  - Fields: id, projectId, name, description, status (DRAFT/PUBLISHED/ARCHIVED)
  - Relations: Project, BlueprintVersion[]

- **BlueprintVersion**: Immutable versioned spec JSON
  - Fields: id, blueprintId, version, schemaVersion, specJson, specHash, publishedAt
  - Unique constraint: (blueprintId, version)
  - Immutability enforced: publishedAt locks the version

- **WorkOrder**: Sliced work unit from a BlueprintVersion
  - Fields: id, projectId, runId, blueprintVersionId, key, title, summary, domain, status
  - JSON fields: specIds, ownedPaths, interfaces, acceptanceChecks, assetsToUse, memoryHints
  - Unique constraint: (blueprintVersionId, key)

- **WorkOrderDependency**: M:N dependency graph between WorkOrders
  - Fields: id, workOrderId, dependsOnId
  - Unique constraint: (workOrderId, dependsOnId)

- **WorkOrderTaskLink**: Links WorkOrders to Tasks
  - Fields: id, workOrderId, taskId

- **WorkOrderAuditEvent**: Status transition audit trail
  - Fields: id, workOrderId, actor, fromStatus, toStatus, reason, metadata

### 2. Slicer Algorithm (Agent B - API/Slicer)

- **Deterministic**: Same input always produces same keys, specHash, and order
- **Key Format**: `{blueprint_id}-{domain_short}-{seq}` (e.g., `NEMT-BE-001`)
- **Domain Short Codes**: UI, BE, DO, QA, AL, IN

- **Default Dependency Rules**:
  - BACKEND: No default dependencies
  - FRONTEND: Depends on BACKEND (if both exist in module)
  - QA: Depends on FRONTEND + BACKEND
  - INTEGRATION: Depends on all other domains in module

- **Cross-Module Dependencies**: Based on `depends_on_modules` in spec

- **Owned Paths**: Uses `owned_paths_hint` or falls back to defaults

### 3. API Routes

| Endpoint                                       | Method | Description                 |
| ---------------------------------------------- | ------ | --------------------------- |
| `/api/blueprints`                              | GET    | List blueprints             |
| `/api/blueprints`                              | POST   | Create blueprint            |
| `/api/blueprints/[id]`                         | GET    | Get blueprint details       |
| `/api/blueprints/[id]`                         | PATCH  | Update blueprint            |
| `/api/blueprints/[id]/versions`                | GET    | List versions               |
| `/api/blueprints/[id]/versions`                | POST   | Create version              |
| `/api/blueprints/versions/[versionId]/publish` | POST   | Publish version (immutable) |
| `/api/blueprints/versions/[versionId]/slice`   | POST   | Slice to WorkOrders         |
| `/api/blueprints/validate`                     | POST   | Validate spec JSON          |
| `/api/workorders`                              | GET    | List WorkOrders             |
| `/api/workorders/[id]`                         | GET    | Get WorkOrder details       |
| `/api/workorders/[id]`                         | PATCH  | Update status (audited)     |
| `/api/workorders/[id]/tree`                    | GET    | Get dependency tree         |

### 4. UI Pages (Agent C - Frontend)

- **Blueprints List** (`/blueprints`): Grid view with status badges
- **New Blueprint** (`/blueprints/new`): Form with spec JSON editor
- **Blueprint Detail** (`/blueprints/[id]`): Version list, publish, slice actions
- **WorkOrders List** (`/workorders`): Grouped by domain, status badges
- **WorkOrder Detail** (`/workorders/[id]`): Full details, status transitions, audit log

### 5. Tests (Agent D - QA/Docs)

- **Unit Tests** (`__tests__/lib/blueprint/`):
  - `schema.test.ts`: 30+ tests for validation, hashing, canonicalization
  - `slicer.test.ts`: 25+ tests for determinism, dependencies, key generation

- **E2E Tests** (`tests/blueprint.spec.ts`):
  - Navigation tests
  - API endpoint tests
  - Slicer determinism tests
  - Schema validation tests

## Schema v1.0 Structure

```json
{
  "blueprint_id": "string",
  "title": "string",
  "description": "string (optional)",
  "modules": [
    {
      "module_id": "string",
      "title": "string",
      "domains": ["BACKEND", "FRONTEND", "QA", ...],
      "spec_items": [
        {
          "spec_id": "string (unique across all modules)",
          "must": "string",
          "acceptance": ["string", ...],
          "domain": "string (optional)"
        }
      ],
      "interfaces": [{ "name": "string", "path": "string" }],
      "owned_paths_hint": { "BACKEND": ["path/**"], ... },
      "assets_hint": ["asset-name", ...],
      "depends_on_modules": ["module_id", ...]
    }
  ]
}
```

## Size Caps

- Max modules: 50
- Max spec_items: 500
- Max JSON size: 1MB

## WorkOrder Status Transitions

```
PLANNED → READY → IN_PROGRESS → WAITING_FOR_APPROVAL → DONE
    ↓        ↓          ↓                ↓
  BLOCKED  BLOCKED    BLOCKED          ABORTED
    ↓        ↓          ↓
  ABORTED  ABORTED    ABORTED
```

## Files Changed

### New Files

- `prisma/migrations/20260112300000_afc_1_7_blueprint_slicer/migration.sql`
- `src/lib/blueprint/schema.ts`
- `src/lib/blueprint/slicer.ts`
- `src/lib/blueprint/index.ts`
- `src/app/api/blueprints/route.ts`
- `src/app/api/blueprints/[id]/route.ts`
- `src/app/api/blueprints/[id]/versions/route.ts`
- `src/app/api/blueprints/versions/[versionId]/publish/route.ts`
- `src/app/api/blueprints/versions/[versionId]/slice/route.ts`
- `src/app/api/blueprints/validate/route.ts`
- `src/app/api/workorders/route.ts`
- `src/app/api/workorders/[id]/route.ts`
- `src/app/api/workorders/[id]/tree/route.ts`
- `src/app/blueprints/page.tsx`
- `src/app/blueprints/new/page.tsx`
- `src/app/blueprints/[id]/page.tsx`
- `src/app/workorders/page.tsx`
- `src/app/workorders/[id]/page.tsx`
- `__tests__/lib/blueprint/schema.test.ts`
- `__tests__/lib/blueprint/slicer.test.ts`
- `tests/blueprint.spec.ts`
- `evidence/AFC-1.7/SUMMARY.md`

### Modified Files

- `prisma/schema.prisma` (added Blueprint, WorkOrder models)
- `src/app/page.tsx` (added Blueprints and WorkOrders links)

## Constraints Verified

- [x] Council Gate not weakened
- [x] Ralph Mode safety not weakened
- [x] Terminal Matrix safety not weakened
- [x] Memory audit not weakened
- [x] Slicer is deterministic: stable keys/order/specHash
- [x] BlueprintVersion JSON schema validation
- [x] Unique spec_id across modules
- [x] Published BlueprintVersions immutable
- [x] WorkOrder status transitions audited
- [x] Unit tests added
- [x] E2E tests added

## Next Steps

- AFC-1.8: TBD (not started per instructions)
