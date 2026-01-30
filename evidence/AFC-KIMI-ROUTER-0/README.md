# AFC-KIMI-ROUTER-0: Controlled Kimi Execution

## Purpose

Introduces a controlled execution router that invokes Kimi ONLY for the true delta identified by AFC-ROUTER-INVENTORY-OSS-0, under strict budgets and constraints.

**IMPORTANT: This gate does NOT allow autonomous execution.**

## Execution Eligibility Rules (Authoritative)

Kimi execution is allowed ONLY if:

```
BuildPlan.strategy === "CUSTOM"
  OR
BuildPlan.details.requiresKimi === true
```

Otherwise, the API returns 400: "No execution required (reuse sufficient)"

## Budget Constraints (Conservative Defaults)

| Constraint    | Default | Description                         |
| ------------- | ------- | ----------------------------------- |
| maxCostUSD    | $25     | Maximum cost per execution envelope |
| maxAgents     | 5       | Maximum concurrent agents           |
| maxRuntimeSec | 600     | Maximum runtime (10 minutes)        |

These are per execution envelope, not aggregate.

## Allowed Scopes

Default allowed scopes for Kimi execution:

- `custom_logic` - Custom business logic generation
- `integration_glue` - Integration code between components

## Example Execution Envelope

```json
{
  "id": "clxyz123...",
  "userId": "user-id",
  "buildPlanId": "build-plan-id",
  "provider": "kimi",
  "maxCostUSD": 25,
  "maxAgents": 5,
  "maxRuntimeSec": 600,
  "allowedScopes": ["custom_logic", "integration_glue"],
  "status": "COMPLETED",
  "createdAt": "2026-01-30T..."
}
```

## API Endpoint

### POST /api/execution/kimi/run

**Auth:** Requires NextAuth session

**Request:**

```json
{
  "buildPlanId": "required",
  "sessionId": "optional"
}
```

**Response (201):**

```json
{
  "executionEnvelopeId": "string",
  "executionRunId": "string",
  "status": "COMPLETED | FAILED",
  "maxCostUSD": 25,
  "maxAgents": 5,
  "maxRuntimeSec": 600,
  "result": {
    "tokensUsed": 15000,
    "costUSD": 0.03,
    "summary": "Successfully generated: chat, notifications...",
    "status": "COMPLETED",
    "runtimeSec": 15
  }
}
```

**Errors:**

- 400: Build plan does not require execution
- 403: Not owner
- 404: Build plan not found

## C2 Integration

If `BuildPlan.sessionId` exists:

- On start: `"Kimi execution started (budget $25, agents 5)"`
- On complete: `"Kimi execution completed (cost $X)"`
- On failure: `"Kimi execution aborted (budget exceeded)"`

## Database Models

```prisma
model ExecutionEnvelope {
  id            String   @id @default(cuid())
  userId        String
  buildPlanId   String
  provider      String   // "kimi"
  maxCostUSD    Float
  maxAgents     Int
  maxRuntimeSec Int
  allowedScopes Json
  status        String   // PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
  createdAt     DateTime @default(now())
}

model KimiExecutionRun {
  id         String    @id @default(cuid())
  envelopeId String
  provider   String    // "kimi"
  startedAt  DateTime
  finishedAt DateTime?
  tokensUsed Int?
  costUSD    Float?
  status     String    // RUNNING | COMPLETED | FAILED
  summary    String?
}
```

## Implementation Files

- `prisma/schema.prisma` - ExecutionEnvelope, ExecutionRun models
- `prisma/migrations/20260130220000_afc_kimi_router_0/` - Migration
- `src/lib/execution/kimi-adapter.ts` - Kimi execution stub
- `src/lib/execution/execution-router.ts` - Execution routing logic
- `src/lib/execution/index.ts` - Module exports
- `src/app/api/execution/kimi/run/route.ts` - API endpoint
- `__tests__/lib/execution/kimi-router.test.ts` - Unit tests
- `evidence/AFC-KIMI-ROUTER-0/README.md` - This file

## Tests

Unit tests cover:

- Execution allowed only for CUSTOM build plans
- Execution denied for INVENTORY / OSS plans
- Budget enforcement (cost exceeded → FAIL)
- Runtime enforcement
- Parameter validation
- Deterministic behavior
- Execution summary content

## Security

- Authentication required (NextAuth session)
- User ownership enforced for build plans
- Strict request validation (no extra fields)
- Budget constraints enforced before execution

## Constraints

- No real Kimi API calls (stub only)
- No client-facing endpoints
- No auto-approval
- No agent streaming
- Execution must always be tied to a BuildPlan
- Pricing must not be touched
