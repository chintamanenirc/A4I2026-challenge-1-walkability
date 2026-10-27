"""Heat Planner web server.

One Cloud Run service that serves:
  /planner/        the planner UI (static files in app/static)
  /run_sse, /apps  the ADK agent API (used by the UI chat)
  /dev-ui/         ADK's developer UI (set ADK_DEV_UI=0 to turn off)
  /api/*           map data for the UI (same tools the agent uses)
"""

import os
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from google.adk.cli.fast_api import get_fast_api_app

from . import data

HERE = Path(__file__).parent
AVAILABLE_CITIES = [
    ("Seattle", "Contrast city, stretch goal (~35k readings)"),
    ("Dallas", "~19k readings"),
    ("Houston", "~147k readings"),
    ("Chicago", "~49k readings"),
    ("Los Angeles (Central)", "~17k readings"),
    ("New York (Brooklyn)", "~15k readings"),
    ("New York (Manhattan/Bronx)", "~12k readings"),
]

app: FastAPI = get_fast_api_app(
    agents_dir=data.AGENTS_DIR,
    session_service_uri=os.getenv("SESSION_SERVICE_URI", "memory://"),
    artifact_service_uri=os.getenv("ARTIFACT_SERVICE_URI", "memory://"),
    web=os.getenv("ADK_DEV_UI", "1") == "1",
)

# ADK's dev server redirects "/" to its own UI; send people to the planner instead.
app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != "/"]


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/planner/")


@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"ok": True}


@app.get("/api/config")
def config():
    return {
        "appName": data.APP_NAME,
        "city": data.CITY,
        "mock": data.MOCK,
        "mapsKey": os.getenv("MAPS_BROWSER_KEY", ""),
        "minSpacingKm": data.MIN_SPACING_KM,
        "availableCities": [{"name": n, "note": note} for n, note in AVAILABLE_CITIES],
    }


@app.get("/api/tracts")
def tracts():
    try:
        return data.tracts()
    except Exception as e:  # surface a clear message to the UI
        raise HTTPException(502, f"Couldn't load tract map: {e}") from e


@app.get("/api/sites")
def sites(count: int = Query(3, ge=1, le=5)):
    result = data.sites(count)
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(502, result["error"])
    return result


@app.get("/api/audit")
def audit(ids: str = Query(..., description="Comma-separated 11-digit tract GEOIDs")):
    id_list = [i for i in ids.split(",") if re.fullmatch(r"\d{11}", i)]
    if not id_list:
        raise HTTPException(400, "Pass one or more 11-digit tract GEOIDs.")
    return data.audit(id_list[:10])


@app.get("/api/frequency")
def frequency(threshold: float = Query(95.0, ge=80, le=115)):
    return data.frequency(threshold)


app.mount("/planner", StaticFiles(directory=HERE / "static", html=True), name="planner")
