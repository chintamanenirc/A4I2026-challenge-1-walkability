# Data & Engineering Handoff: Atlanta Heat Planning Assistant

## Project & Scenario

| Field | Value |
|---|---|
| **City** | Atlanta, GA |
| **Track** | This budget cycle (three permanent cooling centers, council in three weeks) |
| **GCP Project** | `qwiklabs-gcp-04-ec3596addc43` |
| **BigQuery Location** | `US` (multi-region) |
| **Git Branch** | `data` |
| **Current Stage** | Stage 0 (Profile), Stage 1 (`a4i_core`), Stage 2 (`a4i_semantic`), and Stage 4 (`a4i_ml` + `sql/serve/` + `sql/audit/`) complete and verified in BigQuery. |

---

## Layered BigQuery Architecture

> **Important for ML & Agent Lanes:** Read from `a4i_semantic` and `a4i_ml` rather than the raw `a4i_climate` tables. Raw `a4i_climate` contains `100% NULL` city labels (`23,386` rows) and Census `-666666666` sentinels in `median_age` (`3` rows), `median_income` (`4` rows, `2` populated), and `median_year_structure_built` (`7` rows + `4` zeros).

| Layer | Dataset | Purpose | Status |
|---|---|---|---|
| **Raw** | `a4i_climate` | Raw loaded tables (`heat_observations`, `station_daily_temps`, `tract_demographics`). Never modified. | Verified (`23,386` / `17,452` / `353` rows) |
| **Core** | `a4i_core` | Cleaned, typed, sentinel-free tables with 100% column descriptions and reversible quality flags. | Deployed & verified |
| **Semantic** | `a4i_semantic` | Business-named, documented views and TVFs for the ADK agent, MCP Toolbox, equity audit, and pitch deck. | Deployed & verified |
| **ML** | `a4i_ml` | `tracts_enriched`, `campaign_footprint`, `point_features()`, `train_cells`, `offset_model_v1`, `grid_predictions`. | Deployed & verified |
| **Extra** | `a4i_extra` | Optional license-checked Atlanta external layers (cooling centers, impervious/canopy). | Optional after Stage 4 |

---

## Core Tables (`qwiklabs-gcp-04-ec3596addc43.a4i_core`)

| Object | DDL Script | Grain | Row Count | Key Metrics & Cleaning Applied |
|---|---|---|---:|---|
| `a4i_core.heat_readings` | `sql/core/01_heat_readings.sql` | 1 row per 1 Hz mobile traverse reading (`reading_id`) | `23,386` | `city = 'Atlanta'` populated; range-checked `40–140 °F` (`77.68–86.86 °F`, mean `82.062 °F`, SD `1.553 °F`); `geohash-7` `cell_id`; reversible flags `is_stationary_cluster` (`526` rows with `>=10` neighbors within `20 m`) and `is_temp_outlier` (`0` rows `> ±4 SD`). |
| `a4i_core.station_days` | `sql/core/02_station_days.sql` | 1 row per `(station_id, observation_date)` | `17,452` | `8` GHCN stations across `2,557` days (`2019-01-01` to `2025-12-31`); range `19.9–100.9 °F`; `dist_to_campaign_center_km` (`11.1–39.4 km`). |
| `a4i_core.tracts` | `sql/core/03_tracts.sql` | 1 row per 11-char FIPS census tract (`geo_id`) | `353` | `LPAD(geo_id, 11, '0')`; `-666666666` and `0` sentinels cleaned to `NULL`; `100%` (`353/353`) join match to ACS 2020 5-yr (`pop_65_plus = 180,569`, `share_65_plus`) and TIGER national tracts (`land_area_km2`, `pop_density_km2`, `housing_density_km2`, `water_share`). Zero race columns. |

---

## Semantic Views & TVFs (`qwiklabs-gcp-04-ec3596addc43.a4i_semantic`)

| Object | Type | DDL Script | Grain | Row Count | What It Is For |
|---|---|---|---|---:|---|
| `a4i_semantic.dim_tract` | View | `sql/semantic/01_dim_tract.sql` | 1 row per census tract (`geo_id`) | `353` | Agent/Toolbox lookup of tract demographics (`population`, `pop_65_plus`, `share_65_plus`, `car_free_households`, `no_vehicle_rate`, `poverty_rate`, `median_income`, `median_age`, `median_year_built`, densities). No race columns. |
| `a4i_semantic.fact_heat_cell` | View | `sql/semantic/02_fact_heat_cell.sql` | 1 row per `geohash-7` cell (`~153 m × 153 m`) | `2,020` | Aggregated Heat Watch cells (`WHERE NOT is_temp_outlier`), `offset_f` (`-4.232` to `+4.708 °F`), `block_id` (`22` `geohash-5` blocks for spatial split), and `nearest_geo_id`. |
| `a4i_semantic.fact_city_heat_day` | View | `sql/semantic/03_fact_city_heat_day.sql` | 1 row per calendar `date` | `2,557` | Daily `city_max_temp_f` (`MAX(max_temp_f)` across reporting Atlanta GHCN stations, `2019–2025`). |
| `a4i_semantic.metric_city_heat_days_by_year` | View | `sql/semantic/04_metric_city_heat_days_by_year.sql` | 1 row per full `year` (`>= 300` days reported) | `7` | Annual hot-day counts (`>= 90/95/100 °F`), multi-year means (`78.0` / `23.9` / `1.6` days/yr), and OLS slope (`-0.21` days/yr for `>= 95 °F`; documented as 7-year weather variability, not climate trend). |
| `a4i_semantic.site_hot_days(offset_f)` | TVF | `sql/semantic/05_tvf_site_hot_days.sql` | 1 summary row for input `offset_f FLOAT64` | `1` | Pitch & agent metric: mean days/yr where `city_max_temp_f >= 95 - offset_f` (`56.0` days/yr at `+3.5 °F` offset vs `23.9` days/yr city baseline). |
| `a4i_semantic.vulnerable_population(lat, lon, radius_m)` | TVF | `sql/semantic/06_tvf_vulnerable_population.sql` | 1 summary row for `(lat, lon, radius_m)` | `1` | Coverage ranking: sums `car_free_households`, `pop_65_plus`, and `population` across tracts whose internal point lies within `radius_m` straight-line meters of `(lat, lon)`. |
| `a4i_semantic.audit_city_baseline` | View | `sql/semantic/07_audit_city_baseline.sql` | 1 city-wide summary row (`350` populated tracts) | `1` | Population-weighted city baseline for post-hoc equity audit (`city_median_income_usd = $75,714.39`, `city_poverty_rate = 13.95%`, `city_no_vehicle_rate = 8.23%`, `city_share_65_plus = 12.47%`, `city_median_age_years = 37.02`). |
