#!/usr/bin/env bash
# infra/smoke_e2e.sh
# End-to-end smoke test for Stage 3 (`heat-ui` -> `heat-planner-api` -> `heat-toolbox` -> BigQuery).
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-qwiklabs-gcp-04-ec3596addc43}"
REGION="${COMPUTE_REGION:-us-central1}"
UI_SERVICE="${UI_SERVICE:-heat-ui}"

UI_URL="${UI_URL:-$(gcloud run services describe "${UI_SERVICE}" --region="${REGION}" --project="${PROJECT}" --format='value(status.url)')}"
TOKEN="$(gcloud auth print-identity-token 2>/dev/null || true)"
AUTH_ARGS=()
if [[ -n "${TOKEN}" ]]; then
  AUTH_ARGS=(-H "Authorization: Bearer ${TOKEN}")
fi

echo "==> Smoke testing ${UI_SERVICE} at ${UI_URL}"

echo "1) GET /api/config..."
curl -fsS "${AUTH_ARGS[@]}" "${UI_URL}/api/config" | python3 -m json.tool

echo "2) POST /api/plan (heat-ui -> heat-planner-api -> heat-toolbox)..."
RESP="$(curl -fsS "${AUTH_ARGS[@]}" -X POST "${UI_URL}/api/plan" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"e2e-smoke-1","message":"We have capital funding for three permanent cooling centers this budget cycle. Where should they go?"}')"

echo "${RESP}" | python3 -c "
import json, sys
data = json.load(sys.stdin)
assert data.get('status') == 'ok', f'Expected status ok, got {data.get(\"status\")}'
viz = data.get('viz_spec') or {}
ranked = viz.get('ranked_table') or []
assert len(ranked) >= 3, f'Expected >=3 ranked sites in viz_spec, got {len(ranked)}'
print('SUCCESS: status=ok, primary_view=' + str(viz.get('primary_view')) + ', sites=' + str([r.get('neighborhood') for r in ranked]))
"

echo "==> End-to-end smoke test PASSED!"
