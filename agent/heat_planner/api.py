"""FastAPI application for the `heat-planner-api` Cloud Run service."""
from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Any
import uuid

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

from .config import Settings
from .orchestrator import run_plan_turn
from .schemas import AgentApiResponse, SiteAssessment

log = logging.getLogger(__name__)
_settings = Settings()

FEATURE_LABELS: dict[str, str] = {
    "pop_density_km2": "Street density",
    "housing_density_km2": "Housing density",
    "pop_within_1500m": "People within 1.5 km",
    "median_year_built": "Older building stock",
    "km_from_center": "Distance from downtown",
    "water_share": "Water nearby",
    "dist_to_water_m": "Distance to water",
    "lat": "North–south position",
    "lon": "East–west position",
}

app = FastAPI(
    title="Atlanta Urban Heat Planning Assistant API",
    version="1.0.0",
    description=(
        "5-Stage ADK HeatPlannerOrchestrator API consuming MCP Toolbox (`heat-toolbox`) "
        "and BigQuery ML (`a4i_ml.offset_model_v1`)."
    ),
)

# In-memory session store keyed by session_id for multi-turn state (`last_ranked_candidates`, etc.)
_SESSIONS: dict[str, dict[str, Any]] = {}


class PlanRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message: str = Field(..., min_length=1, max_length=2000, description="Planner question or command.")
    session_id: str = Field(default="default", description="Session identifier for multi-turn state.")


def _serialize_site_for_ui(
    s: SiteAssessment,
    provenance_ids: list[str],
    funded_count: int,
) -> dict[str, Any]:
    d = s.model_dump(mode="json")
    d["site_id"] = s.point_id
    d["address_hint"] = s.neighborhood
    d["implied_local_high_f"] = s.forecast_implied_f
    d["why"] = s.why_here
    d["provenance_ids"] = provenance_ids
    d["tract_no_vehicle_rate"] = s.demographics.no_vehicle_rate
    d["tract_share_65_plus"] = s.demographics.share_65_plus
    d["tract_poverty_rate"] = s.demographics.poverty_rate
    if s.spacing_conflict_with_rank is not None:
        d["passed_over_reason"] = f"Within 2.0 km of Site {s.spacing_conflict_with_rank}"
    elif s.rank > funded_count:
        d["passed_over_reason"] = "Lower composite heat + vulnerability priority score than funded sites"
    else:
        d["passed_over_reason"] = None

    d["drivers"] = [
        {
            "feature": drv.feature,
            "label": FEATURE_LABELS.get(drv.feature, drv.feature),
            "attribution_f": drv.attribution,
            "attribution": drv.attribution,
        }
        for drv in s.drivers
    ]
    d["catchment"] = {
        "radius_m": s.demographics.radius_m,
        "tracts_within_radius": s.demographics.tract_count,
        "population_within_radius": s.demographics.total_pop,
        "pop_65_plus_within_radius": s.demographics.pop_65_plus,
        "car_free_households_within_radius": s.demographics.car_free_households,
        "households_within_radius": s.demographics.households,
        "share_65_plus_within_radius": s.demographics.share_65_plus,
        "no_vehicle_rate_within_radius": s.demographics.no_vehicle_rate,
        "pop_weighted_poverty_rate": s.demographics.poverty_rate,
        "tract_geo_ids": s.demographics.tract_geo_ids,
    }
    d["hot_days"] = {
        "offset_f": s.predicted_offset_f,
        "mean_days_ge_95f_equiv_per_yr": s.hot_days.expected_days_ge_95f_equiv,
        "city_baseline_days_ge_95f_per_yr": s.hot_days.city_days_ge_95f_per_yr,
        "extra_days_ge_95f_equiv_per_yr": s.hot_days.extra_days_ge_95f_equiv,
        "mean_days_ge_90f_equiv_per_yr": s.hot_days.expected_days_ge_90f_equiv,
        "mean_days_ge_100f_equiv_per_yr": s.hot_days.expected_days_ge_100f_equiv,
        "full_years_counted": 7,
        **s.hot_days.model_dump(mode="json"),
    }
    return d


