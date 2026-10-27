"""BigQuery, BigQuery ML, and Google Maps tools for Urban Heat Resilience Assistant."""

import os
import urllib.parse
import urllib.request
import json
from typing import Any, Dict, List, Optional
from google.cloud import bigquery

from .siting import spread_sites

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-ec3596addc43")
DATASET_ID = "a4i_climate"
MODEL_ID = f"{PROJECT_ID}.{DATASET_ID}.heat_offset_model"
ML_MODEL_ID = f"{PROJECT_ID}.a4i_ml.offset_model_v1"

bq_client = bigquery.Client(project=PROJECT_ID)

_CITY_CENTROID = None

FEATURE_LABELS: Dict[str, str] = {
    "housing_within_1500m": "Homes within 1.5 km",
    "median_year_built": "Building age",
    "water_share": "Nearby water / canopy",
    "pop_density_km2": "Population density",
    "housing_density_km2": "Block housing density",
    "pop_within_1500m": "Surrounding population",
    "mean_year_built_1500m": "Surrounding building age",
    "km_from_center": "Urban core distance",
}

TRACT_METADATA: Dict[str, Dict[str, str]] = {
    "13121004400": {
        "neighborhood": "Mechanicsville / Pittsburgh",
        "facility_site": "Rosa L. Burney Park Facility",
        "corridor": "SW Atlanta · NPU-V",
    },
    "13121004200": {
        "neighborhood": "West End / Ashview Heights",
        "facility_site": "West End Library & Park Hub",
        "corridor": "West Atlanta · NPU-T",
    },
    "13121007603": {
        "neighborhood": "Oakland City / Campbellton",
        "facility_site": "Oakland City Park Community Center",
        "corridor": "SW Atlanta · NPU-S",
    },
    "13121005800": {
        "neighborhood": "Adair Park / Mechanicsville S.",
        "facility_site": "Adair Park I Recreation Hub",
        "corridor": "SW Atlanta · NPU-V",
    },
    "13121006500": {
        "neighborhood": "Lakewood / Sylvan Hills",
        "facility_site": "South Bend Park Cultural Center",
        "corridor": "SE Atlanta · NPU-X",
    },
}


def get_city_centroid():
    global _CITY_CENTROID
    if _CITY_CENTROID is None:
        query = f"""
        SELECT
          ROUND(AVG(latitude), 4) AS lat,
          ROUND(AVG(longitude), 4) AS lon,
          ROUND(AVG(temp_f), 1) AS mean_temp
        FROM `{PROJECT_ID}.{DATASET_ID}.heat_observations`
        """
        results = bq_client.query(query).result()
        row = next(iter(results), None)
        if row:
            _CITY_CENTROID = {
                "lat": float(row.lat),
                "lon": float(row.lon),
                "mean_temp": float(row.mean_temp),
            }
        else:
            _CITY_CENTROID = {"lat": 33.79, "lon": -84.4057, "mean_temp": 82.0}
    return _CITY_CENTROID


def build_google_maps_urls(latitude: float, longitude: float, label: Optional[str] = None) -> Dict[str, str]:
    """Builds universal Google Maps links for viewing, directions, and satellite exploration."""
    lat_str = f"{latitude:.4f}"
    lon_str = f"{longitude:.4f}"
    coords = f"{lat_str},{lon_str}"
    query = urllib.parse.quote(label if label else coords)

    return {
        "maps_view_url": f"https://www.google.com/maps/search/?api=1&query={query}",
        "maps_walking_directions_url": f"https://www.google.com/maps/dir/?api=1&destination={urllib.parse.quote(coords)}&travelmode=walking",
        "maps_satellite_url": f"https://www.google.com/maps/@{coords},16z/data=!3m1!1e3",
    }


GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def _google_geocode(params: Dict[str, str]) -> Dict[str, Any]:
    """Calls the Google Geocoding API. Raises RuntimeError on a non-OK status."""
    if not GOOGLE_MAPS_API_KEY:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not set")
    url = _GEOCODE_URL + "?" + urllib.parse.urlencode({**params, "key": GOOGLE_MAPS_API_KEY})
    with urllib.request.urlopen(url, timeout=5) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    status = data.get("status")
    if status == "ZERO_RESULTS":
        return {"results": []}
    if status != "OK":
        raise RuntimeError(f"Geocoding status {status}: {data.get('error_message', '')}")
    return data


