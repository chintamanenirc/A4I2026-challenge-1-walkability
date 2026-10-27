# heat-ui (Stage 3)

The planner web UI and its FastAPI backend, per `docs/agents/IMPLEMENTATION_PLAN.md` Stage 3.
Four pages (Ask · Sites · Equity audit · Proposal) drawn from a `VizSpec` that `viz_builder.py`
builds deterministically from heat-planner-api's `AgentApiResponse`. No BigQuery access here.

| File | What it is |
|---|---|
| `contracts/agent_api.py` | **Draft** of heat-planner-api's response models, from the plan's field lists. Replace with the published `docs/contracts/` schemas when Stage 2 ships them. Fields marked "UI ask" are requests to the agent-API lane. |
| `contracts/viz_spec.py` | `VizSpec` and `FinalResponse` (owned here). `python -m ui_service.export_schemas` writes `docs/contracts/viz_spec.schema.json` and `final_response.schema.json`. |
| `viz_builder.py` | `AgentApiResponse` (+ tract layer) → `VizSpec`. |
| `main.py` | `/api/plan` → heat-planner-api `POST /api/v1/plan` (OIDC as heat-ui-sa); `/api/tracts`; `/api/config`. |
| `mock.py`, `samples/` | Mock agent API for UI work. Used when `UI_MOCK=1` or `AGENT_API_URL` is unset; every page shows a mock banner. |

## Run locally (mock)

```bash
pip install -r ui_service/requirements.txt
UI_MOCK=1 uvicorn ui_service.main:app --port 8080
```

Open `http://localhost:8080/`, ask "Where should 3 cooling centers go?", then visit each page.

## Test

```bash
pytest ui_service/tests
```

## Open questions for heat-planner-api

1. **Tract layer**: `GET /api/v1/tracts` (tract polygons with offset, no-car, 65+, poverty, population) for the map and the audit scatter. Without it, live mode shows pins only and no scatter.
2. `proposal_sections` (`why_these`, `what_this_displaces`) so the memo keeps a fixed layout.
3. `passed_over_reason` on runner-up sites.
4. Tract-level `no_vehicle_rate`, `share_65_plus`, `poverty_rate` on each `SiteAssessment`.
5. `racial_composition` in `EquityAudit` (post-hoc check only, from `sql/audit/audit.sql`).
6. Request body of `POST /api/v1/plan` (assumed `{session_id, message}`).
