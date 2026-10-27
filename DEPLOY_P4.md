# P4 runbook: planner UI, MCP Toolbox, Cloud Run

This builds on the team's platform scripts in `.agents/skills/gcp-platform/scripts/`
(`bootstrap.sh` creates `heat-agent-sa` and `toolbox-sa`; `deploy_toolbox.sh` deploys a
private, warm, pinned Toolbox).

| Service | What it runs |
|---|---|
| `heat-toolbox` | MCP Toolbox for Databases with `toolbox/tools.yaml` (reads `a4i_semantic`) |
| `heat-planner-app` | The ADK agent **plus** the planner UI (`app/`): UI at `/planner/`, ADK dev UI at `/dev-ui/` |

`heat-planner-app` is a separate name so it never overwrites the `heat-planner` service that
`deploy_agent.sh` creates with `adk deploy`. It builds from `app/Dockerfile`; the root
`Dockerfile` stays the agent lane's `adk api_server` image.

The agent-side pieces (`select_cooling_center_sites`, loading the Toolbox from `TOOLBOX_URL`,
ground rules, Google geocoding) are in the separate `p4-agent-changes` PR. Until it merges, the
UI works but the agent doesn't use the Toolbox, and smoke-test steps 3 and 4 won't pass.

```bash
export PROJECT_ID=$(gcloud config get-value project) REGION=us-central1
```

## 1. Work on the UI locally with mock data (no BigQuery needed)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r agent/requirements.txt
mkdir -p .agents_dir && ln -sfn "$PWD/agent" .agents_dir/urban_heat_agent
MOCK_DATA=1 AGENTS_DIR=.agents_dir APP_NAME=urban_heat_agent uvicorn app.main:app --port 8080
```

Open Cloud Shell web preview on port 8080, then `/planner/`. A yellow banner says the data is
synthetic. Map, layers, the budget stepper, sites and audit work; the chat needs Gemini and
BigQuery, so it answers only with real data.

## 2. Maps keys (two keys, both restricted)

In **APIs & Services → Credentials**:

- **Browser key** (`maps-api-key`, the name the team's scripts already use): restrict to
  *Maps JavaScript API* and to the app URL as an HTTP referrer. It is visible in the browser.
- **Server key** (`maps-geocoding-key`): restrict to *Geocoding API*. Server-side only.

```bash
gcloud services enable maps-backend.googleapis.com geocoding-backend.googleapis.com
printf '%s' 'BROWSER_KEY' | gcloud secrets create maps-api-key --data-file=-
printf '%s' 'SERVER_KEY'  | gcloud secrets create maps-geocoding-key --data-file=-
for S in maps-api-key maps-geocoding-key; do
  gcloud secrets add-iam-policy-binding $S \
    --member serviceAccount:heat-agent-sa@$PROJECT_ID.iam.gserviceaccount.com \
    --role roles/secretmanager.secretAccessor
done
```

No browser key: the UI draws its own SVG tract map. No server key: the agent says geocoding is
unavailable and asks for coordinates.

## 3. Deploy the MCP Toolbox (private, warm)

```bash
bash .agents/skills/gcp-platform/scripts/bootstrap.sh        # once: service accounts + IAM
TOOLBOX_VERSION=<pinned x.y.z> bash .agents/skills/gcp-platform/scripts/deploy_toolbox.sh
export TOOLBOX_URL=<printed by the script>
```

`toolsets: heat-planner` in `toolbox/tools.yaml` is what the agent loads. `toolbox-sa` needs
`roles/bigquery.dataViewer` on `a4i_semantic` and `a4i_core` (the semantic views read core).
The agent authenticates to the private Toolbox with its own identity token
(`CredentialStrategy.workload_identity` in `agent/agent.py`, from the `p4-agent-changes` PR).

## 4. Deploy the agent and UI

```bash
gcloud artifacts repositories describe heat-planner --location $REGION >/dev/null 2>&1 || \
  gcloud artifacts repositories create heat-planner --repository-format docker \
    --location $REGION --labels team=team,app=heat-planner,env=hackathon
TAG=$(git rev-parse --short HEAD)
gcloud builds submit --config app/cloudbuild.yaml --substitutions _REGION=$REGION,_TAG=$TAG .
gcloud run deploy heat-planner-app \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/heat-planner/heat-planner-app:$TAG --region $REGION \
  --service-account heat-agent-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,TOOLBOX_URL=$TOOLBOX_URL \
  --set-secrets MAPS_BROWSER_KEY=maps-api-key:latest,GOOGLE_MAPS_API_KEY=maps-geocoding-key:latest \
  --min-instances 1 --cpu-boost --memory 1Gi --timeout 300 \
  --labels team=team,app=heat-planner,env=hackathon --allow-unauthenticated
gcloud run services describe heat-planner-app --region $REGION --format 'value(status.url)'
```

Add that URL (with `/*`) as the browser key's allowed referrer.

**Say this if asked:** the app is public so judges can open it; the Toolbox and BigQuery stay
private behind service accounts. For production we would put the app behind IAP.

| Variable | Default | Purpose |
|---|---|---|
| `DIM_TRACT_VIEW` | `a4i_semantic.dim_tract` | Cleaned tract view from the data lane |
| `TRACT_GEOM_TABLE` | `bigquery-public-data.geo_census_tracts.us_census_tracts_national` | Tract shapes (TIGER/Line, public domain) |
| `MIN_SPACING_KM` | `2.0` | Sites closer than this overlap; map rings show half of it |
| `ADK_DEV_UI` | `1` | `0` hides `/dev-ui/` for the final demo |
| `MOCK_DATA` | `0` | `1` = synthetic data for UI work. Never demo on it |

## 5. Smoke test before the demo

1. `/healthz` returns `{"ok": true}`.
2. `/planner/` shows Atlanta tracts and three numbered sites; the stepper changes them.
3. "Where should 3 cooling centers go?" The trace shows the hand-off to `equity_auditor` and
   `select_cooling_center_sites`, and the map updates.
4. "Who lives within 1 km of site 1?" The trace shows `vulnerable_population` (MCP Toolbox).
5. Switch city to Chicago and ask anything: the agent declines and the map greys out.
6. Council proposal tab → **Draft proposal** → **Print or save as PDF**.
7. Screenshot each step as a fallback for the live demo.