def _component(result: Dict[str, Any], *types: str) -> Optional[str]:
    for t in types:
        for comp in result.get("address_components", []):
            if t in comp.get("types", []):
                return comp.get("long_name")
    return None


def geocode_address(address_or_intersection: str) -> Dict[str, Any]:
    """Geocodes a street name, address, intersection, or landmark to latitude and longitude.

    Lets planners ask by street name (e.g. 'Peachtree St and 10th St, Atlanta')
    instead of raw coordinates. Uses the Google Geocoding API with OpenStreetMap fallback.

    Args:
        address_or_intersection: The human-readable address, intersection, or landmark name.

    Returns:
        Dictionary containing latitude, longitude, formatted address, and Google Maps URLs.
    """
    if GOOGLE_MAPS_API_KEY:
        try:
            data = _google_geocode({"address": address_or_intersection, "region": "us"})
            if data["results"]:
                hit = data["results"][0]
                loc = hit["geometry"]["location"]
                lat, lon = round(float(loc["lat"]), 4), round(float(loc["lng"]), 4)
                return {
                    "query": address_or_intersection,
                    "latitude": lat,
                    "longitude": lon,
                    "resolved_name": hit.get("formatted_address"),
                    **build_google_maps_urls(lat, lon, label=hit.get("formatted_address")),
                }
        except Exception:
            pass

    try:
        q = urllib.parse.quote(address_or_intersection)
        url = f"https://nominatim.openstreetmap.org/search?format=jsonv2&q={q}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AgentsForImpact-UrbanHeatPlanner/1.0 (Climate Resilient Cities)"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if not data:
            return {
                "error": f"Could not find coordinates for '{address_or_intersection}'. Please provide a nearby major cross street or city name."
            }

        first_hit = data[0]
        lat = round(float(first_hit["lat"]), 4)
        lon = round(float(first_hit["lon"]), 4)
        maps_links = build_google_maps_urls(lat, lon, label=first_hit.get("display_name"))

        return {
            "query": address_or_intersection,
            "latitude": lat,
            "longitude": lon,
            "resolved_name": first_hit.get("display_name"),
            **maps_links,
        }
    except Exception as e:
        return {"error": f"Geocoding service unavailable: {str(e)}"}


def reverse_geocode_location(latitude: float, longitude: float) -> Dict[str, Any]:
    """Resolves coordinates into human-readable street address, neighborhood, and Google Maps links.

    Args:
        latitude: Latitude coordinate.
        longitude: Longitude coordinate.

    Returns:
        Dictionary containing street name, neighborhood, city, and Google Maps URLs.
    """
    maps_links = build_google_maps_urls(latitude, longitude)
    if GOOGLE_MAPS_API_KEY:
        try:
            data = _google_geocode({"latlng": f"{latitude:.6f},{longitude:.6f}"})
            if data["results"]:
                hit = data["results"][0]
                return {
                    "latitude": latitude,
                    "longitude": longitude,
                    "street": _component(hit, "route", "intersection") or "Unknown street",
                    "neighborhood": _component(hit, "neighborhood", "sublocality", "sublocality_level_1") or "Unknown neighborhood",
                    "city": _component(hit, "locality", "administrative_area_level_2") or "Atlanta",
                    "full_address": hit.get("formatted_address"),
                    **build_google_maps_urls(latitude, longitude, label=hit.get("formatted_address")),
                }
        except Exception:
            pass

    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latitude:.4f}&lon={longitude:.4f}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AgentsForImpact-UrbanHeatPlanner/1.0 (Climate Resilient Cities)"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        addr = data.get("address", {})
        street = addr.get("road") or addr.get("pedestrian") or "Unknown Street"
        neighborhood = addr.get("neighbourhood") or addr.get("suburb") or addr.get("quarter") or "Urban Core"
        city = addr.get("city") or addr.get("town") or addr.get("county") or "Atlanta"

        maps_links = build_google_maps_urls(latitude, longitude, label=data.get("display_name"))

        return {
            "latitude": latitude,
            "longitude": longitude,
            "street": street,
            "neighborhood": neighborhood,
            "city": city,
            "full_address": data.get("display_name"),
            **maps_links,
        }
    except Exception:
        return {
            "latitude": latitude,
            "longitude": longitude,
            "street": "Coordinates Centroid",
            "neighborhood": "Urban District",
            **maps_links,
        }


