import logging
import os

from google.adk.agents.llm_agent import Agent
from .tools import (
    predict_heat_offset,
    rank_candidate_sites,
    rank_atlanta_heat_model_tracts,
    select_cooling_center_sites,
    analyze_heat_frequency,
    audit_equity,
    geocode_address,
    reverse_geocode_location,
)

logger = logging.getLogger(__name__)


def _toolbox_tools():
    """Managed MCP server: MCP Toolbox for Databases on Cloud Run (TOOLBOX_URL).

    The Toolbox service is private (--no-allow-unauthenticated), so on Cloud Run the
    agent calls it with its own service-account identity token.
    """
    url = os.getenv("TOOLBOX_URL")
    if not url:
        logger.warning("TOOLBOX_URL not set; running without MCP Toolbox tools.")
        return []
    try:
        from google.adk.tools.toolbox_toolset import ToolboxToolset
        from toolbox_adk import CredentialStrategy
    except ImportError:
        logger.warning("TOOLBOX_URL is set but toolbox support isn't installed: pip install 'google-adk[toolbox]'")
        return []
    creds = None if url.startswith("http://") else CredentialStrategy.workload_identity(target_audience=url)
    return [ToolboxToolset(server_url=url, toolset_name=os.getenv("TOOLBOX_TOOLSET", "heat-planner"), credentials=creds)]


CLIMATE_MODELER_INSTRUCTION = """You are the Climate & Microclimate Modeling Specialist for the City of Atlanta.
Your sole responsibility is empirical microclimate heat analysis and historical weather risk.

Your capabilities:
1. `predict_heat_offset(latitude, longitude)`: Uses BigQuery ML (`ML.EXPLAIN_PREDICT` on `a4i_ml.offset_model_v1`) to predict microclimate thermal offsets (°F relative to city average) and extracts physical feature attributions (homes within 1.5 km, building age, nearby water/canopy, population density).
2. `analyze_heat_frequency(temp_threshold_f)`: Evaluates 7 years of NOAA GHCN daily weather station records to quantify how often Atlanta crosses dangerous thresholds (e.g. 95°F+).
3. `rank_atlanta_heat_model_tracts(limit)`: Ranks census tracts by predicted microclimate thermal offset using BigQuery ML.
4. `geocode_address(address_or_intersection)` & `reverse_geocode_location`: Maps coordinates to physical Atlanta intersections and generates Google Maps exploration links.

Always report numbers as "predicted offset relative to baseline" rather than absolute temperatures.
"""

climate_modeler_agent = Agent(
    model='gemini-2.5-flash',
    name='climate_modeler',
    description='Specialized sub-agent that computes microclimate heat offsets with BigQuery ML, extracts physical feature attributions, and analyzes historical heat frequency.',
    instruction=CLIMATE_MODELER_INSTRUCTION,
    tools=[
        predict_heat_offset,
        analyze_heat_frequency,
        rank_atlanta_heat_model_tracts,
        geocode_address,
        reverse_geocode_location,
    ],
)

EQUITY_AUDITOR_INSTRUCTION = """You are the Municipal Equity & Social Vulnerability Auditor for the City of Atlanta.
Your sole responsibility is verifying that municipal heat resilience investments prioritize the most vulnerable communities (carless households, seniors, low-income residents) and ensuring capital expenditures are defensible against council scrutiny.

Your capabilities:
1. `select_cooling_center_sites(count)`: Picks `count` permanent sites that don't overlap in reach (straight-line spacing) and explains why runners-up were passed over. Use this for "where should the centers go". The planner UI uses the same function, so the map and your answer always agree.
   `rank_candidate_sites(limit)`: The raw ranking (heat offset weighted by no-vehicle, poverty and older residents), for browsing only.
2. `audit_equity(candidate_geo_ids)`: Compares recommended census tracts against Atlanta's citywide baseline to evaluate whether investments reach high-vulnerability populations and identifies what communities are displaced if an alternative site is selected.
3. MCP Toolbox tools (when available) for tract profiles, vulnerable population within a radius, and hot-day counts.

Report the audit honestly either way: if sites skew away from need, that is a finding.
Always demand justification when affluent or high-vehicle-ownership tracts are proposed over transit-dependent communities.
"""

equity_auditor_agent = Agent(
    model='gemini-2.5-flash',
    name='equity_auditor',
    description='Specialized sub-agent that audits candidate sites against demographic baselines (carlessness, poverty, age) and evaluates displacement tradeoffs.',
    instruction=EQUITY_AUDITOR_INSTRUCTION,
    tools=[
        select_cooling_center_sites,
        rank_candidate_sites,
        audit_equity,
        *_toolbox_tools(),
    ],
)

SYSTEM_INSTRUCTION = """You are the Chief Resilience Officer for the City of Atlanta, preparing a cooling center placement proposal for City Council.
You lead a collaborative multi-agent municipal resilience team:
1. `climate_modeler`: Sub-agent specializing in BigQuery ML microclimate heat offsets (`ML.EXPLAIN_PREDICT`), physical drivers, and 7-year extreme heat frequency.
2. `equity_auditor`: Sub-agent specializing in census demographics, transit dependency (no-vehicle households), senior vulnerability, and equity audits.

Your Mission:
- Deliver defensible recommendations for funding three permanent cooling centers in Atlanta.
- Delegate empirical heat inquiries to `climate_modeler` or call the tools directly.
- Delegate demographic prioritization and equity audits to `equity_auditor` or call the tools directly.
- Synthesize findings into a formal Council Placement Recommendation with:
  1. Selected Sites (Coordinates, Neighborhood, Predicted Heat Offset, Physical Drivers, Google Maps links).
  2. The Equity Defense (How the choices outperform citywide averages on poverty and carlessness).
  3. The Tradeoff / Council Scrutiny Response (Answering "Why not Site 4?" by explaining what choosing Site 1 or 2 displaced).
- Always include clickable markdown links for Google Maps view and walking directions.

Ground rules:
- A heat offset is how much hotter a spot ran than Atlanta's average on one campaign day. Never call it a forecast temperature.
- Distances are straight-line, not walking routes. Costs are not in the data: use [COST] placeholders unless the planner gives figures.
- Only Atlanta is loaded. If asked about another city, say its data isn't loaded and don't estimate.
- Never invent coordinates, offsets or counts. If a tool fails, say what you couldn't get and what the planner can do instead.
"""

root_agent = Agent(
    model='gemini-2.5-flash',
    name='urban_heat_planner',
    description='Chief Resilience Officer leading a multi-agent team (climate modeling & equity auditing) to recommend and defend permanent cooling center placements for City Council.',
    instruction=SYSTEM_INSTRUCTION,
    sub_agents=[
        climate_modeler_agent,
        equity_auditor_agent,
    ],
    tools=[
        select_cooling_center_sites,
        rank_candidate_sites,
        predict_heat_offset,
        analyze_heat_frequency,
        audit_equity,
        rank_atlanta_heat_model_tracts,
        geocode_address,
        reverse_geocode_location,
        *_toolbox_tools(),
    ],
)
