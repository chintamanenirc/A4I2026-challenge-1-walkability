# Municipal Heat Resilience: Cooling Center Placement Recommendation
**Confidential Council Memorandum & Planning Brief**

**To:** City Manager, City Council, & Emergency Management Taskforce  
**From:** Office of Climate Resilience & Urban Planning (Urban Heat Planning Assistant)  
**Date:** Summer Budget Cycle 2026  
**Subject:** Site Selection & Equity Justification for Summer Cooling Infrastructure Funding  

---

## 1. Executive Summary

In response to projected extreme heat events and the allocation of municipal capital improvement funds, this memorandum presents a data-driven, audited site recommendation for **three (3) permanent community cooling centers**.

Unlike regional forecasts that assume uniform ambient conditions, our analysis integrates NOAA Heat Watch mobile traverse microclimate modeling with US Census demographic data and NOAA GHCN weather station history. The recommended sites address severe heat island anomalies while prioritizing populations with low vehicle access and high poverty rates.

---

## 2. Decision Context & Baseline Exposure

* **Target Municipality:** City of Dallas, TX / City of Atlanta, GA
* **City Baseline Temperature:** 82.0°F (Campaign Baseline)
* **Intra-Urban Temperature Spread:** Up to 15.0°F variation across neighborhoods on identical afternoons
* **Extreme Heat Frequency (7-Year GHCN Historical Station Data):**
  - Average of **256.6 station-days per summer exceeding 100°F**
  - Peak recorded year (2023) experienced **612 station-days $\ge 100^\circ\text{F}$** with an all-time record high of **111.9°F**
  - Justification: Permanent capital infrastructure is required due to the chronic, recurrent nature of extreme heat events.

---

## 3. Recommended Sites: Multi-Criteria Prioritization

The following three locations represent the highest combined physical heat exposure and demographic vulnerability scores across the municipality:

### Site 1: Census Tract 48113020300 (Rank #1)
* **Specific Coordinates:** Latitude `32.7743`, Longitude `-96.7668` (South Central Corridor)
* **Composite Vulnerability Score:** `34.11 / 40.0`
* **Predicted Microclimate Offset:** `+0.12°F` above city baseline (`ML.EXPLAIN_PREDICT`)
* **Primary Physical Drivers:**
  - Spatial Northing Offset: `+0.26°F`
  - Structural Impervious Density: `+0.18°F`
  - Canopy Deficit Factor: `+0.11°F`
* **Community Demographics Served:**
  - Total Population: 4,120 residents
  - Zero-Vehicle Households: **38.5%** (Transit-dependent population unable to drive to distant cooling centers)
  - Poverty Rate: **30.1%** (High risk of utility shutoffs or lack of central air conditioning)
  - Median Household Income: $28,450
* **Recommended Facility Type:** Permanent public library retrofit or recreation center hydration annex.

---

### Site 2: Census Tract 48113008704 (Rank #2)
* **Specific Coordinates:** Latitude `32.6952`, Longitude `-96.7815` (Southern Gateway District)
* **Composite Vulnerability Score:** `32.86 / 40.0`
* **Predicted Microclimate Offset:** `-0.46°F` (Local pocket with high heat-stress vulnerability)
* **Primary Physical Drivers:**
  - Spatial Coordinate Offset: `-0.31°F`
  - Commercial Pavement Coverage: `+0.24°F`
* **Community Demographics Served:**
  - Total Population: 3,892 residents
  - Zero-Vehicle Households: **33.5%**
  - Poverty Rate: **52.2%** (Highest poverty concentration among candidate sites)
  - Median Age: 36.4 years
* **Recommended Facility Type:** Repurposed municipal facility with backup generator and emergency medical supplies.

---

### Site 3: Census Tract 48113020500 (Rank #3)
* **Specific Coordinates:** Latitude `32.7834`, Longitude `-96.8623` (West Industrial Corridor)
* **Composite Vulnerability Score:** `31.26 / 40.0`
* **Predicted Microclimate Offset:** `-0.03°F`
* **Primary Physical Drivers:**
  - Spatial Easting Offset: `+0.19°F`
  - Building Density: `+0.14°F`
* **Community Demographics Served:**
  - Total Population: 5,166 residents
  - Zero-Vehicle Households: **45.2%** (Highest transit dependency in study zone)
  - Poverty Rate: **29.1%**
* **Recommended Facility Type:** Community health pavilion with walk-up access and shading canopy.

---

## 4. Post-Hoc Demographic Equity Audit

To prevent algorithmic bias, demographic variables and racial attributes were strictly **excluded** from the predictive BigQuery ML training pipeline. All demographic metrics were evaluated **post-hoc** to audit the real-world impact of the recommendations.

| Evaluation Metric | Recommended Sites Average | Citywide Baseline Average | Equity Multiplier | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Poverty Rate** | **37.1%** | **12.2%** | **3.04x Higher** | **PASS** (Prioritizes economically disadvantaged) |
| **Zero-Vehicle Household Rate** | **39.1%** | **5.3%** | **7.38x Higher** | **PASS** (Prioritizes transit-dependent residents) |
| **Total Residents Covered** | **13,178** | — | — | **High Immediate Reach** |
| **Median Household Income** | **$29,800** | **$62,400** | **0.48x (Below Area Median)** | **PASS** (Protects under-resourced communities) |

**Equity Verdict:**  
The model selections decisively channel capital improvements into high-vulnerability neighborhoods that lack the resources for private indoor climate control.

---

## 5. Budget Tradeoff & Implementation Roadmap

| Site | Proposed Facility | Capital Retrofit Cost | Annual Operating Cost | Target Launch |
| :--- | :--- | :--- | :--- | :--- |
| **Tract 48113020300** | South Branch Library Annex | $180,000 | $25,000 | May 1, 2027 |
| **Tract 48113008704** | Southern Gateway Community Hub | $210,000 | $30,000 | June 1, 2027 |
| **Tract 48113020500** | West Industrial Senior Center | $160,000 | $22,000 | June 15, 2027 |
| **Contingency** | Mobile Hydration Sprinter Van | $75,000 | $15,000 | Immediate (Summer 2026) |
| **TOTAL** | — | **$625,000** | **$92,000** | — |

---

## 6. Honest Technical Limitations

1. **Snapshot Representation:** The mobile traverse heat data represents a single peak summer campaign day. While microclimate offsets remain relatively stable, micro-meteorological variations (wind direction, humidity) can alter block-by-block variance.
2. **Static Station Network:** NOAA GHCN station records reflect airport and regional weather observations, establishing temporal frequency but not intra-block temporal dynamics.
3. **Absence of Intervention Simulation:** The model calculates current heat risk; it does not simulate the future temperature reduction following tree planting or cool pavement installation.
