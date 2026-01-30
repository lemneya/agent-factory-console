# AFC-QUOTE-0: Baseline Estimation Engine

## Purpose

Provides professional, market-standard quotes as if an application were built from scratch by a traditional dev team. Internal shortcuts (inventory reuse, automation, Kimi) are margin, not part of the quote.

## Implementation

### Library (`src/lib/quote-engine.ts`)

Deterministic estimation engine with:
- **Types**: `AppType`, `Complexity`, `Timeline`, `EstimateScope`, `EstimateResult`
- **Constants**: Base hours by app type, feature hours, complexity/rush multipliers
- **Functions**:
  - `calculateEffortHours()` - Pure calculation logic
  - `generateEstimate()` - Full estimate with assumptions and risks
  - `validateScope()` - Strict input validation
  - `formatEstimateEvidence()` - Audit trail formatting

### API Endpoint (`POST /api/quotes/estimate`)

- **Auth**: Requires authentication via `requireAuth()`
- **Validation**: Strict schema, no extra fields allowed
- **Persistence**: Saves estimate to `Estimate` table
- **C2 Integration**: Logs event if `sessionId` provided
- **Response**: Estimate + evidence trail

### Database (`prisma/schema.prisma`)

```prisma
model RateCard {
  id        String   @id @default(cuid())
  name      String
  currency  String   @default("USD")
  baseRate  Float
  roles     Json
  createdAt DateTime @default(now())
}

model Estimate {
  id          String   @id @default(cuid())
  userId      String
  sessionId   String?
  scopeJson   Json
  effortHours Int
  minCost     Float
  maxCost     Float
  currency    String
  assumptions Json
  risks       Json
  createdAt   DateTime @default(now())
}
```

## Estimation Formula

```
Base Hours (by app type):
  - web: 300h
  - mobile: 400h
  - backend: 250h

Feature Hours (additive):
  - auth: 40h, dashboard: 60h, billing: 50h
  - notifications: 30h, search: 35h, analytics: 45h
  - admin: 55h, api: 40h, chat: 50h
  - upload: 25h, export: 20h, settings: 15h
  - unknown: 30h (default)

Integration Hours: 25h per integration

Multipliers:
  - Complexity: low=1.0, medium=1.25, high=1.5
  - Timeline: normal=1.0, rush=1.2

Final Hours = (Base + Features + Integrations) * Complexity * Rush
Cost Range = Hours * Rate * (0.9 to 1.1)
```

## Request Format

```json
{
  "scope": {
    "appType": "web",
    "features": ["auth", "dashboard", "billing"],
    "integrations": ["stripe", "sendgrid"],
    "complexity": "medium",
    "timeline": "normal"
  },
  "sessionId": "optional-c2-session-id"
}
```

## Response Format

```json
{
  "id": "estimate-id",
  "estimate": {
    "effortHours": 580,
    "minCost": 46980,
    "maxCost": 57420,
    "currency": "USD",
    "assumptions": [...],
    "risks": [...],
    "breakdown": {
      "baseHours": 300,
      "featureHours": 150,
      "integrationHours": 50,
      "complexityMultiplier": 1.25,
      "rushMultiplier": 1.0,
      "totalBeforeMultipliers": 500,
      "rate": 90
    }
  },
  "evidence": {
    "basis": "build-from-scratch",
    "methodology": "standard-effort-estimation",
    ...
  },
  "createdAt": "2026-01-30T..."
}
```

## Tests

Unit tests in `__tests__/lib/quote-engine.test.ts` covering:
- Base hour calculations by app type
- Feature hour additions
- Integration hour calculations
- Complexity and rush multipliers
- Input validation (strict schema)
- Determinism verification

## Security

- Authentication required
- User ownership enforced for session linking
- Strict input validation (no extra fields)
- All estimates tied to userId

## Files Changed

- `prisma/schema.prisma` - Added RateCard, Estimate models
- `prisma/migrations/20260130200000_afc_quote_0/migration.sql` - Migration + seed
- `src/lib/quote-engine.ts` - Estimation engine
- `src/app/api/quotes/estimate/route.ts` - API endpoint
- `__tests__/lib/quote-engine.test.ts` - Unit tests
- `evidence/AFC-QUOTE-0/README.md` - This file
