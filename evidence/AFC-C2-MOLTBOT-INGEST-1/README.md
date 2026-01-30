# AFC-C2-MOLTBOT-INGEST-1: Secure Moltbot Ingest Evidence

## Implementation Summary

This gate implements secure ingestion of Moltbot brain events into the AFC C2 dashboard. This is an **internal-only** endpoint, not a client-facing widget.

## Security Model

### Threat Model Summary

| Threat | Mitigation |
|--------|------------|
| Unauthorized access | Bearer token auth via `MOLTBOT_INGEST_TOKEN` env var |
| Identity spoofing | ExternalAgentIdentity mapping enforces provider+externalId -> userId |
| Session hijacking | Strict ownership check - session must belong to resolved userId |
| Payload injection | Strict schema validation, no additionalProperties allowed |
| Content overflow | Max 5000 chars for content, max 10 tags |
| Log pollution | Valid event types only: brain.message, brain.thought, brain.decision |

### Authentication Flow

1. Request must include `Authorization: Bearer <MOLTBOT_INGEST_TOKEN>`
2. Token must match `MOLTBOT_INGEST_TOKEN` environment variable
3. If token missing/invalid → 401 Unauthorized

### Identity Resolution Flow

1. Request must include headers:
   - `X-Moltbot-Provider: moltbot`
   - `X-Moltbot-External-Id: <phone/chat-id>`
   - `X-Moltbot-Source: whatsapp|telegram|web`
2. Lookup ExternalAgentIdentity by (provider, externalId)
3. If no mapping found → 403 Forbidden
4. Resolved userId used for session ownership check

### Session Ownership

- Session must exist
- Session must have a non-null userId
- Session.userId must match resolved identity userId
- If mismatch → 403 Forbidden

## API Endpoint

```
POST /api/c2/ingest/moltbot
```

### Required Headers

| Header | Value | Description |
|--------|-------|-------------|
| Authorization | Bearer {token} | MOLTBOT_INGEST_TOKEN |
| X-Moltbot-Provider | moltbot | Provider identifier |
| X-Moltbot-External-Id | string | External user identifier |
| X-Moltbot-Source | whatsapp\|telegram\|web | Message source |
| Content-Type | application/json | Required |

### Request Body Schema

```json
{
  "sessionId": "string (min 10 chars)",
  "event": {
    "type": "brain.message|brain.thought|brain.decision",
    "content": "string (1-5000 chars)",
    "confidence": 0.0-1.0 (optional),
    "tags": ["string"] (max 10, optional)
  }
}
```

**Note:** Additional properties are rejected with 400.

### Response Codes

| Code | Meaning |
|------|---------|
| 201 | Event created successfully |
| 400 | Invalid payload (schema violation, extra fields) |
| 401 | Missing/invalid token |
| 403 | Unknown identity OR session ownership mismatch |
| 404 | Session not found |
| 500 | Server error (e.g., token not configured) |

## Persistence vs Streaming

| Data | Persisted (DB) | Streamed (SSE) |
|------|----------------|----------------|
| C2Event (type=LOG) | ✅ Yes | ✅ Yes |
| Log level mapping | ✅ Yes | ✅ Yes |
| Moltbot metadata | ✅ Yes (in payload) | ✅ Yes |

All Moltbot events are both persisted and streamed for real-time display.

## Event Type → Log Level Mapping

| Event Type | Log Level | Notes |
|------------|-----------|-------|
| brain.message | INFO | Standard message |
| brain.thought | DEBUG | Internal reasoning |
| brain.decision | INFO | Decision point (payload.decision=true) |

## curl Examples

### Prerequisites

```bash
# Set environment variables
export MOLTBOT_INGEST_TOKEN="your-secret-token"
export SESSION_ID="your-session-id"
```

### Success Case

