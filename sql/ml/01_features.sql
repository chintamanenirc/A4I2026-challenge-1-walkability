-- sql/ml/01_features.sql: Stage 4 feature engineering layer in a4i_ml
-- Reads from a4i_core.tracts and a4i_core.heat_readings.
-- Zero race columns; zero drive-day weather columns in model features.

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-ec3596addc43.a4i_ml.tracts_enriched`
OPTIONS(
  description="Sentinel-free Atlanta census tracts enriched with physical built-environment densities (for BQML features) and vulnerability attributes (for post-prediction ranking and equity audit; never model inputs). Read from a4i_core.tracts.",
  labels=[("app", "heat-planner"), ("lane", "data"), ("layer", "ml")]
) AS
SELECT
  geo_id,
  tract_lat,
  tract_lon,
  tract_centroid_geog,
  total_pop,
  housing_units,
  households,
  median_year_built,
  land_area_km2,
  pop_density_km2,
  housing_density_km2,
  water_share,
  pop_65_plus,
  share_65_plus,
  car_free_households,
  median_age,
  median_income,
  poverty_rate,
  no_vehicle_rate
FROM `qwiklabs-gcp-04-ec3596addc43.a4i_core.tracts`;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-ec3596addc43.a4i_ml.campaign_footprint`
OPTIONS(
  description="1 km buffered convex hull of non-outlier Atlanta Heat Watch readings from a4i_core.heat_readings, plus campaign centroid and campaign mean temperature (deg F). Defines in-scope domain for refusal guard.",
  labels=[("app", "heat-planner"), ("lane", "data"), ("layer", "ml")]
) AS
SELECT
  ST_BUFFER(ST_CONVEXHULL(ST_UNION_AGG(reading_geog)), 1000) AS footprint,
  ST_CENTROID_AGG(reading_geog) AS center,
  AVG(temp_f) AS campaign_mean_f
FROM `qwiklabs-gcp-04-ec3596addc43.a4i_core.heat_readings`
WHERE NOT is_temp_outlier;

CREATE OR REPLACE TABLE FUNCTION `qwiklabs-gcp-04-ec3596addc43.a4i_ml.point_features`(
  pts ARRAY<STRUCT<point_id STRING, lat FLOAT64, lon FLOAT64>>
)
OPTIONS(
  description="Shared feature engineering table function for training, batch grid scoring, and online ML.EXPLAIN_PREDICT serving. Computes physical/built-environment features only (no race, no drive-day temps) plus in_footprint scope flag."
) AS
WITH p AS (
  SELECT point_id, lat, lon, ST_GEOGPOINT(lon, lat) AS g
  FROM UNNEST(pts)
),
tr AS (
  SELECT
    geo_id,
    tract_centroid_geog AS tg,
    total_pop,
    housing_units,
    median_year_built,
    pop_density_km2,
    housing_density_km2,
    water_share
  FROM `qwiklabs-gcp-04-ec3596addc43.a4i_ml.tracts_enriched`
),
nearest AS (
  SELECT
    p.point_id,
    ARRAY_AGG(
      STRUCT(
        tr.geo_id,
        tr.median_year_built,
        tr.pop_density_km2,
        tr.housing_density_km2,
        tr.water_share,
        ST_DISTANCE(p.g, tr.tg) AS meters
      )
      ORDER BY ST_DISTANCE(p.g, tr.tg)
      LIMIT 1
    )[OFFSET(0)] AS nt
  FROM p
  JOIN tr
    ON ST_DWITHIN(p.g, tr.tg, 5000)
  GROUP BY p.point_id
),
ring AS (
  SELECT
    p.point_id,
    SUM(tr.total_pop) AS pop_within_1500m,
    SUM(tr.housing_units) AS housing_within_1500m,
    AVG(tr.median_year_built) AS mean_year_built_1500m
  FROM p
  JOIN tr
    ON ST_DWITHIN(p.g, tr.tg, 1500)
  GROUP BY p.point_id
)
SELECT
  p.point_id,
  p.lat,
  p.lon,
  n.nt.geo_id AS geo_id,
  ST_COVERS(f.footprint, p.g) AS in_footprint,
  n.nt.meters AS meters_to_tract_point,
  -- Model features (physical / built environment only) --------------------
  ST_DISTANCE(p.g, f.center) / 1000.0 AS km_from_center,
  n.nt.median_year_built AS median_year_built,
  n.nt.pop_density_km2 AS pop_density_km2,
  n.nt.housing_density_km2 AS housing_density_km2,
  COALESCE(n.nt.water_share, 0.0) AS water_share,
  COALESCE(r.pop_within_1500m, 0.0) AS pop_within_1500m,
  COALESCE(r.housing_within_1500m, 0.0) AS housing_within_1500m,
  r.mean_year_built_1500m AS mean_year_built_1500m
FROM p
CROSS JOIN `qwiklabs-gcp-04-ec3596addc43.a4i_ml.campaign_footprint` f
LEFT JOIN nearest n USING (point_id)
LEFT JOIN ring r USING (point_id);
