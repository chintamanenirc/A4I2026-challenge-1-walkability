# Agents for Impact 2026 — Challenge 1 Submission Package
**Project**: Atlanta Urban Heat Resilience Planner  
**City & Track**: City of Atlanta, GA · *This Budget Cycle* (3 Permanent Cooling Centers · $600k FY26 Cap · Council Vote in 3 Weeks)

---

## 1. Required Submission Links

| Submission Item | Link / Resource Identifier | Notes |
|---|---|---|
| **1. Presentation Deck (6 Slides, PPTX)** | [`Atlanta_Heat_Resilience_Deck.pptx`](./Atlanta_Heat_Resilience_Deck.pptx) | Native 16:9 PowerPoint deck (**strictly 6 slides**, Slide 3 = **Our Team** completely filled out, speaker notes included). |
| **1b. Presentation Deck (6 Slides, HTML/PDF)** | [`Atlanta_Heat_Resilience_Deck.html`](./Atlanta_Heat_Resilience_Deck.html) | Print-ready 6-slide HTML deck with embedded live UI screenshots (`window.print()` to export PDF). |
| **2. Explore Qwiklabs Environment Link** | https://console.cloud.google.com/welcome?project=qwiklabs-gcp-04-ec3596addc43 <br> **BigQuery Studio**: https://console.cloud.google.com/bigquery?project=qwiklabs-gcp-04-ec3596addc43 <br> **Cloud Run Services**: https://console.cloud.google.com/run?project=qwiklabs-gcp-04-ec3596addc43 | **GCP Project ID**: `qwiklabs-gcp-04-ec3596addc43` <br> **Compute Region**: `us-central1` · **BQ Location**: `US` <br> **Datasets**: `a4i_core`, `a4i_semantic`, `a4i_ml` <br> **BQML Model**: `qwiklabs-gcp-04-ec3596addc43.a4i_ml.offset_model_v1` |
| **3. GitHub Repository Link** | https://github.com/chintamanenirc/A4I2026-challenge-1-walkability | Contains `frontend/`, `agent/`, `urban_heat_agent/`, `toolbox/`, `sql/`, `docs/DECISIONS.md`, and `docs/HANDOFF.md`. |
| **4. Live Demo Link (Primary Planner UI)** | https://urban-heat-ui-1042443035046.us-central1.run.app | Production Next.js 16 + React 19 UI on Google Cloud Run (`min-instances=1`), wired to live BigQuery `a4i_semantic` and ADK Agent. |
| **4b. Live Backend / Agent Endpoints** | - **ADK Agent Service**: https://urban-heat-agent-1042443035046.us-central1.run.app <br> - **Planner Orchestrator API**: https://heat-planner-api-1042443035046.us-central1.run.app <br> - **Managed MCP Toolbox**: https://heat-toolbox-1042443035046.us-central1.run.app | Deployed on Cloud Run (`us-central1`) with dedicated least-privilege service accounts (`heat-agent-sa`, `toolbox-sa`). |

---

## 2. Exact 6-Slide Deck Breakdown (No Extra Slides)

### Slide 1: Title, Scenario & The Municipal Decision Challenge
- **Header**: `Challenge 1: Climate Resilience · City of Atlanta · Track: This Budget Cycle`
- **Title**: *Three Permanent Cooling Centers, Sited Where Heat Hurts Most*
- **Key Points**:
  - **Who Is Asking**: Dana, Mayor's Office of Sustainability & Resilience (3:40 PM Tuesday; City Council votes in 3 weeks on the FY26 capital budget).
  - **The Budget Mandate**: `$600,000` capital allocation to fund **3 permanent cooling centers** (`$180k/yr` operating cost each) across `353` Atlanta census tracts.
  - **The Microclimate Inequality**: Airport forecasts report a single city temperature, but `23,386` street-level Heat Watch traverses (city mean `82.06°F`) show blocks 2 miles apart differ by up to **`13.5°F`** (`-5.79°F` to `+7.70°F` offset).
  - **Why Raw Sensors Fail Council**: Siting on peak heat alone places centers in unpopulated rail yards or clusters all 3 in one district; siting on politics leaves transit-dependent seniors unserved.

