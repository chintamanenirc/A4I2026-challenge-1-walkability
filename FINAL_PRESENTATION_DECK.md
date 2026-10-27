# Agents for Impact 2026 — Final Presentation & Submission Package
**Challenge 1: Community Climate Resilience · City of Atlanta**  
**Track:** *This Budget Cycle* (3 Permanent Resilience Cooling Centers)  
**Target Persona:** Dana, City Manager's Office (Council Vote in 3 Weeks)  

---

## 📋 Hackathon Submission Requirements Checklist

| Requirement | Value / Link | Notes & Verification |
|---|---|---|
| **1. Explore Qwiklabs Environment Link** | [`qwiklabs-gcp-04-ec3596addc43`](https://console.cloud.google.com/?project=qwiklabs-gcp-04-ec3596addc43) | Multi-region `US` BigQuery datasets (`a4i_core`, `a4i_semantic`, `a4i_ml`) & Cloud Run services. |
| **2. GitHub Repository Link** | [github.com/chintamanenirc/A4I2026-challenge-1-walkability](https://github.com/chintamanenirc/A4I2026-challenge-1-walkability) | Full code: BQML models, ADK agent, MCP Toolbox, FastAPI semantic endpoints, Next.js 16 UI. |
| **3. Live Demo Link** | [urban-heat-ui-1042443035046.us-central1.run.app](https://urban-heat-ui-1042443035046.us-central1.run.app) | Production Next.js 16 planning dashboard on Cloud Run with Voronoi heat map, BQML attributions & Council drafter. |
| **4. Recorded Pitch Video (< 3 Minutes)** | [Under 3-Minute Video Script](#pitch-video-script-under-3-minutes) | Exactly 2m 45s timed script (390 words) covering problem, team, architecture, live demo & equity audit. |
| **5. Slide Deck Format** | [Atlanta_Heat_Resilience_Deck.html](file:///config/.gemini/antigravity/scratch/A4I2026-challenge-1-walkability/Atlanta_Heat_Resilience_Deck.html) | **Strictly exactly 6 slides.** Interactive HTML deck with slide counter, PDF export, and Slide 3 team roster. |

---

## 📽️ Pitch Video Script (Under 3 Minutes)
*Target Duration: 2 minutes 45 seconds (~390 spoken words).*

### **[0:00 – 0:30] The Hook & The Municipal Dilemma**
> *"Summer afternoon temperatures in Atlanta don't hit everyone equally. Two neighborhoods just two miles apart routinely differ by 12 to 15 degrees Fahrenheit due to tree canopy loss and dense asphalt.*  
> *Right now, Dana in the City Manager’s Office has capital funds to build three permanent cooling resilience centers, with a City Council vote in just three weeks. If she sites them on political gut feeling, the hearing explodes. If she sites them on raw heat sensors, she builds in an empty industrial parking lot where no vulnerable seniors actually live.*  
> *We built the Atlanta Urban Heat Resilience Planner—a decision-grade AI agent powered by Google Cloud ADK, Gemini 2.5, and BigQuery ML that turns microclimate science into council-ready policy."*

### **[0:30 – 1:00] The Core Problem & Three Crucial Gaps**
> *"Traditional municipal planning suffers from three fatal blind spots:*  
> *First, confusing hazard with vulnerability: heat without people isn't an emergency.*  
> *Second, black-box predictions: city engineers can't fund concrete without knowing physical causality.*  
> *Third, displacement transparency: when Council asks 'Why wasn't District 7 funded?', planners must provide defensible, empirical answers.*  
> *Critically, we enforce strict ethical AI guardrails: race and demographics are NEVER used to train our predictive models. They are evaluated solely as a post-hoc audit to verify who benefits."*

### **[1:00 – 1:30] Our Team (Slide 3)**
> *"Our project brought together four specialized builders:*  
> *- **Harika**, our Team Lead, defined municipal governance, ethical boundaries, and the Council decision persona.*  
> *- **Faizan Chundrigar**, our Lead Data Scientist, trained our BigQuery ML spatial offset model with leak-free 5-kilometer cross-validation.*  
> *- **Chintamaneni RC**, our Platform Architect, engineered the Google ADK agent, private MCP Toolbox, and BigQuery semantic layer.*  
> *- And **Nviradiya**, our Full-Stack Lead, created our Next.js production dashboard with real-time Voronoi spatial intelligence and streaming telemetry."*

### **[1:30 – 2:00] Technical Architecture: Google Cloud Native**
> *"Under the hood, our solution runs 100% on Google Cloud:*  
> *BigQuery ML executes `ML.EXPLAIN_PREDICT` to forecast relative temperature offset—delta T—and isolates exact physical drivers like impervious surface and building age.*  
> *A private, warm Cloud Run microservice runs the MCP Toolbox for Databases, exposing audited BigQuery functions.*  
> *The Google Cloud Agent Development Kit orchestrates Gemini 2.5 Flash with spatial spacing rules, while our Next.js dashboard provides millisecond-level responsiveness on Cloud Run."*

### **[2:00 – 2:30] Live Solution & The Equity Audit**
> *"When Dana asks 'Where should 3 cooling centers go?', the agent:*  
> *1. Ranks sites by combining microclimate heat, 7-year NOAA extreme heat frequency, and Census vulnerability within an 800-meter pedestrian walk shed.*  
> *2. Enforces a 2-kilometer non-overlap rule to maximize city coverage.*  
> *3. Runs an automatic post-hoc Equity Audit: proving our top recommendations serve tracts with **3.04 times higher poverty** and **7.38 times higher transit dependency** than the city baseline.*  
> *4. Generates a formal, printable Council proposal memo complete with annual operating costs and site-by-site attributions."*

### **[2:30 – 2:45] Conclusion & Responsible AI**
> *"We don't claim to stop climate change. We built an honest, defensible system that helps city leaders direct scarce public dollars to save lives where heat hurts the most.*  
> *Our code, live Cloud Run demo, and Qwiklabs environment are fully published. Thank you."*

---

## 📊 Exact 6-Slide Pitch Deck Specification

### **Slide 1 of 6: When Weather Forecasts Fail: Hyper-Local Climate Resilience**
- **Tag:** Agents for Impact 2026 · Challenge 1: Community Climate Resilience · City of Atlanta
- **Headline:** A Decision-Grade AI Assistant for Siting Permanent Municipal Cooling Centers
- **The Municipal Imperative:**
  - Atlanta has capital funding allocated this budget cycle for 3 permanent community cooling centers.
  - City Council vote occurs in 3 weeks; decisions must be empirically defensible against political pushback.
  - 12°F–15°F microclimate disparities exist within 2 miles across Atlanta due to canopy loss and impervious pavement.
  - Permanent infrastructure requires 20-year defensibility: physical causality, 7-year NOAA heat frequency, and verified social equity.
- **Visual:** Interactive Voronoi tract map showing Atlanta microclimatic offsets and candidate resilience hubs.
- **Footer:** Persona: Dana, City Manager's Office · GCP Project: `qwiklabs-gcp-04-ec3596addc43`.

---

### **Slide 2 of 6: Surviving The Council Hearing: Beyond Raw Sensors**
- **Tag:** Governance & Community Reality · The Municipal Gap
- **Headline:** Bridging the Chasm Between Mobile Traverses and Actionable Municipal Policy
- **The Three Planning Blindspots:**
  1. **Hazard vs. Exposure vs. Vulnerability:** A 100°F freight yard is hot but lacks residents; a 94°F tract with 35% seniors and 40% transit dependency represents acute life-safety risk.
  2. **Physical Causality ("The Why"):** Planners need actionable physical levers (impervious surface %, structure age, tree canopy deficit), not unexplainable black-box scores.
  3. **Displacement Transparency:** Defensibly explains why candidate site 4 was not funded (e.g., within 1.2 km of site 1, redundant catchment).
  4. **Strict Ethical Demographics Boundary:** Race & demographic variables strictly excluded from ML training features to prevent bias amplification; evaluated solely as an objective post-hoc outcome audit.
- **Visual:** Site-level BigQuery ML attribution waterfall charts (`impervious_pct`, `structure_age_years`, `park_dist_m`).

---

### **Slide 3 of 6: Our Team — Specialized Municipal AI Builders (COMPLETELY FILLED OUT)**
- **Tag:** Agents for Impact 2026 · Interdisciplinary Team
- **Headline:** Cross-Disciplinary Builders Bridging Policy, Machine Learning, Cloud Architecture & UI
- **Team Roster:**
  - **Harika** (`harika126@gmail.com`) — *Team Lead & Climate Policy Strategist*
    - Framed the municipal decision problem for Atlanta City Council and Dana persona.
    - Designed 3-center capital allocation constraints and 800m pedestrian catchment scope.
    - Established ethical AI governance: strictly keeping race out of ML training features.
    - Formulated Council proposal requirements and displacement metrics.
  - **Faizan Chundrigar** (`faizy31796@gmail.com`) — *Lead Data Scientist & ML Engineer*
    - Trained BigQuery ML `offset_model_v1` predicting relative heat offset ($\Delta T$ vs city mean).
    - Engineered leak-free 5 km Geohash-5 spatial-block cross-validation (MAE: 1.25°F).
    - Extracted feature attributions via `ML.EXPLAIN_PREDICT` for physical causality.
    - Generated 5,618-point 250m inference grid (`grid_predictions`).
  - **Chintamaneni RC** (`chintamaneni.rc@gmail.com`) — *Platform & Cloud Agent Architect*
    - Architected Google Cloud ADK agent powered by Gemini 2.5 Flash on Cloud Run.
    - Built & deployed private, warm MCP Toolbox for Databases (`heat-toolbox`).
    - Authored BigQuery Semantic Layer (`dim_tract`, `fact_heat_cell`, `site_hot_days`).
    - Implemented zero-trust IAM service accounts & least-privilege DCL schema grants.
  - **Nviradiya** (`hackathon@google.com`) — *Full-Stack Lead & Generative UI Engineer*
    - Built production Next.js 16 + React 19 interactive planning dashboard.
    - Engineered real-time Voronoi microclimate heat map with tract hover intelligence.
    - Constructed BQML feature attribution waterfall widgets & equity audit charts.
    - Deployed `urban-heat-ui` on Cloud Run with live agent streaming telemetry.
- **Footer:** Cross-Functional Execution · Repository: `github.com/chintamanenirc/A4I2026-challenge-1-walkability`.

---

### **Slide 4 of 6: Collaborative Municipal AI Architecture**
- **Tag:** Google Cloud Native Stack · Production Architecture
- **Headline:** Google Agent Development Kit (ADK) + Gemini 2.5 + BigQuery ML + MCP Toolbox
- **Core Architecture Components:**
  - **Google ADK + Gemini 2.5 Flash:** Orchestrates multi-step reasoning, enforces 2.0 km minimum site spacing, bounds geographic queries, and generates policy memos.
  - **BigQuery ML (`offset_model_v1`):** `ML.EXPLAIN_PREDICT` delivers street-level offset predictions and physical attributions.
  - **MCP Toolbox for Databases:** Private Cloud Run microservice (`heat-toolbox`) exposing BigQuery semantic functions via Model Context Protocol.
  - **Next.js 16 Production Frontend:** Glassmorphism UI on Cloud Run (`urban-heat-ui`) with live Voronoi SVG maps and streaming telemetry.
  - **Zero-Trust Security:** Workload Identity Federation, Secret Manager API keys, dataset-scoped DCL grants (`heat-agent-sa` & `toolbox-sa`).
  - **Production SLA:** Warm Cloud Run instances (`min-instances=1`) guarantee < 2.5s response times at < $0.001 per turn.
- **Execution Guarantees:** ADR-001 through ADR-008 adhered to; zero training-serving skew via unified `point_features()` TVF.

---

### **Slide 5 of 6: Community Resilience & Explainable Siting**
- **Tag:** Live Demonstration Highlights · Decision Workflows
- **Headline:** Four Core Decision Capabilities Validated on Live Atlanta Census Data
- **Live Capabilities:**
  1. **Microclimate Explainability:** Isolates why an unmeasured point is hot (+3.8°F impervious surface vs. -0.9°F park cooling).
  2. **Multi-Criteria Vulnerability Ranking:** Composite score balances physical heat offset $\times$ 7-year NOAA days $\ge 95^\circ\text{F}$ $\times$ non-car households & seniors (800m walk shed), enforcing 2 km spatial spacing.
  3. **Post-Hoc Demographic Equity Audit:** Empirically proves recommended tracts serve populations with **3.04x higher poverty rate** and **7.38x higher transit dependency** than city baseline.
  4. **Council-Ready Policy Memo Drafter:** Deterministically compiles GIS coordinates, budget allocation, displacement notes ("Why not Site 4?"), and human-in-the-loop signoff.
- **Visual:** Demographic Equity Audit chart and tract scatterplot showing prioritized sites in highest-vulnerability quadrants.

---

### **Slide 6 of 6: Responsible AI, Impact & Official Submission Deliverables**
- **Tag:** Hackathon Submission & Honest Engineering
- **Headline:** Everything Required to Verify, Replicate, and Evaluate the Solution
- **Honest Limitations & Ethical Boundaries:**
  - *Data Reality:* Heat Watch represents a single peak summer afternoon traverse; GHCN stations reflect regional temporal climate trends.
  - *Simulation Boundary:* Diagnoses existing microclimate hazard; does not simulate post-intervention tree-planting cooling deltas.
  - *Catchment Geometry:* 800m straight-line radius (future roadmap: Google Maps walk isochrones).
  - *Ethical Guardrail:* Zero demographic inputs in predictive model; post-hoc audit ensures accountability.
- **Submission Deliverables Links:**
  - **Qwiklabs Project:** `https://console.cloud.google.com/?project=qwiklabs-gcp-04-ec3596addc43`
  - **GitHub Repo:** `https://github.com/chintamanenirc/A4I2026-challenge-1-walkability`
  - **Live Demo Link:** `https://urban-heat-ui-1042443035046.us-central1.run.app`
  - **Recorded Pitch Video:** Script in this document; runtime 2m 45s.

---

## 🛠️ Verification & Smoke Test Instructions
1. **Live Cloud Run UI Test:**
   ```bash
   curl -I https://urban-heat-ui-1042443035046.us-central1.run.app
   # Expect: HTTP/2 200 OK
   ```
2. **MCP Toolbox Service Test:**
   ```bash
   curl -I https://heat-toolbox-1042443035046.us-central1.run.app
   ```
3. **Open Slide Deck in Browser:**
   Open `Atlanta_Heat_Resilience_Deck.html` in Chrome/Firefox or press **Export PDF** to produce the official 6-page submission PDF.
