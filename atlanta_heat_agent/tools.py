import os
from typing import Any, Dict, List
from google.cloud import bigquery
import urllib.parse

PROJECT_ID = os.environ.get("PROJECT_ID", "qwiklabs-gcp-04-ec3596addc43")
bq_client = bigquery.Client(project=PROJECT_ID)

def build_google_maps_urls(latitude: float, longitude: float, label: str = "Location") -> Dict[str, str]:
    """Generates Google Maps deep-links for location inspection and pedestrian routes."""
    encoded_query = urllib.parse.quote(f"{latitude},{longitude}")
    return {
        "maps_view_url": f"https://www.google.com/maps/search/?api=1&query={encoded_query}",
        "maps_walking_directions_url": f"https://www.google.com/maps/dir/?api=1&destination={encoded_query}&travelmode=walking",
        "maps_satellite_url": f"https://www.google.com/maps/@{latitude},{longitude},16z/data=!3m1!1e3",
    }

def explain_atlanta_heat_model_tracts(limit: int = 5) -> List[Dict[str, Any]]:
    """Executes ML.EXPLAIN_PREDICT with `a4i_climate.atlanta_heat_model` to rank Atlanta census tracts by predicted temperature offset.

    Returns census tract IDs, average predicted temperature offset (°F), zero-vehicle rate, poverty rate,
    median age, total population, primary feature attribution driver, and Google Maps walking route links.

    Args:
        limit: Number of top tracts to return (default: 5).

    Returns:
        List of ranked tracts with model explanation metrics.
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
      ROUND(COALESCE(t.no_vehicle_rate, p.no_vehicle_rate) * 100, 1) AS no_vehicle_rate_pct,
      ROUND(COALESCE(t.poverty_rate, p.poverty_rate) * 100, 1) AS poverty_rate_pct,
      ROUND(COALESCE(t.share_65_plus, 0.145) * 100, 1) AS share_65_plus_pct,
      COALESCE(t.median_income, 32000) AS median_income,
      COALESCE(t.median_age, p.median_age) AS median_age,
      COALESCE(t.population, p.total_population) AS total_population,
      t.pop_65_plus,
      t.car_free_households,
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
            maps = build_google_maps_urls(lat, lon, label=f"Atlanta Tract {row.census_tract_id}")
            ranked.append({
                "rank": rank,
                "census_tract_id": row.census_tract_id,
                "coordinates": {"latitude": round(lat, 4), "longitude": round(lon, 4)},
                "avg_predicted_offset_f": row.avg_predicted_offset_f,
                "no_vehicle_rate_pct": row.no_vehicle_rate_pct,
                "poverty_rate_pct": row.poverty_rate_pct,
                "share_65_plus_pct": row.share_65_plus_pct,
                "median_income": int(row.median_income) if row.median_income else None,
                "median_age": row.median_age,
                "total_population": int(row.total_population) if row.total_population else None,
                "pop_65_plus": int(row.pop_65_plus) if row.pop_65_plus else None,
                "car_free_households": int(row.car_free_households) if row.car_free_households else None,
                "primary_attribution": {
                    "feature": row.primary_feature,
                    "attribution": row.primary_attribution_val,
                    "interpretation": f"Feature '{row.primary_feature}' contributed {row.primary_attribution_val:+.2f}°F to this tract's predicted offset."
                },
                "google_maps_link": maps["maps_view_url"],
                "walking_directions_link": maps["maps_walking_directions_url"],
            })
        return ranked
    except Exception as e:
        return [{"error": f"Failed to query atlanta_heat_model: {str(e)}"}]

def explain_tract_heat_factors(census_tract_id: str) -> Dict[str, Any]:
    """Retrieves detailed ML feature attributions explaining why a specific Atlanta census tract runs hot or cool.

    Args:
        census_tract_id: 11-digit Census Tract FIPS (e.g. '13121006200').

    Returns:
        Dictionary with all top feature attributions, predicted offset, and demographic metrics.
    """
    clean_id = str(census_tract_id).strip()
    query = f"""
    SELECT
      census_tract_id,
      ROUND(predicted_offset_f, 2) AS predicted_offset_f,
      no_vehicle_rate,
      poverty_rate,
      median_age,
      total_population,
      top_feature_attributions
    FROM
      ML.EXPLAIN_PREDICT(
        MODEL `{PROJECT_ID}.a4i_climate.atlanta_heat_model`,
        (SELECT * FROM `{PROJECT_ID}.a4i_climate.atlanta_model_input` WHERE census_tract_id = '{clean_id}' LIMIT 1),
        STRUCT(5 AS top_k_features)
      )
    LIMIT 1;
    """
    try:
        rows = list(bq_client.query(query).result())
        if not rows:
            return {"error": f"Tract {clean_id} not found in atlanta_model_input"}
        r = rows[0]
        attributions = []
        for attr in r.top_feature_attributions:
            attributions.append({
                "feature": attr["feature"],
                "attribution_f": round(attr["attribution"], 2)
            })
        return {
            "census_tract_id": r.census_tract_id,
            "predicted_offset_f": r.predicted_offset_f,
            "no_vehicle_rate_pct": round(r.no_vehicle_rate * 100, 1) if r.no_vehicle_rate is not None else None,
            "poverty_rate_pct": round(r.poverty_rate * 100, 1) if r.poverty_rate is not None else None,
            "median_age": r.median_age,
            "total_population": r.total_population,
            "feature_attributions": attributions
        }
    except Exception as e:
        return {"error": str(e)}
