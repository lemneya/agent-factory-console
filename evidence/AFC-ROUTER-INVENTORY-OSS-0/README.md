# AFC-ROUTER-INVENTORY-OSS-0: Internal Build Routing

## Purpose

Determines HOW an application should be built:

1. **Inventory App Shells first** (internal assets)
2. **Open Source adoption second** (vetted OSS projects)
3. **Kimi execution last** (for true delta / custom build)

**IMPORTANT: This routing does NOT affect client pricing.**

Client quotes are based on build-from-scratch methodology (AFC-QUOTE-0).
Internal shortcuts are margin, not reflected in pricing.

## Routing Rules (Authoritative)

```
IF inventoryCoverage >= 0.7:
  strategy = "INVENTORY"

ELSE IF inventoryCoverage >= 0.4 AND ossCoverage >= 0.6:
  strategy = "INVENTORY_PLUS_OSS"

ELSE IF ossCoverage >= 0.7:
  strategy = "OSS"

ELSE:
  strategy = "CUSTOM"  // escalate to Kimi
```

## Coverage Thresholds

| Threshold                       | Value        | Description                         |
| ------------------------------- | ------------ | ----------------------------------- |
| Inventory Only                  | ≥ 70%        | Internal assets cover most features |
| Inventory + OSS (Inventory Min) | ≥ 40%        | Partial inventory coverage          |
| Inventory + OSS (OSS Min)       | ≥ 60%        | OSS supplements inventory           |
| OSS Only                        | ≥ 70%        | OSS covers most features            |
| Custom                          | < thresholds | Requires Kimi/custom build          |

## License Rules

### Rejected (Copyleft)

- GPL, GPL-2.0, GPL-3.0
- AGPL, AGPL-3.0

### Preferred (Permissive)

- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC

## Sample Build Plan

### Request

```json
{
  "scope": {
    "appType": "web",
    "features": ["auth", "dashboard", "billing"],
    "integrations": ["stripe"],
    "complexity": "medium",
    "timeline": "normal"
  }
}
```

### Response

```json
{
  "buildPlanId": "clxyz123...",
  "strategy": "INVENTORY_PLUS_OSS",
  "coverage": 0.78,
  "summary": "Strategy: INVENTORY_PLUS_OSS\nOverall Coverage: 78%\nInventory Assets: NextAuth RBAC\nOSS Candidate: Next.js SaaS Starter (MIT)",
  "details": {
    "inventoryCoverage": 0.45,
    "ossCoverage": 0.75,
    "combinedCoverage": 0.78,
    "uncoveredFeatures": [],
    "requiresKimi": false,
    "estimatedReusePercentage": 78
  }
}
```

## API Endpoint

### POST /api/router/build-plan

**Auth:** Requires NextAuth session

**Request:**

```json
{
  "estimateId": "optional - load scope from Estimate",
  "sessionId": "optional - link to C2 session",
  "scope": {
    "appType": "web | mobile | backend",
    "features": ["auth", "dashboard", ...],
    "integrations": ["stripe", ...],
    "complexity": "low | medium | high",
    "timeline": "normal | rush"
  }
}
```

Note: Either `estimateId` or `scope` is required.

**Response:**

```json
{
  "buildPlanId": "string",
  "strategy": "INVENTORY | INVENTORY_PLUS_OSS | OSS | CUSTOM",
  "coverage": 0.0-1.0,
  "summary": "string",
  "details": { ... }
}
```

## Database Model

```prisma
model BuildPlan {
  id         String   @id @default(cuid())
  userId     String
  sessionId  String?
  estimateId String?
  strategy   String   // INVENTORY | INVENTORY_PLUS_OSS | OSS | CUSTOM
  coverage   Float    // 0.0–1.0
  summary    String
  details    Json     // breakdown of decisions
  createdAt  DateTime @default(now())
}
```

## Implementation Files

- `prisma/schema.prisma` - BuildPlan model
- `prisma/migrations/20260130210000_afc_router_inventory_oss_0/` - Migration
- `src/lib/router/inventory-matcher.ts` - Inventory matching engine
- `src/lib/router/oss-sniffer.ts` - OSS candidate sniffing
- `src/lib/router/build-router.ts` - Routing decision logic
- `src/lib/router/index.ts` - Module exports
- `src/app/api/router/build-plan/route.ts` - API endpoint
- `__tests__/lib/router/build-router.test.ts` - Unit tests

## Tests

Unit tests cover:

- Inventory-only route (coverage ≥ 70%)
- Inventory + OSS route (40%+ inventory, 60%+ OSS)
- OSS-only route (coverage ≥ 70%)
- Custom route (low reuse potential)
- GPL license rejection
- Determinism (same input → same plan)
- Stack compatibility filtering
- Coverage calculation logic

## Security

- Authentication required (NextAuth session)
- User ownership enforced for session linking
- Estimate ownership verified before use
- Build plans tied to userId

## Constraints

- Does NOT modify quote engine
- Does NOT expose inventory/OSS info to client APIs
- Does NOT call Kimi
- Does NOT auto-execute anything
- Output is informational only (BuildPlan artifact)