```bash
curl -s -X POST "http://localhost:3000/api/c2/ingest/moltbot" \
  -H "Authorization: Bearer $MOLTBOT_INGEST_TOKEN" \
  -H "X-Moltbot-Provider: moltbot" \
  -H "X-Moltbot-External-Id: +15551234567" \
  -H "X-Moltbot-Source: whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "event": {
      "type": "brain.thought",
      "content": "User appears to be asking about pricing options",
      "confidence": 0.85,
      "tags": ["pricing", "inquiry"]
    }
  }'
# Expected: 201 {"id":"...","message":"Event ingested successfully"}
```

### Failure: Invalid Token

```bash
curl -s -X POST "http://localhost:3000/api/c2/ingest/moltbot" \
  -H "Authorization: Bearer wrong-token" \
  -H "X-Moltbot-Provider: moltbot" \
  -H "X-Moltbot-External-Id: +15551234567" \
  -H "X-Moltbot-Source: whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"1234567890","event":{"type":"brain.message","content":"test"}}'
# Expected: 401 {"error":"Invalid token"}
```

### Failure: Unknown Identity

```bash
curl -s -X POST "http://localhost:3000/api/c2/ingest/moltbot" \
  -H "Authorization: Bearer $MOLTBOT_INGEST_TOKEN" \
  -H "X-Moltbot-Provider: moltbot" \
  -H "X-Moltbot-External-Id: +19999999999" \
  -H "X-Moltbot-Source: whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"1234567890","event":{"type":"brain.message","content":"test"}}'
# Expected: 403 {"error":"Unknown identity. No mapping found for this provider/externalId."}
```

### Failure: Extra Fields (Schema Violation)

```bash
curl -s -X POST "http://localhost:3000/api/c2/ingest/moltbot" \
  -H "Authorization: Bearer $MOLTBOT_INGEST_TOKEN" \
  -H "X-Moltbot-Provider: moltbot" \
  -H "X-Moltbot-External-Id: +15551234567" \
  -H "X-Moltbot-Source: whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "event": {
      "type": "brain.thought",
      "content": "test",
      "extra": "not-allowed"
    }
  }'
# Expected: 400 {"error":"Extra fields in event not allowed: extra"}
```

### Failure: Content Too Long

```bash
# Generate 5001 character content
LONG_CONTENT=$(python3 -c "print('x' * 5001)")
curl -s -X POST "http://localhost:3000/api/c2/ingest/moltbot" \
  -H "Authorization: Bearer $MOLTBOT_INGEST_TOKEN" \
  -H "X-Moltbot-Provider: moltbot" \
  -H "X-Moltbot-External-Id: +15551234567" \
  -H "X-Moltbot-Source: whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"'"$SESSION_ID"'","event":{"type":"brain.message","content":"'"$LONG_CONTENT"'"}}'
# Expected: 400 {"error":"event.content must not exceed 5000 characters"}
```

## UI Enhancement

Moltbot events appear in the Ops Console with:
- Purple left border highlight
- Purple-tinted background
- Purple text color
- Format: `🧠 Moltbot • WhatsApp • DisplayName: content`

## Screenshot TODO

- [ ] Ops Console showing Moltbot events with distinct styling
- [ ] Mix of simulation events and Moltbot ingest events

## Database Models

### ExternalAgentIdentity

Maps external identifiers to AFC users:

```prisma
model ExternalAgentIdentity {
  id          String   @id @default(cuid())
  provider    String   // e.g., "moltbot"
  externalId  String   // e.g., phone number
  userId      String   // AFC user ID
  displayName String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@unique([provider, externalId])
  @@index([userId])
}
```

## Files Changed

- `prisma/schema.prisma` - Added ExternalAgentIdentity model
- `prisma/migrations/20260130100000_afc_c2_moltbot_ingest_1/` - Migration
- `.env.example` - Added MOLTBOT_INGEST_TOKEN
- `src/app/api/c2/ingest/moltbot/route.ts` - Ingest endpoint
- `src/components/c2/C2OpsConsole.tsx` - Enhanced with Moltbot highlighting
- `evidence/AFC-C2-MOLTBOT-INGEST-1/README.md` - This file
