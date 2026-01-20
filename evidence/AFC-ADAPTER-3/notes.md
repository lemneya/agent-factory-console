# AFC-ADAPTER-3: Adapter Status + Health (timeout-bounded /health probes)

## Overview

Lightweight, timeout-bounded reachability checks for registered adapters by probing `GET /health` endpoint.

## Data Model Changes

### New Fields on Adapter

| Field             | Type      | Description                        |
| ----------------- | --------- | ---------------------------------- |
| lastSeenAt        | DateTime? | Last time adapter was reachable    |
| healthStatus      | String    | UNKNOWN \| OK \| UNREACHABLE       |
| lastHealthCheckAt | DateTime? | Last time health was checked       |
| lastHealthError   | String?   | Last error message (max 500 chars) |

## Health Probe Contract

### Request

```
GET ${baseUrl}/health
```

### Rules

- **Timeout**: 1500ms hard limit
- **No redirects**: Redirects treated as UNREACHABLE (masks failures)
- **Disabled adapters**: Skipped (status remains UNKNOWN)

### Success Criteria

| Response      | Status      | Actions                                           |
| ------------- | ----------- | ------------------------------------------------- |
| HTTP 200      | OK          | Update lastSeenAt, lastHealthCheckAt, clear error |
| Non-200       | UNREACHABLE | Set lastHealthError, update lastHealthCheckAt     |
| Timeout       | UNREACHABLE | Set error "Timeout after 1500ms"                  |
| Network error | UNREACHABLE | Set error (DNS/connection refused)                |
| Redirect      | UNREACHABLE | Set error "Redirect response"                     |

## API Endpoints

### GET /api/adapters/status

List adapters with health status.

**Query Parameters:**

- `refresh=1` - Force health probes before returning (otherwise returns cached DB values)

**Response:**

```json
[
  {
    "id": "clx...",
    "name": "langgraph-host",
    "baseUrl": "http://localhost:8123",
    "enabled": true,
    "healthStatus": "OK",
    "lastSeenAt": "2026-01-20T12:00:00.000Z",
    "lastHealthCheckAt": "2026-01-20T12:00:00.000Z",
    "lastHealthError": null
  }
]
```

### POST /api/adapters/status/refresh

Probe all enabled adapters.

**Response:**

```json
{
  "ok": 1,
  "unreachable": 1,
  "skipped": 0,
  "total": 2,
  "checkedAt": "2026-01-20T12:00:00.000Z"
}
```

## How to Test

### Prerequisites

1. Run migrations: `npx prisma migrate deploy`
2. Seed adapters: `curl -X POST localhost:3000/api/adapters/seed`

### Test Reachable Adapter

1. Start LangGraph host on port 8123 (or any server with `/health` endpoint)
2. Refresh status:
   ```bash
   curl -X POST localhost:3000/api/adapters/status/refresh
   ```
3. Verify `healthStatus: "OK"` and `lastSeenAt` updated

### Test Unreachable Adapter

1. Create adapter pointing to dead port:
   ```sql
   INSERT INTO "Adapter" (id, name, version, "baseUrl", enabled, "createdAt", "updatedAt")
   VALUES ('test-dead', 'dead-adapter', '1.0.0', 'http://localhost:9999', true, NOW(), NOW());
   ```
2. Refresh status:
   ```bash
   curl -X POST localhost:3000/api/adapters/status/refresh
   ```
3. Verify `healthStatus: "UNREACHABLE"` and `lastHealthError` populated

### Test Timeout Behavior

The timeout is set to 1500ms. To test:

1. Create adapter pointing to a slow/unresponsive endpoint
2. Refresh status
3. Verify error contains "Timeout after 1500ms"

## Unit Tests

```
PASS __tests__/lib/adapter-health-probe.test.ts
  Adapter Health Probe
    truncateError
      ✓ should return short errors unchanged
      ✓ should truncate long errors with ellipsis
      ✓ should handle exactly max length
    probeAdapterHealth
      ✓ should return UNKNOWN for disabled adapters (skipped)
      ✓ should return OK for HTTP 200 response
      ✓ should return UNREACHABLE for non-200 HTTP response
      ✓ should return UNREACHABLE for HTTP 404
      ✓ should return UNREACHABLE for redirect responses
      ✓ should return UNREACHABLE for timeout (AbortError)
      ✓ should return UNREACHABLE for connection refused
      ✓ should return UNREACHABLE for DNS resolution failure
      ✓ should handle baseUrl with trailing slash
      ✓ should handle unknown errors gracefully

Tests: 13 passed, 13 total
```

## Files Changed

1. **`prisma/schema.prisma`** - Added health fields to Adapter model
2. **`prisma/migrations/20260120100000_afc_adapter_3_health_status/migration.sql`** - Migration
3. **`src/lib/adapter-health-probe.ts`** - Health probe function
4. **`src/app/api/adapters/status/route.ts`** - GET status endpoint
5. **`src/app/api/adapters/status/refresh/route.ts`** - POST refresh endpoint
6. **`__tests__/lib/adapter-health-probe.test.ts`** - Unit tests

## Non-Scope (Future Work)

- No background cron (refresh only on-demand)
- No adapter invocation or runtime calls
- No UI (optional future enhancement)