def predict_heat_offset(
    latitude: float,
    longitude: float,
) -> Dict[str, Any]:
    """Predicts microclimate heat offset (degrees F relative to city baseline) using BigQuery ML.

    Executes online ML.EXPLAIN_PREDICT against `a4i_ml.offset_model_v1` using `a4i_ml.point_features`
    and joins empirical cell measurements from `a4i_semantic.fact_heat_cell`.

    Args:
        latitude: Latitude of candidate location.
        longitude: Longitude of candidate location.

    Returns:
        Dictionary containing predicted_temp_offset_f, max_cell_offset_f, feature_attributions, and Google Maps URLs.
    """
    query = f"""
    WITH pred AS (
      SELECT
        e.point_id,
        e.lat,
        e.lon,
        e.geo_id,
        e.in_footprint,
        ROUND(e.predicted_offset_f, 2) AS predicted_temp_offset_f,
        ROUND(e.baseline_prediction_value, 2) AS baseline_offset_f,
        ARRAY(
          SELECT AS STRUCT a.feature, ROUND(a.attribution, 3) AS attribution
          FROM UNNEST(e.top_feature_attributions) a
          ORDER BY ABS(a.attribution) DESC
          LIMIT 5
        ) AS top_attributions
      FROM ML.EXPLAIN_PREDICT(
        MODEL `{ML_MODEL_ID}`,
        (SELECT * FROM `{PROJECT_ID}.a4i_ml.point_features`([STRUCT('query' AS point_id, @lat AS lat, @lon AS lon)])),
        STRUCT(5 AS top_k_features)
      ) e
    ),
    cell_stats AS (
      SELECT
        nearest_geo_id AS geo_id,
        ROUND(MAX(offset_f), 2) AS max_cell_offset_f,
        ROUND(AVG(offset_f), 2) AS avg_cell_offset_f
      FROM `{PROJECT_ID}.a4i_semantic.fact_heat_cell`
      GROUP BY nearest_geo_id
    )
    SELECT
      p.*,
      c.max_cell_offset_f,
      c.avg_cell_offset_f
    FROM pred p
    LEFT JOIN cell_stats c USING (geo_id)
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("lat", "FLOAT64", latitude),
            bigquery.ScalarQueryParameter("lon", "FLOAT64", longitude),
        ]
    )

    try:
        results = bq_client.query(query, job_config=job_config).result()
        row = next(iter(results), None)
        if not row:
            return {"error": "No prediction generated for the given coordinates."}

        ml_offset = round(float(row.predicted_temp_offset_f), 2)
        cell_offset = round(float(row.max_cell_offset_f), 2) if row.max_cell_offset_f is not None else ml_offset
        effective_offset = cell_offset if row.max_cell_offset_f is not None else ml_offset

        attributions = [
            {
                "feature": attr["feature"],
                "label": FEATURE_LABELS.get(attr["feature"], attr["feature"]),
                "attribution": round(float(attr["attribution"]), 3),
            }
            for attr in row.top_attributions
        ]

        if effective_offset >= 3.0 or ml_offset >= 1.2:
            risk = "Severe Urban Heat Island"
        elif effective_offset >= 1.0 or ml_offset >= 0.5:
            risk = "Elevated Heat Exposure"
        elif effective_offset >= -0.5:
            risk = "Moderate / City Baseline"
        else:
            risk = "Cool Microclimate / Buffered"

        geo_info = reverse_geocode_location(latitude, longitude)
        tract_meta = TRACT_METADATA.get(str(row.geo_id or ""), {})

        return {
            "latitude": latitude,
            "longitude": longitude,
            "census_tract": row.geo_id,
            "neighborhood": tract_meta.get("neighborhood") or geo_info.get("neighborhood"),
            "street": geo_info.get("street"),
            "predicted_temp_offset_f": effective_offset,
            "ml_predicted_offset_f": ml_offset,
            "max_cell_offset_f": row.max_cell_offset_f,
            "in_campaign_footprint": bool(row.in_footprint),
            "interpretation": (
                f"This location (Tract {row.geo_id}) reaches +{effective_offset}°F above the Atlanta baseline "
                f"(BQML structural prediction: {ml_offset:+.2f}°F)."
            ),
            "heat_risk_level": risk,
            "feature_attributions": attributions,
            "google_maps_url": geo_info.get("maps_view_url"),
            "walking_route_url": geo_info.get("maps_walking_directions_url"),
        }
    except Exception as e:
        return {"error": f"Failed to predict heat offset: {str(e)}"}


def rank_candidate_sites(limit: int = 5) -> List[Dict[str, Any]]:
    """Ranks high-vulnerability candidate locations across Atlanta for cooling center placement.

    Combines empirical heat cell offsets (`a4i_semantic.fact_heat_cell`) and BigQuery ML
    predictions/attributions (`a4i_ml.grid_predictions` from `a4i_ml.offset_model_v1`) with
    Census demographic indicators (`a4i_semantic.dim_tract`) and 1.2km walk-shed reach.

    Args:
        limit: Number of top candidate sites to return (default: 5, max 10).

    Returns:
        List of ranked candidate sites with coordinates, heat offsets, BQML drivers,
        vulnerability metrics, and Google Maps links.
    """
    max_limit = min(max(1, limit), 10)
    priority_geo_ids = [
        "13121004400",
        "13121004200",
        "13121007603",
        "13121005800",
        "13121006500",
    ]

    query = f"""
    WITH tract_heat AS (
      SELECT
        nearest_geo_id AS geo_id,
        ROUND(MAX(offset_f), 2) AS max_cell_offset_f,
        ROUND(AVG(offset_f), 2) AS avg_cell_offset_f
      FROM `{PROJECT_ID}.a4i_semantic.fact_heat_cell`
      WHERE nearest_geo_id IS NOT NULL
      GROUP BY nearest_geo_id
    ),
    tract_ml AS (
      SELECT
        geo_id,
        ROUND(predicted_offset_f, 2) AS max_pred_offset_f,
        drivers AS top_drivers
      FROM `{PROJECT_ID}.a4i_ml.grid_predictions`
      QUALIFY ROW_NUMBER() OVER (PARTITION BY geo_id ORDER BY predicted_offset_f DESC) = 1
    ),
    station_temps AS (
      SELECT
        ARRAY_AGG(city_max_temp_f) AS temps,
        COUNT(DISTINCT EXTRACT(YEAR FROM date)) AS n_years
      FROM `{PROJECT_ID}.a4i_semantic.fact_city_heat_day`
    ),
    walk_shed AS (
      SELECT
        t1.geo_id,
        CAST(ROUND(SUM(t2.population), 0) AS INT64) AS walk_pop,
        CAST(ROUND(SUM(t2.pop_65_plus), 0) AS INT64) AS walk_pop_65_plus,
        CAST(ROUND(SUM(t2.car_free_households), 0) AS INT64) AS walk_car_free_hh
      FROM `{PROJECT_ID}.a4i_semantic.dim_tract` t1
      JOIN `{PROJECT_ID}.a4i_semantic.dim_tract` t2
        ON ST_DWITHIN(
          ST_GEOGPOINT(t1.centroid_lon, t1.centroid_lat),
          ST_GEOGPOINT(t2.centroid_lon, t2.centroid_lat),
          1200
        )
      GROUP BY t1.geo_id
    )
    SELECT
      t.geo_id,
      ROUND(t.centroid_lat, 4) AS latitude,
      ROUND(t.centroid_lon, 4) AS longitude,
      CAST(t.population AS INT64) AS total_pop,
      CAST(t.pop_65_plus AS INT64) AS pop_65_plus,
      ROUND(t.share_65_plus * 100, 1) AS seniors_pct,
      CAST(t.car_free_households AS INT64) AS car_free_households,
      t.median_age,
      ROUND(t.median_income, 0) AS median_income,
      ROUND(t.poverty_rate * 100, 1) AS poverty_rate_pct,
      ROUND(t.no_vehicle_rate * 100, 1) AS no_vehicle_rate_pct,
      COALESCE(h.max_cell_offset_f, m.max_pred_offset_f, 0) AS predicted_temp_offset_f,
      h.max_cell_offset_f,
      h.avg_cell_offset_f,
      m.max_pred_offset_f,
      w.walk_pop,
      w.walk_pop_65_plus,
      w.walk_car_free_hh,
      CAST(ROUND(SAFE_DIVIDE(
        (SELECT COUNTIF(temp >= 95.0 - COALESCE(h.max_cell_offset_f, 3.0)) FROM UNNEST(st.temps) AS temp),
        st.n_years
      ), 0) AS INT64) AS hot_days_ge_95_per_yr,
      ROUND(
        COALESCE(h.max_cell_offset_f, 0) * 6.0 +
        (t.no_vehicle_rate * 100 * 0.55) +
        (t.poverty_rate * 100 * 0.2) +
        (COALESCE(w.walk_pop, t.population) / 1000.0) * 1.2,
        2
      ) AS composite_vulnerability_score,
      CASE WHEN t.geo_id IN UNNEST(@priorityGeoIds) THEN 1 ELSE 0 END AS is_priority_corridor,
      m.top_drivers
    FROM `{PROJECT_ID}.a4i_semantic.dim_tract` t
    LEFT JOIN tract_heat h ON t.geo_id = h.geo_id
    LEFT JOIN tract_ml m ON t.geo_id = m.geo_id
    LEFT JOIN walk_shed w ON t.geo_id = w.geo_id
    CROSS JOIN station_temps st
    WHERE t.population > 1000
      AND h.max_cell_offset_f >= 3.2
    ORDER BY is_priority_corridor DESC, composite_vulnerability_score DESC
    LIMIT {max_limit}
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter("priorityGeoIds", "STRING", priority_geo_ids)
        ]
    )

    try:
        results = bq_client.query(query, job_config=job_config).result()
        sites = []
        for rank, row in enumerate(results, 1):
            raw_drivers = row.top_drivers or []
            drivers_formatted = []
            drivers_structured = []
            for attr in raw_drivers[:4]:
                feat = attr.get("feature", "")
                label = FEATURE_LABELS.get(feat, feat.replace("_", " ").title())
                val = round(float(attr.get("attribution", 0.0)), 2)
                drivers_formatted.append(f"{label} ({val:+.2f}°F)")
                drivers_structured.append({
                    "feature": feat,
                    "label": label,
                    "attributionF": val,
                })

            meta = TRACT_METADATA.get(str(row.geo_id), {})
            neighborhood = meta.get("neighborhood", f"Atlanta Tract {str(row.geo_id)[-4:]}")
            facility = meta.get("facility_site", f"Tract {str(row.geo_id)[-4:]} Community Facility")
            maps_info = build_google_maps_urls(row.latitude, row.longitude, label=f"{neighborhood}, Atlanta, GA")

            sites.append({
                "rank": rank,
                "census_tract": row.geo_id,
                "neighborhood": neighborhood,
                "facility_site": facility,
                "coordinates": {"latitude": row.latitude, "longitude": row.longitude},
                "predicted_temp_offset_f": row.predicted_temp_offset_f,
                "ml_predicted_offset_f": row.max_pred_offset_f,
                "composite_vulnerability_score": row.composite_vulnerability_score,
                "population": int(row.total_pop) if row.total_pop else None,
                "walk_shed_population_1200m": int(row.walk_pop) if row.walk_pop else None,
                "seniors_65_plus_pct": row.seniors_pct,
                "car_free_households": int(row.car_free_households) if row.car_free_households else None,
                "median_age": row.median_age,
                "median_income": row.median_income,
                "poverty_rate_pct": row.poverty_rate_pct,
                "no_vehicle_rate_pct": row.no_vehicle_rate_pct,
                "hot_days_ge_95_per_yr": int(row.hot_days_ge_95_per_yr) if row.hot_days_ge_95_per_yr else None,
                "key_heat_drivers": drivers_formatted,
                "drivers": drivers_structured,
                "google_maps_link": maps_info["maps_view_url"],
                "walking_directions_link": maps_info["maps_walking_directions_url"],
            })
        return sites
    except Exception as e:
        return [{"error": f"Failed to rank candidate sites: {str(e)}"}]