### Slide 2: Placement Recommendation & Explainable Physical Drivers (`ML.EXPLAIN_PREDICT`)
- **Header**: `Placement Recommendation · BigQuery ML (ML.EXPLAIN_PREDICT) & Spatial Siting`
- **Title**: *The Answer: 3 Non-Overlapping Sites + Why Site #4 Was Displaced*
- **Key Points**:
  - **Offset, Never Raw Temperature**: Scores `5,618` candidate grid points (~250 m) by **Predicted Thermal Offset (`+°F` vs. `82.06°F` city mean) × 7-yr GHCN Hot Days (`≥95°F`) × Walkable Vulnerability**, with greedy **`≥2.0 km` non-overlapping spacing**.
  - **Site #1 · Mechanicsville (`Tract 58.00 / 76.03`)**: **`+4.4°F` vs. city mean** · `44 days/yr ≥95°F` · `4,890` residents in 0.5 mi (`28.4%–56.4%` no-car, `16.2%` 65+). `ML.EXPLAIN_PREDICT` drivers: Impervious surface (`+2.3°F`), Street density (`+1.4°F`), Land-use mix (`+1.0°F`), Park proximity (`-0.3°F`).
  - **Site #2 · Old Fourth Ward / Ashview (`Tract 42.00`)**: **`+3.9°F` vs. city mean** · `42 days/yr ≥95°F` · `4,120` residents (`24.1%–46.7%` no-car, `17.8%` 65+). Drivers: Impervious surface (`+1.9°F`), Street density (`+1.4°F`).
  - **Site #3 · West End / Summerhill (`Tract 48.00`)**: **`+3.6°F` vs. city mean** · `41 days/yr ≥95°F` · `3,250` residents (`22.5%–38.0%` no-car, `14.6%–24.2%` 65+). Unmeasured tract predicted via BQML.
  - **Why Not Site #4 (Bankhead / Midtown Edge)?** Runs `+3.1°F` (`39 days ≥95°F`) but has less than half the car-free rate (`12.4%` vs. `28.4%` at Site #1) and reaches `2,480` vs. `4,890` residents.

### Slide 3: Our Team (Completely Filled Out)
- **Header**: `Our Team · Cross-Functional Engineering Lanes · Agents for Impact 2026`
- **Title**: *Our Team: Built Across Four Specialized Engineering Lanes*
- **Team Members**:
  1. **Rama Chintamaneni (`@chintamanenirc` · `chintamaneni.rc@gmail.com`) — Cloud Platform, ADK Agent & MCP Lead**
     - Architected the HeatPlanner ADK agent, system instructions, ground-rule refusal gates, and Google Maps Geocoding integration.
     - Deployed private Cloud Run MCP Toolbox (`heat-toolbox`) with parameterized BigQuery tools (`toolbox/tools.yaml`) and workload identity authentication.
     - Built Haversine greedy spacing (`spread_sites >= 2.0 km`) and `VizSpecBuilder` contracts across PRs #6, #7, #10, and #11.
  2. **Harika (`@harika126` · `harika126@gmail.com`) — Data Architecture, Semantic Layer & Orchestration Lead**
     - Engineered the 4-layer BigQuery Medallion Warehouse (`a4i_core`, `a4i_semantic`, `a4i_ml`) covering `353` tracts, `2,020` `geohash-7` cells, and `17,452` GHCN station-days.
     - Cleaned `-9999.0` sentinels, padded 11-char FIPS (`LPAD`), joined US Census TIGER polygons & ACS 65+ (`353/353` match), and passed **13/13 SQL validation checks**.
     - Built `a4i_ml.point_features(pts)` TVF with a 500 m campaign footprint refusal gate and co-built the Stage 1/2 `HeatPlannerOrchestrator` API.
  3. **Faizan Chundrigar (`@faizy31796` · `faizy31796@gmail.com`) — Machine Learning & Equity Analytics Engineer**
     - Trained `a4i_ml.offset_model_v1` (`LINEAR_REG`, `enable_global_explain=TRUE`, `l2_reg=0.1`) with zero drive-day leakage and zero race features.
     - Designed `geohash-5` (~4.9 km) spatial-block holdout (`1,378` train / `484` eval cells across `22` blocks), beating the predict-zero baseline (`MAE 1.254°F vs. 1.355°F`).
     - Pre-computed `5,618` ~250 m `ML.EXPLAIN_PREDICT` grid points (`a4i_ml.grid_predictions`) and authored the post-hoc Equity Audit (`sql/audit/audit.sql`).
  4. **N. Viradiya (`@nviradiya` · Urban Heat Team) — Full-Stack AI & Geospatial UX Lead**
     - Built the production Next.js 16 + React 19 Planner UI (`urban-heat-ui`) with 4 interactive tabs (`Ask`, `Sites`, `Equity Audit`, `Proposal`) and Voronoi census tract tessellation.
     - Implemented `GroundingVerifier` & `FallbackRenderer` to verify every `°F`, `%`, `$`, and headcount against live BigQuery semantic data.
     - Created the Site 1 vs. Site 4 trade-off comparison modal, Equity Audit scatter plot, and human-in-the-loop Council Proposal PDF exporter.

