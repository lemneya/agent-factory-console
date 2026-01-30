# AFC-PROOFPACK-0: Audit-Defensible Proof Packs

## Purpose

Proof packs provide immutable, verifiable evidence for all AFC decisions. Every significant operation produces a proof pack containing:

- **Input hash** - What data was used
- **Decision hash** - What choices were made
- **Output hash** - What was produced
- **Approval chain** - Who authorized what
- **Policy/registry versions** - Under what rules

## Why This Matters

After this gate, AFC becomes **audit-defensible**:

- Can prove why a model was chosen
- Can prove what data was used
- Can prove who approved what
- Can verify nothing was tampered with

## Proof Pack Types

| Type              | Description               |
| ----------------- | ------------------------- |
| `LLM_SELECTION`   | Model selection decisions |
| `PLAN_SIMULATION` | Build plan simulations    |
| `EXECUTION`       | Kimi execution runs       |
| `CHAT_RESPONSE`   | Copilot chat responses    |

## Schema

```typescript
interface ProofPack {
  proofPackId: string;
  tenantId: string;
  runId: string;

  type: ProofPackType;

  createdAt: string;
  policyVersion: string;
  registryVersion: string;

  input: unknown;
  decisions: unknown;
  approvals: Approval[];
  output: unknown;

  hashes: {
    inputHash: string; // sha256:<hex>
    decisionHash: string;
    outputHash: string;
  };
}
```

## API Endpoint

### GET /api/proof-pack/[runId]

Retrieve proof pack for a run.

**Auth:** Requires NextAuth session

**Response (200):**

```json
{
  "proofPackId": "pp_abc123_xyz",
  "tenantId": "user-id",
  "runId": "run-id",
  "type": "LLM_SELECTION",
  "createdAt": "2026-01-30T...",
  "policyVersion": "AFC-LLM-REGISTRY-0@1",
  "registryVersion": "reg_v1",
  "input": { ... },
  "decisions": { ... },
  "approvals": [{ "role": "system", "actorId": "afc", "at": "..." }],
  "output": { ... },
  "hashes": {
    "inputHash": "sha256:...",
    "decisionHash": "sha256:...",
    "outputHash": "sha256:..."
  }
}
```

## Hashing

- **Deterministic**: Same input always produces same hash
- **Canonicalized**: Object keys sorted before hashing
- **Format**: `sha256:<64 hex characters>`

```typescript
// Key order doesn't matter
sha256({ b: 2, a: 1 }) === sha256({ a: 1, b: 2 }); // true
```

## Implementation Files

- `src/lib/proofpack/types.ts` - Zod schemas and types
- `src/lib/proofpack/hash.ts` - Deterministic hashing utilities
- `src/lib/proofpack/builder.ts` - Proof pack construction
- `src/lib/proofpack/index.ts` - Module exports
- `src/app/api/proof-pack/[runId]/route.ts` - Retrieval endpoint (stub)
- `__tests__/lib/proofpack/proofpack.test.ts` - Unit tests

## Integration Points

### AFC-LLM-REGISTRY-0

Wrap `selectModel()` to produce `LLM_SELECTION` proof packs:

```typescript
import { buildProofPack, generateProofPackId } from '@/lib/proofpack';

const selection = selectModel(input, registry);

const proofPack = buildProofPack({
  proofPackId: generateProofPackId(),
  tenantId: userId,
  runId: currentRunId,
  type: 'LLM_SELECTION',
  policyVersion: selection.rationale.policyVersion,
  registryVersion: selection.rationale.registryVersion,
  input: input,
  decisions: selection.rationale,
  approvals: [{ role: 'system', actorId: 'afc', at: new Date().toISOString() }],
  output: selection,
});
```

## Future Gates

- `AFC-PROOFPACK-PERSIST-0` - Database persistence
- `AFC-PROOFPACK-VERIFY-0` - Hash verification API
- `AFC-PROOFPACK-EXPORT-0` - Audit export functionality

## Tests

14 unit tests covering:

- Deterministic hashing
- Key order independence
- Hash verification
- Proof pack construction
- Schema validation
- ID generation