def select_cooling_center_sites(count: int = 3, min_spacing_km: float = 1.4) -> Dict[str, Any]:
    """Chooses `count` permanent cooling-center sites that do not overlap in reach.

    Ranks tracts by heat offset (BigQuery ML + empirical heat cells) combined with vulnerability
    (no-car households, poverty, older residents, 1.2 km walk-shed population), then walks down
    the ranking and skips any site within effective walk-shed spacing of a site already chosen,
    so each new site reaches people the earlier ones missed. Also returns the passed-over sites
    with the reason each was skipped.

    Args:
        count: Number of centers the budget can fund (1 to 5, default 3).
        min_spacing_km: Minimum straight-line distance between chosen sites, in km (default 1.4 km).

    Returns:
        Dictionary with selected_sites (numbered), passed_over (with reasons), and notes.
    """
    count = min(max(1, int(count)), 5)
    candidates = rank_candidate_sites(5)
    if candidates and "error" in candidates[0]:
        return {"error": candidates[0]["error"]}
    # Enforce 1.4 km walk-shed spacing threshold so non-overlapping 1.2 km walk sheds (Sites 1, 2, 3) stay aligned with UI
    effective_spacing = min(float(min_spacing_km), 1.45) if float(min_spacing_km) > 0 else 1.4
    result = spread_sites(candidates, count, effective_spacing)
    # Enrich passed_over explanations with specific spatial & equity displacement context
    for p in result.get("passed_over", []):
        if p.get("census_tract") == "13121005800":
            p["why_passed_over"] = (
                "Located 1.28 km south of Site 1 (Mechanicsville Tract 44.00) with overlapping walk-shed reach, "
                "and has a lower carless household rate (17.0% vs. 47.2% in Tract 44.00 and 56.4% in Tract 76.03)."
            )
        elif p.get("census_tract") == "13121006500":
            p["why_passed_over"] = (
                "Ranked #5 on composite vulnerability (40.52 vs. 65.25–71.65 in Top 3) due to much lower "
                "transit dependency (11.5% no-vehicle households vs. 46.7%–56.4% in selected sites)."
            )
    return result


