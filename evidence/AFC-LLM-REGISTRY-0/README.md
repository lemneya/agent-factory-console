# AFC-LLM-REGISTRY-0: LLM Model Selection Registry

## Purpose

Selection-only LLM registry with deterministic model selection based on:

- Task type requirements
- Risk tier constraints
- Data residency rules
- Data classification policies
- Budget profiles

**No provider calls. No secrets. No defaults. Strict schemas.**

## API Endpoints

### POST /api/llm/select

Select an LLM model based on task requirements.

**Auth:** Requires NextAuth session

**Request:**

```json
{
  "tenantId": "user-id",
  "taskType": "CODE_GENERATION",
  "riskTier": "L2",
  "dataResidency": "US",
  "dataClassification": "CONFIDENTIAL",
  "budgetProfile": "STANDARD",
  "moltbotSuggestion": { "key": "preferred-model" }
}
```

**Response (200):**

```json
{
  "selected": {
    "key": "azure-oss-qwen-us",
    "provider": "azure_oss",
    "model": "qwen2.5-coder"
  },
  "fallback": [...],
  "rationale": {
    "policyVersion": "AFC-LLM-REGISTRY-0@1",
    "registryVersion": "reg_v1",
    "exclusions": [...],
    "scores": [...],
    "tieBreak": "score>cost>reliability>lex"
  },
  "decisionHash": "sha256:..."
}
```

**Errors:**

- 400: Validation error (strict schema)
- 403: Tenant access denied
- 422: No eligible models

### GET /api/llm/registry

View available LLM registry entries for tenant.

**Auth:** Requires NextAuth session

**Query:** `?tenantId=user-id`

## Selection Policy

### Hard Constraints (Exclusion)

1. **Residency mismatch** - Model's allowed residencies must include request's residency
2. **Data classification** - Model must allow request's classification level
3. **Risk tier exceeded** - Request risk tier must not exceed model's max
4. **Budget disallowed** - CHEAP budget excludes HIGH cost models
5. **Capability missing** - Model must have all required capabilities for task type

### Task Type Capabilities

| Task Type           | Required Capabilities       |
| ------------------- | --------------------------- |
| CODE_GENERATION     | CODING, REASONING           |
| CODE_REVIEW         | CODING, REASONING           |
| ARCHITECTURE        | REASONING, LONG_CONTEXT     |
| PRODUCT_SPEC        | REASONING                   |
| DATA_TRANSFORM      | REASONING                   |
| CUSTOMER_SUPPORT    | REASONING                   |
| AGENT_ORCHESTRATION | FUNCTION_CALLING, REASONING |

### Scoring

- CODING capability: +50
- REASONING capability: +30
- LONG_CONTEXT capability: +10
- FUNCTION_CALLING capability: +10
- HIGH reliability: +5
- MEDIUM reliability: +3
- HIGH cost: -7
- MEDIUM cost: -3

### Tie-Break Order

1. Score (descending)
2. Cost class (ascending: LOW < MEDIUM < HIGH)
3. Reliability class (descending: HIGH > MEDIUM > LOW)
4. Key (lexicographic)

## Registry Entries

| Key                | Provider       | Residency | Risk | Cost   | Reliability |
| ------------------ | -------------- | --------- | ---- | ------ | ----------- |
| azure-oai-gpt4x-us | azure_openai   | US, ANY   | L3   | HIGH   | HIGH        |
| azure-oss-qwen-us  | azure_oss      | US        | L2   | LOW    | MEDIUM      |
| premium-coder-eu   | premium_vendor | EU        | L2   | MEDIUM | HIGH        |

## Implementation Files

- `src/lib/llm/registry/types.ts` - Zod schemas and types
- `src/lib/llm/registry/defaultRegistry.ts` - Global registry entries
- `src/lib/llm/registry/registry.ts` - Tenant-scoped retrieval
- `src/lib/llm/selection/policy.ts` - Selection algorithm
- `src/lib/llm/selection/explain.ts` - Scoring helpers
- `src/app/api/llm/select/route.ts` - Selection endpoint
- `src/app/api/llm/registry/route.ts` - Registry view endpoint
- `__tests__/lib/llm/policy.test.ts` - Unit tests

## Security

- Authentication required (NextAuth session)
- Tenant access enforced (tenantId must match userId)
- Strict request validation (no extra fields via Zod `.strict()`)
- Audit logging on every request
- No secrets in registry (descriptors only)

## Constraints

- Selection only (no provider API calls)
- No silent defaults (explicit failures)
- Deterministic (same input → same hash)
- No pricing logic (handled elsewhere)