def _to_api_dict(resp: AgentApiResponse) -> dict[str, Any]:
    """Serialize AgentApiResponse with fields compatible with both Stage 2 contracts and Stage 3 heat-ui."""
    out = resp.model_dump(mode="json")
    status_map = {
        "success": "ok",
        "refused": "out_of_scope",
        "not_found": "no_data",
    }
    ui_status = status_map.get(resp.status, resp.status)
    intent_map = {
        "out_of_scope_city": "out_of_scope",
        "causal_simulation": "out_of_scope",
        "future_forecast": "out_of_scope",
        "race_in_model": "out_of_scope",
        "ambiguous_prompt": "explain_location",
    }
    ui_intent_type = intent_map.get(resp.intent.intent_type, resp.intent.intent_type)

    prov_ids = [p.provenance_id for p in resp.data_result.provenance]
    per_call_latency = max(1, resp.latency_ms // max(1, len(resp.data_result.provenance)))
    citations = []
    for p in resp.data_result.provenance:
        pd = p.model_dump(mode="json")
        pd["source_type"] = "mcp_toolbox"
        pd["timestamp_utc"] = p.queried_at_utc
        pd["latency_ms"] = per_call_latency
        citations.append(pd)

    out["trace_id"] = f"tr_{uuid.uuid4().hex[:8]}"
    out["status"] = ui_status
    out["narrative"] = resp.narrative_markdown
    out["citations"] = citations
    out["total_latency_ms"] = resp.latency_ms
    out["error_message"] = resp.data_result.error_message

    out["intent"]["intent_type"] = ui_intent_type
    out["intent"]["status"] = ui_status
    out["intent"]["k"] = resp.intent.k_sites
    out["intent"]["min_spacing_m"] = float(resp.intent.min_spacing_m)
    out["intent"]["threshold_f"] = 95.0
    out["intent"]["candidate_ranks"] = resp.intent.compared_ranks
    out["intent"]["missing_parameters"] = resp.intent.missing_fields
    out["intent"]["clarifying_question"] = resp.intent.clarification_question
    out["intent"]["refusal_reason"] = "other" if resp.intent.refusal_reason else None
    out["intent"]["refusal_explanation"] = resp.intent.refusal_reason

    out["data_result"]["status"] = ui_status
    out["data_result"]["intent_type"] = ui_intent_type
    out["data_result"]["rows"] = []
    out["data_result"]["summary_metrics"] = {"sites_returned": len(resp.data_result.sites)}
    out["data_result"]["provenance"] = citations

    # Build top-level recommendation object for Stage 3 UI VizSpecBuilder
    rec = resp.data_result.recommendation
    sites = rec.sites if rec else resp.data_result.sites
    runner_ups = rec.runner_up_sites if rec else resp.data_result.runner_up_sites
    hf = rec.heat_frequency if rec else resp.data_result.heat_frequency
    ea = rec.equity_audit if rec else resp.data_result.equity_audit

    if rec or sites or hf or ea:
        hf_dict = None
        if hf:
            hf_dict = {
                **hf.model_dump(mode="json"),
                "years": [
                    {
                        "year": int(y.get("year", 2025)),
                        "days_ge_90_f": int(y.get("days_ge_90f", y.get("days_ge_90_f", 0))),
                        "days_ge_95_f": int(y.get("days_ge_95f", y.get("days_ge_95_f", 0))),
                        "days_ge_100_f": int(y.get("days_ge_100f", y.get("days_ge_100_f", 0))),
                    }
                    for y in hf.by_year
                ],
                "mean_days_ge_95_f": hf.avg_days_ge_95f,
                "ols_slope_days_ge_95_per_yr": (
                    round(hf.trend_days_per_decade / 10.0, 2)
                    if hf.trend_days_per_decade is not None
                    else None
                ),
                "caveat": "Seven years of NOAA GHCN station history show year-to-year variability, not a long-term climate trend.",
            }

        ea_dict = None
        if ea:
            allowed_measures = {"median_income", "poverty_rate", "no_vehicle_rate", "share_65_plus"}
            measures = [
                {
                    "measure": m.metric,
                    "sites_value": m.recommended_sites,
                    "city_value": m.city_overall,
                    "ratio": m.ratio_rec_to_city or (
                        round(m.recommended_sites / m.city_overall, 2) if m.city_overall else 1.0
                    ),
                }
                for m in ea.metrics
                if m.metric in allowed_measures
            ]
            ea_dict = {
                **ea.model_dump(mode="json"),
                "measures": measures,
                "verdict": ea.summary,
                "racial_composition": [],
                "provenance_ids": prov_ids,
            }

        out["recommendation"] = {
            "city": _settings.city,
            "track": _settings.track,
            "scenario": "3 permanent walkable cooling centers (This budget cycle)",
            "forecast_high_f": resp.intent.forecast_high_f,
            "campaign_mean_f": 82.062,
            "sites": [_serialize_site_for_ui(s, prov_ids, len(sites)) for s in sites],
            "runner_up_sites": [_serialize_site_for_ui(s, prov_ids, len(sites)) for s in runner_ups],
            "heat_frequency": hf_dict,
            "equity_audit": ea_dict,
            "proposal_markdown": rec.proposal_markdown if rec else resp.narrative_markdown,
            "proposal_sections": {
                "why_these": "Selected sites maximize composite heat offset and transit-dependent / senior vulnerability while maintaining >= 2.0 km spacing [P1].",
                "what_this_displaces": "Runner-up candidates either fall within the 2.0 km catchment spacing of a higher-ranked center or serve fewer car-free and senior residents [P1].",
            },
            "limitations": (
                rec.limitations
                if rec
                else [
                    "Heat offsets come from a single afternoon Heat Watch campaign.",
                    "Catchment distances are straight-line (800 m), not walking-network routes.",
                    "The model predicts outdoor ambient heat offset, not indoor temperatures or health outcomes.",
                    "Seven years of GHCN station history show interannual variability, not a multi-decade climate trend.",
                    "Race and ethnicity are never model or ranking inputs; they appear only in post-hoc equity auditing.",
                ]
            ),
            "model_version": _settings.bqml_model_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    else:
        out["recommendation"] = None

    return out


class AdkPart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str | None = None


class AdkMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: str = "user"
    parts: list[AdkPart] = Field(default_factory=list)


class AdkRunRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    appName: str = "urban_heat_agent"
    userId: str = "urban_planner"
    sessionId: str = "default"
    newMessage: AdkMessage | None = None
    message: str | None = None


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "heat-planner-api",
        "city": _settings.city,
        "track": _settings.track,
        "bqml_model": _settings.bqml_model_id,
        "agent_model": _settings.agent_model,
        "writer_model": _settings.writer_model,
        "google_cloud_location": _settings.google_cloud_location,
        "toolbox_configured": bool(_settings.toolbox_url),
    }


@app.get("/list-apps")
def list_apps() -> list[str]:
    return ["urban_heat_agent", "heat_planner", "agent"]


@app.post("/apps/{app_name}/users/{user_id}/sessions/{session_id}")
def create_session(app_name: str, user_id: str, session_id: str) -> dict[str, Any]:
    _SESSIONS.setdefault(session_id, {})
    return {"id": session_id, "appName": app_name, "userId": user_id, "state": {}}


@app.post("/api/v1/plan")
def plan_endpoint(req: PlanRequest) -> dict[str, Any]:
    state = _SESSIONS.setdefault(req.session_id, {})
    resp = run_plan_turn(req.message, session_state=state)
    return _to_api_dict(resp)


@app.post("/run")
def adk_run_endpoint(req: AdkRunRequest) -> list[dict[str, Any]]:
    msg_text = req.message or ""
    if not msg_text and req.newMessage and req.newMessage.parts:
        msg_text = " ".join(p.text for p in req.newMessage.parts if p.text).strip()
    if not msg_text:
        msg_text = "Recommend 3 cooling centers in Atlanta."

    state = _SESSIONS.setdefault(req.sessionId, {})
    resp = run_plan_turn(msg_text, session_state=state)
    api_dict = _to_api_dict(resp)

    events: list[dict[str, Any]] = []
    call_parts: list[dict[str, Any]] = []
    for prov in resp.data_result.provenance:
        call_parts.append(
            {
                "functionCall": {
                    "name": prov.tool_name,
                    "args": prov.parameters,
                }
            }
        )
    if call_parts:
        events.append({"author": req.appName, "content": {"role": "model", "parts": call_parts}})

    events.append(
        {
            "author": req.appName,
            "content": {
                "role": "user",
                "parts": [
                    {
                        "functionResponse": {
                            "name": "assemble_placement_recommendation",
                            "response": api_dict,
                        }
                    }
                ],
            },
        }
    )
    events.append(
        {
            "author": req.appName,
            "content": {
                "role": "model",
                "parts": [{"text": api_dict.get("narrative") or resp.narrative_markdown}],
            },
        }
    )
    return events