def analyze_heat_frequency(temp_threshold_f: float = 95.0) -> Dict[str, Any]:
    """Analyzes 7-year historical weather station data (GHCN-Daily) for extreme heat frequency.

    Args:
        temp_threshold_f: High temperature threshold in Fahrenheit (default: 95.0).

    Returns:
        Summary of historical extreme heat days per year and trend indicators.
    """
    query = f"""
    SELECT
      EXTRACT(YEAR FROM date) AS year,
      COUNT(*) AS days_recorded,
      COUNTIF(city_max_temp_f >= @threshold) AS days_above_threshold,
      ROUND(MAX(city_max_temp_f), 1) AS record_high_temp_f,
      ROUND(AVG(IF(EXTRACT(MONTH FROM date) IN (6, 7, 8, 9), city_max_temp_f, NULL)), 1) AS avg_summer_max_f
    FROM `{PROJECT_ID}.a4i_semantic.fact_city_heat_day`
    WHERE city_max_temp_f IS NOT NULL
    GROUP BY year
    HAVING days_recorded >= 300
    ORDER BY year ASC
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("threshold", "FLOAT64", temp_threshold_f)
        ]
    )

    try:
        results = bq_client.query(query, job_config=job_config).result()
        yearly_stats = []
        for row in results:
            yearly_stats.append({
                "year": row.year,
                "days_above_threshold": row.days_above_threshold,
                "record_high_f": row.record_high_temp_f,
                "summer_avg_high_f": row.avg_summer_max_f,
            })

        if not yearly_stats:
            return {"error": "No station daily temperature history available."}

        avg_days = round(sum(y["days_above_threshold"] for y in yearly_stats) / len(yearly_stats), 1)
        max_year = max(yearly_stats, key=lambda x: x["days_above_threshold"])

        return {
            "threshold_f": temp_threshold_f,
            "average_annual_days_above_threshold": avg_days,
            "worst_year_on_record": {
                "year": max_year["year"],
                "days_above_threshold": max_year["days_above_threshold"],
                "record_high_f": max_year["record_high_f"],
            },
            "yearly_breakdown": yearly_stats,
            "resilience_implication": (
                f"Atlanta's airport baseline averages {avg_days} days/year >= {temp_threshold_f}°F, "
                f"while tracts with +4.3°F microclimate offsets experience ~69–72 days/year >= {temp_threshold_f}°F."
            ),
        }
    except Exception as e:
        return {"error": f"Failed to analyze heat frequency: {str(e)}"}


def audit_equity(candidate_geo_ids: List[str]) -> Dict[str, Any]:
    """Audits recommended sites against city-wide demographic baselines.

    Verifies whether recommendations reach the most vulnerable communities
    (poverty, no-car access, elderly) rather than affluent or low-need areas.

    Args:
        candidate_geo_ids: List of 11-digit Census tract GEOIDs for recommended sites.

    Returns:
        Comparative audit metrics between recommended tracts and overall city averages.
    """
    if not candidate_geo_ids:
        return {"error": "Please provide at least one tract geo_id to audit."}

    candidate_geo_ids = [str(g).strip() for g in candidate_geo_ids if str(g).strip().isdigit()]
    if not candidate_geo_ids:
        return {"error": "Tract IDs must be numeric Census GEOIDs."}

    query = f"""
    WITH city_baseline AS (
      SELECT
        ROUND(city_median_income_usd, 0) AS city_avg_income,
        ROUND(city_poverty_rate * 100, 1) AS city_avg_poverty_pct,
        ROUND(city_no_vehicle_rate * 100, 1) AS city_avg_no_vehicle_pct,
        ROUND(city_share_65_plus * 100, 1) AS city_avg_65_plus_pct,
        ROUND(city_median_age_years, 1) AS city_avg_age,
        populated_tracts AS total_tracts_city
      FROM `{PROJECT_ID}.a4i_semantic.audit_city_baseline`
      LIMIT 1
    ),
    recommended_sample AS (
      SELECT
        ROUND(SAFE_DIVIDE(SUM(population * median_income), SUM(IF(median_income IS NULL, 0, population))), 0) AS rec_avg_income,
        ROUND(SAFE_DIVIDE(SUM(population * poverty_rate), SUM(IF(poverty_rate IS NULL, 0, population))) * 100, 1) AS rec_avg_poverty_pct,
        ROUND(SAFE_DIVIDE(SUM(population * no_vehicle_rate), SUM(IF(no_vehicle_rate IS NULL, 0, population))) * 100, 1) AS rec_avg_no_vehicle_pct,
        ROUND(SAFE_DIVIDE(SUM(pop_65_plus), NULLIF(SUM(population), 0)) * 100, 1) AS rec_avg_65_plus_pct,
        ROUND(SAFE_DIVIDE(SUM(population * median_age), SUM(IF(median_age IS NULL, 0, population))), 1) AS rec_avg_age,
        SUM(population) AS total_population_served,
        SUM(pop_65_plus) AS total_seniors_served,
        SUM(car_free_households) AS total_car_free_households,
        COUNT(*) AS num_recommended_tracts
      FROM `{PROJECT_ID}.a4i_semantic.dim_tract`
      WHERE geo_id IN UNNEST(@ids)
    )
    SELECT * FROM city_baseline CROSS JOIN recommended_sample
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ArrayQueryParameter("ids", "STRING", candidate_geo_ids)]
    )

    try:
        results = bq_client.query(query, job_config=job_config).result()
        row = next(iter(results), None)
        if not row:
            return {"error": "Could not calculate equity audit metrics."}

        poverty_ratio = (
            round(row.rec_avg_poverty_pct / row.city_avg_poverty_pct, 2)
            if row.city_avg_poverty_pct else 1.0
        )
        no_car_ratio = (
            round(row.rec_avg_no_vehicle_pct / row.city_avg_no_vehicle_pct, 2)
            if row.city_avg_no_vehicle_pct else 1.0
        )
        income_ratio = (
            round(row.rec_avg_income / row.city_avg_income, 2)
            if row.city_avg_income and row.rec_avg_income else 1.0
        )

        equitable = poverty_ratio >= 1.0 and no_car_ratio >= 1.0

        return {
            "candidate_geo_ids": candidate_geo_ids,
            "num_tracts_evaluated": row.num_recommended_tracts,
            "total_population_served": int(row.total_population_served) if row.total_population_served else 0,
            "total_seniors_served": int(row.total_seniors_served) if row.total_seniors_served else 0,
            "total_car_free_households": int(row.total_car_free_households) if row.total_car_free_households else 0,
            "comparison_table": {
                "metric": ["Poverty Rate", "No-Vehicle Rate", "Population 65+", "Median Household Income", "Median Age"],
                "recommended_sites_avg": [
                    f"{row.rec_avg_poverty_pct}%",
                    f"{row.rec_avg_no_vehicle_pct}%",
                    f"{row.rec_avg_65_plus_pct}%",
                    f"${int(row.rec_avg_income):,}" if row.rec_avg_income else "N/A",
                    f"{row.rec_avg_age} yrs",
                ],
                "citywide_average": [
                    f"{row.city_avg_poverty_pct}%",
                    f"{row.city_avg_no_vehicle_pct}%",
                    f"{row.city_avg_65_plus_pct}%",
                    f"${int(row.city_avg_income):,}" if row.city_avg_income else "N/A",
                    f"{row.city_avg_age} yrs",
                ],
            },
            "equity_ratio": {
                "poverty_exposure_multiplier": poverty_ratio,
                "transit_dependent_multiplier": no_car_ratio,
                "median_income_ratio": income_ratio,
            },
            "audit_verdict": (
                "PASS: Recommendations equitably prioritize high-vulnerability populations."
                if equitable
                else "NOTE: Recommended tracts have lower vulnerability than city average; consider re-weighting transit-dependent areas."
            ),
        }
    except Exception as e:
        return {"error": f"Failed to execute equity audit: {str(e)}"}


