#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
TENANT_ID="${2:-}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: ./scripts/smoke-vercel.sh <BASE_URL> <TENANT_ID>"
  echo "Example: ./scripts/smoke-vercel.sh https://your-app.vercel.app <yourUserId>"
  exit 1
fi

echo "== AFC Vercel Smoke Test =="
echo "Base URL: $BASE_URL"
echo "Tenant ID: $TENANT_ID"
echo

echo "[1/2] GET /api/llm/registry"
curl -fsS "$BASE_URL/api/llm/registry?tenantId=$TENANT_ID" | head -c 400
echo -e "\n"

echo "[2/2] POST /api/llm/select (expects proofPack + runId)"
RESP="$(curl -fsS -X POST "$BASE_URL/api/llm/select" \
  -H "content-type: application/json" \
  -d "{
    \"tenantId\":\"$TENANT_ID\",
    \"taskType\":\"CODE_REVIEW\",
    \"riskTier\":\"L2\",
    \"dataResidency\":\"US\",
    \"dataClassification\":\"CONFIDENTIAL\",
    \"budgetProfile\":\"STANDARD\"
  }")"

echo "$RESP" | head -c 700
echo -e "\n"

echo "✅ Smoke completed (manual verify: proofPack exists, hashes exist)."
