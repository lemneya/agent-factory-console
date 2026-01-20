# AFC-ADAPTER-1: cURL Examples

## Health Check

```bash
curl -s http://localhost:8001/health
```

Response:

```json
{ "status": "ok", "service": "AFC Adapter Host" }
```

## Create Run

```bash
curl -s -X POST http://localhost:8001/runs \
  -H "Content-Type: application/json" \
  -d '{"prompt":"demo"}'
```

Response:

```json
{ "runId": "<uuid>", "status": "WAITING_APPROVAL" }
```

## Get Run Status

```bash
curl -s http://localhost:8001/runs/<run_id>
```

Response:

```json
{
  "runId": "<uuid>",
  "status": "WAITING_APPROVAL",
  "createdAtMs": 1737331200000,
  "updatedAtMs": 1737331200100,
  "interrupt": {
    "gate_type": "approval",
    "resume_schema": { "approved": "bool", "notes": "str?" }
  },
  "error": null
}
```

## Get Events (NDJSON Stream)

```bash
curl -s http://localhost:8001/runs/<run_id>/events
```

Response (one JSON object per line):

```
{"ts":1737331200000,"run_id":"<uuid>","span_id":"<uuid>","parent_span_id":null,"type":"LOG","payload":{"msg":"run created"}}
{"ts":1737331200001,"run_id":"<uuid>","span_id":"<uuid>","parent_span_id":null,"type":"LOG","payload":{"msg":"plan"}}
{"ts":1737331200002,"run_id":"<uuid>","span_id":"<uuid>","parent_span_id":null,"type":"STATE_UPDATE","payload":{"state":{"plan":"planned"}}}
{"ts":1737331200003,"run_id":"<uuid>","span_id":"<uuid>","parent_span_id":null,"type":"CHECKPOINT_SAVED","payload":{"at":"plan"}}
{"ts":1737331200004,"run_id":"<uuid>","span_id":"<uuid>","parent_span_id":null,"type":"INTERRUPT_REQUIRED","payload":{"gate_type":"approval","resume_schema":{"approved":"bool","notes":"str?"}}}
```

## Resume Run

```bash
curl -s -X POST http://localhost:8001/runs/<run_id>/resume \
  -H "Content-Type: application/json" \
  -d '{"approved":true,"notes":"Looks good"}'
```

Response:

```json
{ "success": true }
```

## Cancel Run

```bash
curl -s -X POST http://localhost:8001/runs/<run_id>/cancel
```

Response:

```json
{ "success": true }
```

## Full Workflow Example

```bash
#!/bin/bash
BASE="http://localhost:8001"

# 1. Create run
RUN=$(curl -s -X POST "$BASE/runs" -H "Content-Type: application/json" -d '{}')
RUN_ID=$(echo "$RUN" | jq -r '.runId')
echo "Created run: $RUN_ID"
echo "Status: $(echo "$RUN" | jq -r '.status')"

# 2. Check status (should be WAITING_APPROVAL)
curl -s "$BASE/runs/$RUN_ID" | jq .

# 3. Get events before resume
echo "Events before resume:"
curl -s "$BASE/runs/$RUN_ID/events"

# 4. Resume
curl -s -X POST "$BASE/runs/$RUN_ID/resume" \
  -H "Content-Type: application/json" \
  -d '{"approved":true}'

# 5. Check final status (should be COMPLETED)
curl -s "$BASE/runs/$RUN_ID" | jq .

# 6. Get all events
echo "Final events:"
curl -s "$BASE/runs/$RUN_ID/events"
```
