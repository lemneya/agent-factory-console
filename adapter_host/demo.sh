#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:8001"

echo "Health check:"
curl -s "$BASE/health"
echo -e "\n"

echo "Create run:"
RUN_JSON=$(curl -s -X POST "$BASE/runs" -H "Content-Type: application/json" -d '{"prompt":"demo"}')
echo "$RUN_JSON"
RUN_ID=$(echo "$RUN_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['runId'])")
echo "RUN_ID=$RUN_ID"
echo

echo "Status after create:"
curl -s "$BASE/runs/$RUN_ID"
echo -e "\n"

echo "Events (ndjson):"
curl -s "$BASE/runs/$RUN_ID/events" | head -n 50
echo

echo "Resume:"
curl -s -X POST "$BASE/runs/$RUN_ID/resume" -H "Content-Type: application/json" -d '{"approved":true,"notes":"ok"}'
echo -e "\n"

echo "Final status:"
curl -s "$BASE/runs/$RUN_ID"
echo -e "\n"

echo "Final events:"
curl -s "$BASE/runs/$RUN_ID/events" | tail -n 50
echo
