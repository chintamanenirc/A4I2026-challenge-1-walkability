# Phase 1: Load & Explore (~40 min)

**Slide stack:** your team's repo · BigQuery · Colab Enterprise · (+ your own data, optional)

**Goal:** trusted tables in BigQuery, a one-page understanding of *this city's* heat pattern,
and the first contracts published so the other lanes can build in parallel.

## Exit criteria (team lead checks)
- [ ] `a4i_climate` has 3 tables; validation is n/n PASS; output is pasted in `docs/HANDOFF.md`.
- [ ] Intra-city spread, campaign bbox, timestamp coverage % and tract count are recorded.
- [ ] First feature layer exists (`a4i_ml.tracts_enriched`, `campaign_footprint`, `point_features`).
- [ ] Agent lane has a skeleton `root_agent` running in `adk web` with stub tools.
- [ ] `docs/contracts/placement_recommendation.schema.json` + `sample.json` committed (front end unblocked).
- [ ] Story lane has the scenario, user persona and a deck skeleton.

---

## Data lane: load + validate (branch `data`)

```text
/agents → data-engineer
Read skills/heat-data. City = <CITY>, project = <PROJECT_ID>.
1. Check whether a4i_climate already has data (someone may have loaded it). If its tables
   exist with rows, don't reload; tell me the row counts.
2. If not, I'm running the Colab notebook now. While it runs, prepare sql/eval/validate.sql
   from the skill's resources/validate.sql for this project.
3. When I say "loaded", run validate.sql and paste the full result table. For any FAIL,
   diagnose using the notebook's known traps (sentinels, LPAD, SAFE_CAST, wrong location).
4. Run three explorations and save them under sql/explore/: hottest 15 points with offset;
   mean offset by nearest tract (with n readings and no_vehicle_rate); tracts with zero
   readings (the "unmeasured" areas).
5. Write docs/HANDOFF.md → "Data tables": row counts, spread, bbox, timestamp coverage %,
   tract count, and 3 bullet observations about this city's heat pattern.
Ask me before running anything that writes to BigQuery.
```

**Fallback if Colab is slow / NOAA is refusing connections:** `bash scripts/load.sh <city>`.

## Data lane (2nd person): heat frequency + feature layer

```text
/agents → ml-engineer
Read skills/bqml-offset-model and skills/heat-data. Project <PROJECT_ID>.
1. Create dataset a4i_ml (US) if missing.
2. Adapt resources/heat_frequency.sql into sql/explore/heat_frequency.sql, run it, and give me
   a two-sentence plain-English summary (days ≥95°F per year, ≥100°F per year, and the slope
   with the "7 years is variability" caveat).
3. Adapt resources/01_features.sql into sql/features/01_features.sql. Before running, verify the
   national tract geometry table name and that area_land_meters exists (INFORMATION_SCHEMA).
   Run it. Then report: tracts_enriched row count vs tract_demographics row count, % NULL
   density, and point_features output for 3 test points (one on a drive route, one between
   routes, one far outside the footprint).
Record decisions in docs/DECISIONS.md.
```

## Agent lane: skeleton + contracts (branch `agent`)

```text
/agents → agent-engineer
Read skills/adk-agent and skills/placement-recommendation.
1. Scaffold agent/heat_planner from skills/adk-agent/examples (config, schemas, bq, prompts,
   agent). Create the venv, install google-adk, google-cloud-bigquery, db-dtypes, pydantic,
   httpx, pytest, then pin the exact installed versions into agent/requirements.txt.
2. Check the installed ADK's import paths for Agent, ToolContext and the MCP toolset, and fix the
   example imports to match. Tell me what you changed.
3. Find the current GA Gemini model ids available on the Gemini platform in us-central1 and
   propose AGENT_MODEL (fast) and WRITER_MODEL (stronger). Ask me before setting them.
4. Implement the tools as STUBS returning realistic fake data in the exact schema, so adk web runs
   end-to-end now. Mark every stub with `# STUB`.
5. Generate docs/contracts/placement_recommendation.schema.json from the Pydantic model, and a
   realistic docs/contracts/sample.json for <CITY> (3 sites, plausible coordinates inside the
   city, offsets between +3 and +9°F, drivers, demographics, limitations).
6. Run `adk web` and show me one stubbed conversation for "Where should 3 cooling centers go?".
```

## Front-end lane (branch `frontend`)

```text
/agents → frontend-engineer
Read skills/frontend-ui. Our hypothesis is <INTERFACE>. Our user is <PERSONA>.
1. Write a one-paragraph interface decision for docs/DECISIONS.md, with the alternative we
   rejected and why.
2. If custom: scaffold frontend/ (small FastAPI backend + static index.html) that renders
   docs/contracts/sample.json: map with numbered sites, a card per site (offset, top-2 driver
   bars in °F, people / % no car / median age), and a chat panel that is mocked for now.
   USE_MOCK=true by default. Run it locally in Cloud Shell Web Preview and tell me the port.
   No OpenStreetMap tiles. Use the Google Maps JS API with a key from env.
```

## Story lane (branch `story`)

```text
/agents → story-lead
Read skills/pitch-story. City <CITY>, track <TRACK>, scenario "<SCENARIO>".
1. Write story/persona.md: one named planner, their afternoon, the decision, the meeting.
2. Write story/deck_outline.md following the 7-slide structure, with [TBD: owner] wherever a
   number is not yet in docs/.
3. Write story/rubric_map.md (rubric question → where we'll answer it).
4. Draft story/demo_script.md (≤2 min) using the seven planner questions adapted to our track.
```

## Optional: bring your own data (data lane, only after validation passes)

```text
/agents → data-engineer
We're considering adding <DATASET> for <WHY / which planner question it unlocks>.
Find its official source, license text and update date. Check the license against the challenge
bar (no NC, ND, SA, ODbL/OSM, unstated). Report: license verdict, join key and granularity, and
the expected effort to load into a4i_extra. Don't load anything yet.
```

## Failure modes this phase
- Reloading over a teammate's load: check first.
- "Validation passed" without pasting the table: always paste it.
- Agent lane waiting for the model: stubs + contract unblock you now.