### Slide 4: Technical Architecture, BQML & Scientific Rigor
- **Header**: `Technical Execution & Rigor · Google ADK + BigQuery ML + Managed MCP Toolbox`
- **Title**: *Architecture & Why You Can Trust It: Leak-Free Spatial Holdout*
- **Key Points**:
  - **Google ADK + Gemini 2.5 Flash**: Orchestrates custom Python tools (`explain_heat_offset`, `select_cooling_center_sites`, `run_equity_audit`) + `GroundingVerifier`.
  - **Managed MCP Server (`heat-toolbox`)**: Cloud Run MCP Toolbox for Databases exposing `dim_tract`, `site_hot_days`, and `vulnerable_population` with least-privilege IAM (`toolbox-sa`, `heat-agent-sa`).
  - **Where vs. How Often**: Heat Watch (`23,386` readings, `100%` NULL timestamps) answers spatial *WHERE*; 7-year NOAA GHCN daily station history (`17,452` station-days across 7 stations) answers temporal *HOW OFTEN* via `site_hot_days(offset_f)`.
  - **Defeating 1 Hz Spatial Leakage**: Aggregated `23,386` points into `2,020` `geohash-7` (~150 m) cells and held out 6 whole `geohash-5` (~4.9 km) blocks (`484` eval / `1,378` train). Excluded `temp_f`, `heat_index_f`, `humidity_pct`, and all race columns.
  - **Verified BQML Performance**: `a4i_ml.offset_model_v1` beats predict-zero baseline on held-out spatial blocks (**`MAE = 1.254°F` vs. `1.355°F`**; `RMSE = 1.542°F` vs. `1.622°F`) and passes **13/13 SQL validation checks**.

### Slide 5: Post-Hoc Demographic Equity Audit
- **Header**: `Ethical AI & Outcome Audit · Race Excluded from Inputs, Audited on Outputs`
- **Title**: *Equity Audit: 4 of 4 Measures Confirm Need-Based Prioritization*
- **Key Points**:
  - **Strict Ethical Guardrail (`DEC-005`)**: Race and ethnicity are excluded from `a4i_core`, BQML training features, and site ranking; audited post-hoc against `a4i_semantic.audit_city_baseline` (`353` tracts).
  - **No-Vehicle Households**: **`25.0%`** in 0.5-mi catchment (**`50.41%`** in core tracts) vs. **`8.23%`** Atlanta average (**`3.0x – 6.12x` higher transit dependency**).
  - **Poverty Rate**: **`31.8%`** in catchment (**`44.05%`** in core tracts) vs. **`13.95%`** Atlanta average (**`2.3x – 3.16x` higher poverty**).
  - **Seniors Aged 65+**: **`16.2%`** in catchment (**`19.44%`** in core tracts) vs. **`12.47%`** Atlanta average (**`1.3x – 1.56x` higher senior share**).
  - **Median Household Income**: **`$38,133`** in catchment (**`$17,853`** in core tracts) vs. **`$75,714`** Atlanta average (**`50% – 76%` below citywide median**).
  - **Post-Hoc ACS Racial Check (Output Only)**: Selected tracts serve **`90.81%` Black residents** vs. `41.66%` citywide (`2.18x`).

### Slide 6: Council Deliverable, Honest Limitations & Submission Links
- **Header**: `Craft, Limitations & Submission Package · Council-Ready Deliverable`
- **Title**: *Human-in-the-Loop Council Memo, Honest Limits & Live Links*
- **Key Points**:
  - **Why Custom Next.js UI on Cloud Run**: Planners defending a `$600k` vote need interactive Voronoi tract maps, Site 1 vs. Site 4 trade-off cards, and a **Human-in-the-Loop sign-off memo** (not a raw developer chat). Pinned `min-instances=1`.
  - **Honest Refusal Gate (`DEC-007`)**: `a4i_ml.point_features` enforces `in_footprint` (`<= 500 m` from Heat Watch route). Queries in Marietta (`12.3 km` out) or Chicago are refused honestly.
  - **Known Model Limitations**: (1) Single-day Heat Watch campaign snapshot; (2) Predicts current exposure offset, cannot simulate cooling $\Delta T$ from planting new trees; (3) Straight-line `0.5-mi` / `1.5-km` buffers, not turn-by-turn walk isochrones; (4) 100% US Gov/CC0 data (zero OSM/ODbL).
  - **Credits**: Data from NOAA & CAPA Strategies Heat Watch (CC0), NOAA GHCN-Daily, and US Census ACS/TIGER. Thanks to the community volunteers who drove the routes.

---

## 3. Recorded Pitch Video Script (Under 3 Minutes — Timed at 2:35)

> **Recording Tip**: Open https://urban-heat-ui-1042443035046.us-central1.run.app in one tab and [`Atlanta_Heat_Resilience_Deck.pptx`](./Atlanta_Heat_Resilience_Deck.pptx) (or `Atlanta_Heat_Resilience_Deck.html`) in another. Record a single-narrator screen share.

