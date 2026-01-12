## AFC-1.7: Blueprints + Deterministic Slicer (WorkOrders MVP)

### Summary

This PR implements AFC-1.7, adding the Blueprints and WorkOrders MVP with a deterministic Slicer algorithm. The implementation follows the Gatekeeper specification and maintains all existing safety constraints.

### Features Implemented

**Prisma Models (Agent A - Backend/DB)**

- `Blueprint`: Project-scoped container for versioned specs
- `BlueprintVersion`: Immutable versioned spec JSON with schema validation
- `WorkOrder`: Sliced work unit with domain, status, dependencies
- `WorkOrderDependency`: M:N dependency graph between WorkOrders
- `WorkOrderTaskLink`: Links WorkOrders to Tasks
- `WorkOrderAuditEvent`: Status transition audit trail

**Slicer Algorithm (Agent B - API/Slicer)**

- Deterministic: Same input always produces same keys, specHash, and order
- Key format: `{blueprint_id}-{domain_short}-{seq}` (e.g., `NEMT-BE-001`)
- Default dependency rules: FRONTEND→BACKEND, QA→FRONTEND+BACKEND
- Cross-module dependencies via `depends_on_modules`

**API Routes**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blueprints` | GET/POST | List/Create blueprints |
| `/api/blueprints/[id]` | GET/PATCH | Get/Update blueprint |
| `/api/blueprints/[id]/versions` | GET/POST | List/Create versions |
| `/api/blueprints/versions/[versionId]/publish` | POST | Publish version (immutable) |
| `/api/blueprints/versions/[versionId]/slice` | POST | Slice to WorkOrders |
| `/api/blueprints/validate` | POST | Validate spec JSON |
| `/api/workorders` | GET | List WorkOrders |
| `/api/workorders/[id]` | GET/PATCH | Get/Update WorkOrder |
| `/api/workorders/[id]/tree` | GET | Get dependency tree |

**UI Pages (Agent C - Frontend)**

- `/blueprints`: List view with status badges
- `/blueprints/new`: Form with spec JSON editor
- `/blueprints/[id]`: Version list, publish, slice actions
- `/workorders`: Grouped by domain, status badges
- `/workorders/[id]`: Full details, status transitions, audit log

**Tests (Agent D - QA/Docs)**

- Unit tests: 55+ tests for schema validation and slicer
- E2E tests: Navigation, API endpoints, determinism verification

### Schema v1.0 Structure

```json
{
  "blueprint_id": "string",
  "title": "string",
  "modules": [{
    "module_id": "string",
    "domains": ["BACKEND", "FRONTEND", "QA", ...],
    "spec_items": [{
      "spec_id": "string (unique)",
      "must": "string",
      "acceptance": ["string"]
    }],
    "interfaces": [{ "name": "string", "path": "string" }],
    "owned_paths_hint": { "BACKEND": ["path/**"] },
    "depends_on_modules": ["module_id"]
  }]
}
```

### Constraints Verified

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

### Evidence

See `evidence/AFC-1.7/SUMMARY.md` for full implementation details.

### Test Results

- Unit tests: 256 passed
- Build: Success
- Lint: 0 errors (1 warning)
