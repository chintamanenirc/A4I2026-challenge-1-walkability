#!/usr/bin/env bash
# infra/deploy_ui.sh
# Deploy `heat-ui` (Stage 3 / M6) to its own Cloud Run service attached to
# `heat-planner-vpc` and connected to `heat-planner-api` using `heat-ui-sa`.
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-qwiklabs-gcp-04-ec3596addc43}"
REGION="${COMPUTE_REGION:-us-central1}"
SERVICE_NAME="heat-ui"
UI_SA="heat-ui-sa@${PROJECT}.iam.gserviceaccount.com"
AGENT_SERVICE_NAME="heat-planner-api"

AGENT_API_URL="${AGENT_API_URL:-$(gcloud run services describe "${AGENT_SERVICE_NAME}" --region="${REGION}" --project="${PROJECT}" --format='value(status.url)')}"

echo "==> Ensuring ${UI_SA} has roles/run.invoker on ${AGENT_SERVICE_NAME}..."
gcloud run services add-iam-policy-binding "${AGENT_SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --member="serviceAccount:${UI_SA}" \
  --role="roles/run.invoker" \
  --quiet >/dev/null

echo "==> Deploying ${SERVICE_NAME} to Cloud Run (${REGION}) with AGENT_API_URL=${AGENT_API_URL}..."
gcloud run deploy "${SERVICE_NAME}" \
  --source="ui_service" \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --service-account="${UI_SA}" \
  --network="heat-planner-vpc" \
  --subnet="heat-planner-subnet" \
  --vpc-egress="private-ranges-only" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT},CITY_NAME=Atlanta,UI_MOCK=0,AGENT_TIMEOUT_S=60,AGENT_API_URL=${AGENT_API_URL}" \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=5 \
  --allow-unauthenticated \
  --labels="team=team,app=heat-planner,env=hackathon" \
  --quiet

UI_URL="$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT}" --format='value(status.url)')"
echo "==> ${SERVICE_NAME} deployed at: ${UI_URL}"