### `[0:00 – 0:28]` Hook, City, Track & Decision Scenario *(Show Slide 1 → Live UI "Ask" Tab)*
"Hi judges. We chose **Atlanta, Georgia** on the **'This Budget Cycle'** track.  
Meet Dana in Atlanta's Mayor's Office of Sustainability and Resilience. It's Tuesday afternoon, and in three weeks City Council votes on a **$600,000 capital budget** to build **three permanent cooling centers**.  
Airport weather forecasts give one number for the whole city, but NOAA Heat Watch traverses across 23,386 street points show two Atlanta neighborhoods just two miles apart differ by **up to 13.5°F**. If Dana sites centers on raw temperature alone, they land in industrial rail yards or cluster in one district. She needs a recommendation that survives a contested City Council hearing."

### `[0:28 – 1:05]` Live Demo: Placement Recommendation & `ML.EXPLAIN_PREDICT` *(Click "Ask" → "Sites" Tab → "Compare Site 1 vs Site 4")*
"Here is our live Cloud Run application, **Atlanta Heat Planner**. When Dana asks *'Where should 3 permanent cooling centers go?'*, our Google ADK agent orchestrates three layers:
1. First, it calls our BigQuery ML model (`a4i_ml.offset_model_v1`) via `ML.EXPLAIN_PREDICT` to predict **thermal offset above Atlanta's 82.06°F campaign mean**—never fake raw temperatures—including unmeasured tracts like Summerhill and Mechanicsville where volunteers never drove.
2. Second, it queries our **Managed MCP Toolbox on Cloud Run** (`heat-toolbox`) to combine spatial heat offsets with **7 years of NOAA GHCN station history** and **US Census ACS vulnerability**.
3. Third, our greedy spatial siting engine enforces a **2-kilometer minimum spacing** so catchments don't overlap.

Switching to the **Sites tab**, we see *why* Site 1 in Mechanicsville runs **+4.4°F hotter than the city average** and experiences **44 days above 95°F per summer**: `ML.EXPLAIN_PREDICT` attributes **+2.3°F to impervious surface**, **+1.4°F to street density**, and **+1.0°F to land-use mix**.  
And when Council District 4 asks *'Why not Bankhead?'*, clicking **Compare with Site 4** shows Bankhead runs +3.1°F but has less than half the car-free household rate—12.4% versus 28.4% at Mechanicsville."

### `[1:05 – 1:38]` Architecture & Scientific Rigor *(Show Slide 3 "Our Team" & Slide 4 "Architecture & Rigor")*
"Our four-person team—Rama, Harika, Faizan, and N. Viradiya—built a four-layer BigQuery Medallion architecture that passes **13 out of 13 automated SQL validation checks**, fixing `-9999` income sentinels and padding 11-character FIPS codes across all 353 Atlanta tracts.  
To prevent the classic 0.98 $R^2$ spatial leakage trap from 1-Hertz road traverses, we aggregated readings into 2,020 `geohash-7` cells and evaluated our model on **held-out 5-kilometer `geohash-5` spatial blocks**, stripping all drive-day temperatures and all racial features. Our model beats the predict-zero baseline on held-out spatial blocks with a **Mean Absolute Error of 1.254°F versus 1.355°F**."

### `[1:38 – 2:08]` Post-Hoc Demographic Equity Audit *(Click "Equity Audit" Tab)*
"Race was strictly excluded from our model inputs and ranking formula. Instead, we built the **Equity Audit tab** as our centerpiece outcome check against Atlanta's citywide baseline (`a4i_semantic.audit_city_baseline`).  
Across **4 of 4 audit measures**, our three funded sites skew strongly toward need: they reach neighborhoods with **3.0x to 6.1x higher car-free households** (25.0% in catchment and 50.4% in core tracts vs. 8.2% citywide), **2.3x to 3.2x higher poverty**, **1.3x to 1.6x more seniors aged 65+**, and **half the citywide median income** ($38,133 vs. $75,714)."

### `[2:08 – 2:35]` Human-in-the-Loop Council Proposal & Honest Limitations *(Click "Proposal" Tab)*
"Finally, on the **Proposal tab**, the agent drafts a fully cited City Council memo—verified by our Python `GroundingVerifier`—with a **human-in-the-loop sign-off** before PDF export.  
We also enforce honest boundaries: our `point_features` table-valued function checks a 500-meter footprint gate and refuses out-of-bounds queries like Marietta or Chicago; we state plainly that Heat Watch is a single-day snapshot, reach rings are straight-line buffers, and our model predicts current exposure rather than simulating tree-planting cooling deltas.  
Data comes from NOAA and CAPA Strategies Heat Watch (CC0), NOAA GHCN-Daily, and US Census ACS and TIGER—thank you to the volunteers who drove the routes."
