"""Data endpoints for the planner UI.

Real mode reuses the agent's own tools (same BigQuery ML model, same site
selection), so the map and the agent never disagree. Mock mode
(MOCK_DATA=1) serves synthetic Atlanta-shaped data so the front end can be
built before BigQuery is ready. Mock data is labelled as such in the UI.
"""

import importlib
import importlib.util
import json
import math
import os
import sys
import time
from typing import Any, Dict, List

MOCK = os.getenv("MOCK_DATA", "0") == "1"
CITY = os.getenv("CITY_NAME", "Atlanta")
AGENTS_DIR = os.getenv("AGENTS_DIR", "/app/agents")
APP_NAME = os.getenv("APP_NAME", "urban_heat_agent")
# Census tract shapes (public domain, US Census TIGER/Line): the same table the
# data lane joins in sql/core/03_tracts.sql.
TRACT_GEOM_TABLE = os.getenv(
    "TRACT_GEOM_TABLE", "bigquery-public-data.geo_census_tracts.us_census_tracts_national"
)
# Cleaned, documented tract view from the data lane (docs/HANDOFF.md).
DIM_TRACT = os.getenv("DIM_TRACT_VIEW", "a4i_semantic.dim_tract")
MIN_SPACING_KM = float(os.getenv("MIN_SPACING_KM", "2.0"))
CACHE_SECONDS = 600

_cache: Dict[str, Any] = {}


def _cached(key: str, fn):
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_SECONDS:
        return hit[1]
    value = fn()
    _cache[key] = (time.time(), value)
    return value


def _tools():
    if AGENTS_DIR not in sys.path:
        sys.path.insert(0, AGENTS_DIR)
    return importlib.import_module(f"{APP_NAME}.tools")


# ---------------------------------------------------------------- real data

def _real_tracts() -> Dict[str, Any]:
    t = _tools()
    c = t.get_city_centroid()
    query = f"""
    WITH d AS (
      SELECT geo_id, centroid_lat AS tract_lat, centroid_lon AS tract_lon, population,
             median_age, share_65_plus, poverty_rate, no_vehicle_rate
      FROM `{t.PROJECT_ID}.{DIM_TRACT}`
      WHERE centroid_lat IS NOT NULL AND centroid_lon IS NOT NULL
    ),
    p AS (
      SELECT geo_id, predicted_temp_offset_f
      FROM ML.PREDICT(MODEL `{t.MODEL_ID}`, (
        SELECT geo_id, tract_lat AS latitude, tract_lon AS longitude,
               (tract_lat - @clat) * 111.0 AS northing_km,
               (tract_lon - @clon) * 93.0 AS easting_km
        FROM d))
    ),
    g AS (
      SELECT LPAD(TRIM(CAST(geo_id AS STRING)), 11, '0') AS geo_id, tract_geom
      FROM `{TRACT_GEOM_TABLE}`
    )
    SELECT d.geo_id, d.population, d.median_age,
           ROUND(d.share_65_plus * 100, 1) AS share_65_plus_pct,
           ROUND(d.poverty_rate * 100, 1) AS poverty_pct,
           ROUND(d.no_vehicle_rate * 100, 1) AS no_vehicle_pct,
           ROUND(p.predicted_temp_offset_f, 2) AS offset_f,
           ST_ASGEOJSON(ST_SIMPLIFY(g.tract_geom, 15)) AS geom
    FROM d
    JOIN p USING (geo_id)
    JOIN g USING (geo_id)
    """
    from google.cloud import bigquery

    cfg = bigquery.QueryJobConfig(query_parameters=[
        bigquery.ScalarQueryParameter("clat", "FLOAT64", c["lat"]),
        bigquery.ScalarQueryParameter("clon", "FLOAT64", c["lon"]),
    ])
    features = []
    for r in t.bq_client.query(query, job_config=cfg).result():
        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geom),
            "properties": {
                "geo_id": r.geo_id,
                "offset_f": r.offset_f,
                "no_vehicle_pct": r.no_vehicle_pct,
                "poverty_pct": r.poverty_pct,
                "median_age": r.median_age,
                "share_65_plus_pct": r.share_65_plus_pct,
                "population": int(r.population) if r.population else None,
            },
        })
    return {"type": "FeatureCollection", "features": features, "center": c}


# ---------------------------------------------------------------- mock data

def _mock_tracts() -> Dict[str, Any]:
    cols, rows = 14, 10
    lon0, lat0, dlon, dlat = -84.52, 33.665, 0.0185, 0.0165

    def h(a, b):
        s = math.sin(a * 12.9898 + b * 78.233) * 43758.5453
        return s - math.floor(s)

    pts = [[(lon0 + i * dlon + (0 if i in (0, cols) else (h(i, j) - .5) * dlon * .5),
             lat0 + j * dlat + (0 if j in (0, rows) else (h(j + 9, i) - .5) * dlat * .5))
            for i in range(cols + 1)] for j in range(rows + 1)]
    heat = [(4, 6, 3.2), (8, 4, 3.0), (6, 2, 2.6), (11, 7, 2.0), (2, 3, 1.6)]
    car = [(3, 6, 40), (8, 3, 36), (6, 2, 34), (11, 2, 20)]
    age = [(5, 7, 14), (9, 4, 12), (2, 2, 13), (12, 6, 9)]

    def bump(spots, i, j):
        return sum(a * math.exp(-((i - x) ** 2 + (j - y) ** 2) / 5) for x, y, a in spots)

    feats = []
    for j in range(rows):
        for i in range(cols):
            ring = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i], pts[j][i]]
            jitter = (h(i, j) - .5)
            feats.append({
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [[list(p) for p in ring]]},
                "properties": {
                    "geo_id": f"13121{j:02d}{i:02d}00",
                    "offset_f": round(bump(heat, i, j) - 1.2 + jitter * .6, 2),
                    "no_vehicle_pct": round(4 + bump(car, i, j) + jitter * 3, 1),
                    "poverty_pct": round(8 + bump(car, i, j) * .7 + jitter * 4, 1),
                    "median_age": round(31 + bump(age, i, j) + jitter * 3, 1),
                    "share_65_plus_pct": round(7 + bump(age, i, j) * .9 + jitter * 2, 1),
                    "population": int(1800 + h(j, i) * 4200),
                },
            })
    return {"type": "FeatureCollection", "features": feats,
            "center": {"lat": lat0 + rows * dlat / 2, "lon": lon0 + cols * dlon / 2}}


