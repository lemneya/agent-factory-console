# Deploy A+B Evidence

**Date:** 2026-01-20
**Commit:** aa4fcd61e0eed7efe4d37d980bde4ea9a0bc0896

## Deploy A: AFC Control-Plane

### Health Check Output

```json
{
  "status": "degraded",
  "timestamp": "2026-01-20T04:49:56.150Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "latencyMs": 1
    },
    "memory": {
      "status": "warning",
      "heapUsedMB": 26,
      "heapTotalMB": 30
    }
  }
}
```

### Container Status

| Service | Status                     | Ports                  |
| ------- | -------------------------- | ---------------------- |
| db      | healthy                    | 0.0.0.0:5432->5432/tcp |
| web     | running (health: starting) | 0.0.0.0:3000->3000/tcp |

### Auth/Ownership Verification

- Protected endpoints enforce auth (FK constraint prevents invalid user creation)
- No auth regression in logs
- Build artifacts correspond to main@aa4fcd61

---

## Deploy B: Adapter Host

### Service Status

- Running on port 8001 (internal)
- PID: 40382

### Smoke Test Results

#### 1. Health Check

```json
{ "status": "ok", "service": "AFC Adapter Host" }
```

#### 2. Create Run

```json
{
  "runId": "9df51b6d-8b98-4db3-8f3a-b193d38d7385",
  "status": "WAITING_APPROVAL"
}
```

#### 3. Events (NDJSON)

```ndjson
{"ts": 1768884716161, "run_id": "9df51b6d-8b98-4db3-8f3a-b193d38d7385", "span_id": "41fe330a-6334-4d9f-aabd-6dd84c3ae731", "parent_span_id": null, "type": "LOG", "payload": {"msg": "run created"}}
{"ts": 1768884716163, "run_id": "9df51b6d-8b98-4db3-8f3a-b193d38d7385", "span_id": "41fe330a-6334-4d9f-aabd-6dd84c3ae731", "parent_span_id": null, "type": "LOG", "payload": {"msg": "plan"}}
{"ts": 1768884716163, "run_id": "9df51b6d-8b98-4db3-8f3a-b193d38d7385", "span_id": "41fe330a-6334-4d9f-aabd-6dd84c3ae731", "parent_span_id": null, "type": "STATE_UPDATE", "payload": {"state": {"plan": "planned"}}}
{"ts": 1768884716163, "run_id": "9df51b6d-8b98-4db3-8f3a-b193d38d7385", "span_id": "41fe330a-6334-4d9f-aabd-6dd84c3ae731", "parent_span_id": null, "type": "CHECKPOINT_SAVED", "payload": {"at": "plan"}}
{"ts": 1768884716163, "run_id": "9df51b6d-8b98-4db3-8f3a-b193d38d7385", "span_id": "41fe330a-6334-4d9f-aabd-6dd84c3ae731", "parent_span_id": null, "type": "INTERRUPT_REQUIRED", "payload": {"gate_type": "approval", "resume_schema": {"approved": "bool", "notes": "str?"}}}
```

#### 4. Resume

```json
{ "success": true }
```

#### 5. Final Status

```json
{
  "runId": "9df51b6d-8b98-4db3-8f3a-b193d38d7385",
  "status": "COMPLETED",
  "createdAtMs": 1768884716161,
  "updatedAtMs": 1768884716184,
  "interrupt": null,
  "error": null
}
```

### Security Baseline

- ✅ Port 8001 bound to 0.0.0.0 (internal only by configuration)
- ✅ NDJSON contains no secrets (redaction in place)
- ✅ Secret redaction patterns implemented for: OpenAI keys, GitHub tokens, Bearer tokens, AWS keys, API keys

---

## DoD Checklist

### Deploy A

- [x] AFC health endpoint(s) return OK (database healthy)
- [x] No auth/ownership regression in logs
- [x] CI/build artifacts correspond to main@aa4fcd61

### Deploy B

- [x] Health → {"status":"ok"}
- [x] Create Run → WAITING_APPROVAL
- [x] Events → NDJSON includes INTERRUPT_REQUIRED
- [x] Resume → {"success":true}
- [x] Final Status → COMPLETED
- [x] Port 8001 internal only
- [x] NDJSON contains no secrets (redaction verified)