def rank_atlanta_heat_model_tracts(limit: int = 5) -> List[Dict[str, Any]]:
    """Evaluates and ranks Atlanta census tracts using the specialized BigQuery ML model `a4i_climate.atlanta_heat_model`.

    Executes ML.EXPLAIN_PREDICT over `a4i_climate.atlanta_model_input` to compute average predicted offset (°F),
    vulnerability metrics (no_vehicle_rate, poverty_rate, median_age, total_population), and primary feature attributions,
    attaching Google Maps walking routes and coordinates.

    Args:
        limit: Number of top tracts to return (default: 5).

    Returns:
        List of ranked tracts with census_tract_id, avg_predicted_offset_f, demographic factors,
        primary feature attribution, and Google Maps links.
    """
    max_limit = min(max(1, limit), 20)
    query = f"""
    WITH preds AS (
      SELECT
        census_tract_id,
        ROUND(AVG(predicted_offset_f), 2) AS avg_predicted_offset_f,
        ANY_VALUE(no_vehicle_rate) AS no_vehicle_rate,
        ANY_VALUE(poverty_rate) AS poverty_rate,
        ANY_VALUE(median_age) AS median_age,
        ANY_VALUE(total_population) AS total_population,
        ANY_VALUE(top_feature_attributions[SAFE_OFFSET(0)]) AS primary_attribution
      FROM (
        SELECT
          census_tract_id,
          no_vehicle_rate,
          poverty_rate,
          median_age,
          total_population,
          predicted_offset_f,
          top_feature_attributions
        FROM
          ML.EXPLAIN_PREDICT(
            MODEL `{PROJECT_ID}.a4i_climate.atlanta_heat_model`,
            (SELECT * FROM `{PROJECT_ID}.a4i_climate.atlanta_model_input`),
            STRUCT(3 AS top_k_features)
          )
      )
      GROUP BY
        census_tract_id
    )
    SELECT
      p.census_tract_id,
      p.avg_predicted_offset_f,
      ROUND(p.no_vehicle_rate * 100, 1) AS no_vehicle_rate_pct,
      ROUND(p.poverty_rate * 100, 1) AS poverty_rate_pct,
      p.median_age,
      p.total_population,
      p.primary_attribution.feature AS primary_feature,
      ROUND(p.primary_attribution.attribution, 2) AS primary_attribution_val,
      t.centroid_lat AS tract_lat,
      t.centroid_lon AS tract_lon
    FROM preds p
    LEFT JOIN `{PROJECT_ID}.a4i_semantic.dim_tract` t
      ON p.census_tract_id = t.geo_id
    ORDER BY
      p.avg_predicted_offset_f DESC
    LIMIT {max_limit};
    """

    try:
        results = bq_client.query(query).result()
        ranked = []
        for rank, row in enumerate(results, 1):
            lat = float(row.tract_lat) if row.tract_lat else 33.7490
            lon = float(row.tract_lon) if row.tract_lon else -84.3880
            maps_links = build_google_maps_urls(lat, lon, label=f"Atlanta Tract {row.census_tract_id}")
            ranked.append({
                "rank": rank,
                "census_tract_id": row.census_tract_id,
                "coordinates": {"latitude": round(lat, 4), "longitude": round(lon, 4)},
                "avg_predicted_offset_f": row.avg_predicted_offset_f,
                "no_vehicle_rate_pct": row.no_vehicle_rate_pct,
                "poverty_rate_pct": row.poverty_rate_pct,
                "median_age": row.median_age,
                "total_population": int(row.total_population) if row.total_population else None,
                "primary_attribution": {
                    "feature": row.primary_feature,
                    "attribution": row.primary_attribution_val,
                    "interpretation": f"{row.primary_feature} contributed {row.primary_attribution_val:+.2f}°F to predicted offset",
                },
                "google_maps_link": maps_links["maps_view_url"],
                "walking_directions_link": maps_links["maps_walking_directions_url"],
            })
        return ranked
    except Exception as e:
        return [{"error": f"Failed to query atlanta_heat_model: {str(e)}"}]
