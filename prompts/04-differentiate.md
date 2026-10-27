# Phase 4: Differentiate (~70 min): BigQuery ML

**Slide:** "Step 4 is different for every table. Yours is named in your repo." For Challenge 1
that's **BigQuery ML**, and specifically `ML.EXPLAIN_PREDICT`: a prediction for places nobody
measured, *with the reason attached*.

**Goal:** turn "a model exists" into "the model is the argument". Deeper features, honest
evaluation, track-specific use of attributions, and the equity audit as a centerpiece.

## Exit criteria
- [ ] At least one feature iteration (`offset_model_v2`), compared to v1 on the **same** spatial split; promoted only if better.
- [ ] Global drivers (ML.GLOBAL_EXPLAIN) translated into a one-sentence city-level finding.
- [ ] Track-specific depth shipped (see below).
- [ ] `run_equity_audit` + `assemble_placement_recommendation` implemented; the audit result is recorded with numbers.
- [ ] All 7 planner questions + the refusal set pass on the **deployed** agent (redeploy done).
- [ ] DECISIONS.md has: leakage avoided, split rationale, metric vs baseline (v1, v2), data licenses.

---

## Data/ML lane: feature iteration (≤40 min, then freeze)

```text
/agents → ml-engineer
Read skills/bqml-offset-model → "Feature backlog". City <CITY>, track <TRACK>.
1. Look at the v1 residuals by eval block (03_evaluate.sql §3). Where is it most wrong, and what
   physical feature would explain that error? Propose the top 2 candidate features we can
   actually get in 20 minutes, with their sources and licenses (EPA Smart Location DB is CC0;
   NYC tree census is in BigQuery; city portals need a license check; no OSM).
2. After I pick one: load it into a4i_extra, extend point_features (new version of the function
   if needed so v1 keeps working), retrain as offset_model_v2 on the same is_eval split.
3. Show v1 vs v2: MAE, RMSE, R² on eval, baseline, and GLOBAL_EXPLAIN side by side.
4. If v2 wins: rebuild grid_predictions with model_version='offset_model_v2' and tell the agent
   lane to set BQML_MODEL_ID. If not: keep v1 and write down why. A negative result is still a result.
5. Write a one-sentence city-level finding from GLOBAL_EXPLAIN for the deck, e.g.
   "In <CITY>, housing density within 1.5 km explains more of the street-level heat than anything else."
```

## Agent lane: track-specific depth

Pick the block for your track.

**⚡ Today**
```text
/agents → agent-engineer
Make rank_candidate_sites produce a dispatcher run sheet: 8 stops, at least 600 m apart, weighted to
no_vehicle_rate and median_age, each with coordinates, nearest address hint (geocode reverse if
MAPS_API_KEY exists), offset, implied local high for the given forecast, and a one-line reason.
Add a "route order" (greedy nearest-neighbour from a depot lat/lon parameter). Tests + eval case.
```

**🏛️ This budget cycle**
```text
/agents → agent-engineer
Pair every recommended site with heat frequency: expected days/yr at or above (95°F − offset)
city-wide, i.e. how often THIS site sees ≥95°F-equivalent conditions, derived from GHCN plus the
offset. Label it clearly as an estimate. Add a compare_sites(site_a, site_b) tool that returns a
side-by-side (offset, drivers, people, % no car, frequency) for the "make the case for each" question.
```

**🌳 This decade**
```text
/agents → agent-engineer
Add diagnose_intervention(lat, lon): map the dominant positive driver to an intervention class
(built density / old stock → canopy and open space; impervious → cool pavement; if canopy data
was added: low canopy → planting), and return the °F share that driver explains. The tool must
also state that the effect of the intervention can't be simulated from this data.
Add a neighbourhood-scale rollup: top 5 tracts by population-weighted offset with their dominant driver.
```

## Agent lane: audit + artifact

```text
/agents → agent-engineer
Read skills/equity-audit and skills/placement-recommendation.
1. Implement run_equity_audit using resources/audit.sql, defaulting to state["last_ranked_sites"].
   Return the metric table and a one-sentence finding with ratios.
2. Implement assemble_placement_recommendation(scenario, forecast_high_f): build the full
   PlacementRecommendation from state + frequency + audit + the limitations block; store it in state.
3. Update the system instruction so "draft the proposal" uses WRITER_MODEL-quality structure
   (decision → sites → why → who → how often → equity → cost → limitations → credits) and only
   numbers present in the JSON.
4. Run all 7 planner questions + the refusal set locally. Then ask platform-engineer to redeploy,
   and re-run infra/smoke.sh plus questions 6 and 7 against the deployed agent.
```

## Data lane: audit sensitivity (the slide most teams don't have)

```text
/agents → data-engineer
Using sql/audit/audit.sql: run the audit for (a) our track-weighted top sites and (b) a hazard-only
ranking (w_hazard=1, others 0). Show both tables side by side and write two sentences: what changed,
and what that says about "where it's hot" vs "where heat hurts". Save to docs/DECISIONS.md.
Optional, output-check only: compare racial composition of the recommended tracts vs the city,
pulling ACS race columns directly in sql/audit/. Never feed them back into ranking. Label it as audit-only.
```

## Gate review

```text
/agents → judge-reviewer
Full skills/judge-review. Rank findings. Then list the three highest-leverage fixes for the remaining time.
```

## Failure modes this phase
- Chasing accuracy past 40 minutes. Freeze features at 3:10 on the clock.
- Promoting v2 without the same split, or without rebuilding grid_predictions.
- Audit as a footnote. It's a slide and a demo step.
