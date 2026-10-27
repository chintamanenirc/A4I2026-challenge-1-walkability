# Phase 2: Build (~60 min)

**Slide stack:** ADK · MCP Server · Gemini models · (Antigravity, encouraged)

**Goal:** a real agent that calls a real BQML model through a tool we built, consumes a managed
MCP server, and answers the core planner questions from `adk web`, with tests.

## Exit criteria
- [ ] `offset_model_v1` trained; ML.EVALUATE vs. predict-zero baseline recorded.
- [ ] `sql/serve/explain_point.sql` committed and merged to `main` (the key hand-off).
- [ ] `a4i_ml.grid_predictions` built.
- [ ] `explain_heat_offset` and `rank_candidate_sites` call BigQuery for real (no `# STUB` left on them).
- [ ] MCP Toolbox runs (locally or on Cloud Run) and the agent lists its tools.
- [ ] `pytest -m "not live"` is green; questions 1–4 work in `adk web` with visible tool calls.

---

## Data lane: train v1 fast (first 25 min), then hand off

```text
/agents → ml-engineer
Read skills/bqml-offset-model. Project <PROJECT_ID>.
1. Adapt resources/02_train.sql into sql/train/. Run the train_cells part first and show me the
   split check (is_eval counts, mean and sd of offset_f per side). If eval is <10% or >35% of
   cells, propose a different modulus before training.
2. Train offset_model_v1 (LINEAR_REG). Then run resources/03_evaluate.sql and paste: ML.EVALUATE,
   the predict-zero baseline, ML.GLOBAL_EXPLAIN, ML.WEIGHTS.
3. Sanity: if r2 > 0.9, stop and find the leak. If MAE >= baseline, say so plainly.
4. Write sql/serve/explain_point.sql from resources/04_serve.sql (a). Run it for one measured and
   one unmeasured point inside the footprint and one point outside it, and show me the results.
5. Build grid_predictions from 04_serve.sql (b). Report row count and % unmeasured.
6. Append the metrics, feature list and FEATURE_LABELS suggestion to docs/HANDOFF.md → "Model".
   Then commit on branch data and open a merge to main with only sql/serve + docs changes.
```

## Agent lane: replace stubs with real tools

```text
/agents → agent-engineer
Read skills/adk-agent. The data lane merged sql/serve/explain_point.sql and built
a4i_ml.grid_predictions (see docs/HANDOFF.md → Model).
1. Copy explain_point.sql and skills/adk-agent/examples/rank_sites.sql into agent/heat_planner/sql/.
2. Replace the stubs for explain_heat_offset and rank_candidate_sites with the real
   implementations (examples/heat_model.py). Update FEATURE_LABELS from the hand-off.
3. Implement get_heat_frequency, get_area_demographics and resolve_location (coordinates first;
   geocoding only if MAPS_API_KEY is set; footprint check → out_of_scope).
4. Unit tests in agent/tests/test_tools.py with BigQuery mocked at bq.run: happy path,
   out_of_scope, error-as-data, spacing logic in ranking.
5. Run pytest, then `adk web`. Ask planner questions 1–4 and show me the tool-call trace for each.
   Every number in the answers must appear in a tool response. Point out any that don't.
```

## Agent lane (2nd person): MCP Toolbox

```text
/agents → agent-engineer
Read skills/mcp-toolbox. Project <PROJECT_ID>.
1. Create toolbox/tools.yaml from the skill's resources. Look up the latest Toolbox release
   tag, propose it as TOOLBOX_VERSION, and check the tools.yaml schema for that version.
2. Run Toolbox locally in Docker against tools.yaml with my ADC and curl the toolset to prove it parses.
3. Wire it into agent.py as an McpToolset behind TOOLBOX_URL (empty = disabled; the agent must
   still start if Toolbox is down). Use http://localhost:<port> for now.
4. In adk web, ask "How many days did the city hit 100°F each year?" and show that the Toolbox
   tool (city_heat_days_by_year) or get_heat_frequency was called.
5. Record in docs/DECISIONS.md which questions go through MCP and which through Python tools, and why.
```

## Agent lane: system instruction

```text
Review agent/heat_planner/prompts.py against our track (<TRACK>) and persona (story/persona.md).
Tighten the tool-routing section for our track's central question. Add 3 refusal examples
specific to <CITY>. Bump PROMPT_VERSION. Then run the refusal cases from
skills/adk-agent/examples/planner.evalset.json in adk web and report pass/fail per case.
```

## Front end: switch from mock to local agent

```text
/agents → frontend-engineer
The agent runs locally via `adk api_server` on port <PORT> (or adk web). Add a backend client
for POST /apps/heat_planner/users/{uid}/sessions/{sid} and POST /run. Parse functionResponse
parts named rank_candidate_sites and assemble_placement_recommendation into the map state, and
render the final text in chat. Keep USE_MOCK as a toggle. Show it working against the local agent.
```

## Story lane

```text
/agents → story-lead
Read docs/HANDOFF.md and docs/DECISIONS.md. Fill every [TBD] you now can (spread, model metrics
vs baseline, frequency numbers). Draft slide 3 (architecture) from skills/gcp-platform's
reference architecture, simplified for a non-technical audience. List the remaining [TBD]s with owners.
```

## Failure modes this phase
- Agent "answers" by describing historical rows. Check the trace for `explain_heat_offset`.
- Data lane polishing features instead of handing off v1. Hand off at 25 minutes, iterate in Phase 4.
- Hardcoded model ids or project ids in tool code. Use config only.
