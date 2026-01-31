# AFC-PROOFPACK-EMIT-1: Proof Pack Emission for LLM Selection

## Purpose

Wires proof pack emission into `POST /api/llm/select`. Every successful model selection now returns an inline proof pack for audit verification.

## Endpoint Affected

`POST /api/llm/select`

## Request (unchanged)

```json
{
  "tenantId": "user-id",
  "taskType": "CODE_GENERATION",
  "riskTier": "L2",
  "dataResidency": "US",
  "dataClassification": "CONFIDENTIAL",
  "budgetProfile": "STANDARD"
}
```

## Response (now includes proofPack and runId)

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
  "decisionHash": "sha256:abc123...",
  "runId": "run_abc123def456...",
  "proofPack": {
    "proofPackId": "pp_abc123def456...",
    "tenantId": "user-id",
    "runId": "run_abc123def456...",
    "type": "LLM_SELECTION",
    "createdAt": "2026-01-31T00:00:00.000Z",
    "policyVersion": "AFC-LLM-REGISTRY-0@1",
    "registryVersion": "reg_v1",
    "input": {
      "taskType": "CODE_GENERATION",
      "riskTier": "L2",
      "dataResidency": "US",
      "dataClassification": "CONFIDENTIAL",
      "budgetProfile": "STANDARD",
      "moltbotSuggestion": null
    },
    "decisions": { ... },
    "approvals": [],
    "output": { ... },
    "hashes": {
      "inputHash": "sha256:...",
      "decisionHash": "sha256:...",
      "outputHash": "sha256:..."
    }
  }
}
```

## Hash Consistency Rule

There are **two different hashes** and they serve different purposes:

1. `selection.decisionHash`
   - Deterministic decision identifier produced by `selectModel()`
   - Must be stable for the same input + registry version
   - Must be **preserved inside** `proofPack.decisions.decisionHash`

2. `proofPack.hashes.decisionHash`
   - Integrity hash of the **entire** `decisions` payload (tamper detection)
   - This will **not** equal `selection.decisionHash` and should not be compared for equality

**Required invariant:**

- `proofPack.decisions.decisionHash === selection.decisionHash`

## Error Handling

| Error                   | Status | Description                 |
| ----------------------- | ------ | --------------------------- |
| `PROOFPACK_EMIT_FAILED` | 500    | Proof pack build failed     |
| `VALIDATION_ERROR`      | 400    | Invalid request schema      |
| `NO_ELIGIBLE_MODELS`    | 422    | No models match constraints |

## Audit Events

All audit logs now include `runId` and `proofPackId`:

```json
{
  "type": "LLM_MODEL_SELECTED",
  "tenantId": "user-id",
  "runId": "run_...",
  "proofPackId": "pp_...",
  "input": { ... },
  "output": { ... }
}
```

## Implementation Files

- `src/lib/proofpack/ids.ts` - Random ID generation
- `src/app/api/llm/select/route.ts` - Updated endpoint with proof pack emission
- `__tests__/api/llm/select.proofpack.test.ts` - Unit tests

## Verification Commands

```bash
npm run lint
npm run format:check
npx tsc --noEmit
npm run build
npx jest __tests__/api/llm/select.proofpack.test.ts
```