def _mock_candidates() -> List[Dict[str, Any]]:
    out = []
    for f in _mock_tracts()["features"]:
        p = f["properties"]
        ring = f["geometry"]["coordinates"][0][:-1]
        lon = sum(x for x, _ in ring) / len(ring)
        lat = sum(y for _, y in ring) / len(ring)
        score = (p["offset_f"] + 3) * 1.5 + p["no_vehicle_pct"] * .4 + p["poverty_pct"] * .3 + (5 if p["median_age"] > 40 else 0)
        out.append({
            "census_tract": p["geo_id"],
            "coordinates": {"latitude": round(lat, 4), "longitude": round(lon, 4)},
            "predicted_temp_offset_f": p["offset_f"],
            "composite_vulnerability_score": round(score, 2),
            "population": p["population"],
            "median_age": p["median_age"],
            "median_income": None,
            "poverty_rate_pct": p["poverty_pct"],
            "no_vehicle_rate_pct": p["no_vehicle_pct"],
            "key_heat_drivers": ["mock_feature_a (+0.00°F)", "mock_feature_b (+0.00°F)"],
            "google_maps_link": f"https://www.google.com/maps/search/?api=1&query={lat:.4f},{lon:.4f}",
            "walking_directions_link": f"https://www.google.com/maps/dir/?api=1&destination={lat:.4f},{lon:.4f}&travelmode=walking",
        })
    out.sort(key=lambda c: -c["composite_vulnerability_score"])
    for i, c in enumerate(out[:10], 1):
        c["rank"] = i
    return out[:10]


def _spread(candidates, count, min_km):
    # Load siting.py by path: importing the agent package would start BigQuery.
    path = os.path.join(AGENTS_DIR, APP_NAME, "siting.py")
    spec = importlib.util.spec_from_file_location("heat_siting", path)
    siting = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(siting)
    return siting.spread_sites(candidates, count, min_km)


def _mock_audit(ids: List[str]) -> Dict[str, Any]:
    props = [f["properties"] for f in _mock_tracts()["features"]]
    chosen = [p for p in props if p["geo_id"] in ids] or props[:1]

    def avg(rows, k):
        return round(sum(r[k] for r in rows) / len(rows), 1)

    city_pov, rec_pov = avg(props, "poverty_pct"), avg(chosen, "poverty_pct")
    city_car, rec_car = avg(props, "no_vehicle_pct"), avg(chosen, "no_vehicle_pct")
    ok = rec_pov >= city_pov and rec_car >= city_car
    return {
        "num_tracts_evaluated": len(chosen),
        "total_population_served": sum(p["population"] for p in chosen),
        "comparison_table": {
            "metric": ["Poverty Rate", "No-Vehicle Rate", "Median Household Income", "Median Age"],
            "recommended_sites_avg": [f"{rec_pov}%", f"{rec_car}%", "N/A", f"{avg(chosen, 'median_age')} yrs"],
            "citywide_average": [f"{city_pov}%", f"{city_car}%", "N/A", f"{avg(props, 'median_age')} yrs"],
        },
        "equity_ratio": {
            "poverty_exposure_multiplier": round(rec_pov / city_pov, 2),
            "transit_dependent_multiplier": round(rec_car / city_car, 2),
        },
        "audit_verdict": ("PASS: Recommendations equitably prioritize high-vulnerability populations."
                          if ok else "NOTE: Recommended tracts have lower vulnerability than city average."),
    }


# ---------------------------------------------------------------- public API

def tracts() -> Dict[str, Any]:
    return _cached("tracts", _mock_tracts if MOCK else _real_tracts)


def sites(count: int) -> Dict[str, Any]:
    if MOCK:
        return _spread(_mock_candidates(), count, MIN_SPACING_KM)
    return _cached(f"sites:{count}", lambda: _tools().select_cooling_center_sites(count, MIN_SPACING_KM))


def audit(ids: List[str]) -> Dict[str, Any]:
    if MOCK:
        return _mock_audit(ids)
    return _tools().audit_equity(ids)


def frequency(threshold: float) -> Dict[str, Any]:
    if MOCK:
        return {"threshold_f": threshold, "average_annual_days_above_threshold": None,
                "note": "Mock mode: station history not loaded."}
    return _cached(f"freq:{threshold}", lambda: _tools().analyze_heat_frequency(threshold))
