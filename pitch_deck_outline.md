# Pitch Deck Outline: Urban Heat Resilience Planning Assistant
**Agents for Impact 2026 — Challenge 1: Community Climate Resilience**

## Slide 1: The Hook & Title
- **Headline**: When the Weather Forecast is Not Enough: Hyper-Local Climate Resilience for Cities.
- **Subhead**: A Decision-Grade AI Assistant Powered by Google Cloud ADK & BigQuery ML.
- **Team**: Agents for Impact Team.

## Slide 2: The Core Problem & The Gap
- **Heat is America's Deadliest Weather Hazard**: Kills more people than floods, tornadoes, and hurricanes combined.
- **The Microclimate Inequality**: Within Dallas or Atlanta, two neighborhoods just 2 miles apart differ by up to 12°F–15°F on the exact same afternoon.
- **The Municipal Dilemma**: City forecasts say "102°F tomorrow at the airport." Planners and dispatchers have $500k and need to know: *Which exact intersection? Why is it hot? Who cannot escape it?*

## Slide 3: Three Tracks, One Architecture
- **Track Focus**: *This Budget Cycle (Permanent Cooling Centers)* + *Today (Dispatch)*.
- **The Persona**: Dana, City Manager's Office. Council meets tomorrow morning; decisions must be justified with physical microclimate data, historical climate trends, and an equity audit.

## Slide 4: Technical Architecture & Core Differentiator
- **Google ADK + Gemini 2.5 Flash**: Orchestrates decision tools and drafts policy memos.
- **BigQuery ML (`ML.EXPLAIN_PREDICT`)**: Predicts **offset** ($\Delta T$), not generic temperature, and extracts physical attributions (spatial northing/easting, structure age, building density).
- **Ethical AI Principle**: Demographics & race excluded from model training features; evaluated solely as an outcome audit.
- **Deployment**: Hosted on Google Cloud Run with warm instances for zero-latency presentation.

## Slide 5: Live Demo Highlights (The 4 Core Queries)
1. **Explainability**: "Why is 4th & Marsalis running hotter?" -> Attributions show exact spatial and structural drivers.
2. **Prioritization**: "Rank top 3 cooling center locations" -> Multi-criteria composite vulnerability score.
3. **Climate Trends**: "How often does our city cross 100°F?" -> 7-year NOAA GHCN station trends (e.g., 256 summer station-days $\ge 100^\circ\text{F}$).
4. **Demographic Equity Audit**: "Did our recommendations serve the most vulnerable?" -> 3.04x higher poverty rate, 7.38x higher transit dependency.

## Slide 6: The Council-Ready Deliverable
- **Placement Recommendation Memo**: A structured, human-vetted municipal proposal with GPS coordinates, budget tradeoffs, demographic impact, and site-level attributions.

## Slide 7: Honest Limitations & Next Steps
- **Data Reality**: Heat Watch campaigns represent a single hot summer day; weather stations capture regional trends rather than block-level continuous temporal variance.
- **Simulation Boundary**: The model predicts current microclimate risk, not post-intervention cooling deltas (cannot simulate the effect of newly planted trees).
- **Next Steps**: Integrate real-time GTFS transit routes, Google Maps 10-minute walking isochrones, and municipal 311 heat stress call data.
