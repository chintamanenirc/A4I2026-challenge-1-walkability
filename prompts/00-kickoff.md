# Phase 0: Kickoff (20 min, everyone)

**Goal:** decide city, track, scenario, interface hypothesis and lanes before anyone types.
Set up the repo so every lane's agy session starts with the same constitution.

## Exit criteria
- [ ] Team repo created from the template; everyone is a collaborator; URL is visible to all.
- [ ] `AGENTS.md → Team decisions` filled in and committed to `main`.
- [ ] Kit installed (`AGENTS.md`, `.agents/`, `prompts/`, `docs/` skeleton) and committed.
- [ ] Lane branches exist: `data`, `agent`, `frontend`, `story` (+ `infra` if a platform person exists).
- [ ] Named owners: team lead (makes cuts), repo owner, one loader, one deployer.

## Human checklist (team lead, ~10 min)
1. City: pick from the tested list (Houston, Chicago, Seattle, Atlanta, Dallas, LA Central,
   Brooklyn, Manhattan/Bronx). Bigger = richer model, slower load.
2. Track: ⚡ Today (dispatcher, 20-minute action) · 🏛️ Budget cycle (3–4 permanent sites,
   council) · 🌳 Decade (drivers → interventions).
3. Scenario sentence. Write it where everyone can see it.
4. Lanes: Data 2–3 (incl. ML) · Agent 2–3 · Front end 2 · Story 1–2 · (platform: one of the agent lane).

## Prompt: repo owner, in Cloud Shell, in the cloned team repo

```text
Use the team decisions below to set up this repository for the day. Do not touch notebooks/,
scripts/load.sh or data/: those are the challenge's on-ramp.

City: <CITY>. Track: <TRACK>. Scenario: "<SCENARIO SENTENCE>". GCP project: <PROJECT_ID>.
Front-end hypothesis: <adk web | Gemini Enterprise | custom>. Deploy target hypothesis: <Cloud Run | Agent Runtime>.

1. Fill the "Team decisions" table in AGENTS.md with these values.
2. Create docs/DECISIONS.md (columns: time · lane · decision · alternatives · why · evidence),
   docs/HANDOFF.md (sections: Data tables, Model, Serve SQL, Toolbox URL, Agent URL, UI URL),
   and docs/contracts/ (empty for now, with a README saying the agent lane owns it).
3. Create directories with .gitkeep: agent/, sql/{features,train,eval,serve,audit}/, toolbox/,
   infra/, frontend/, story/, tests/.
4. Copy .agents/skills/gcp-platform/scripts/*.sh into infra/.
5. Add to .gitignore: .env, agent/**/.env, *.bak, .venv/, node_modules/.
6. Show me `git status` and the diff summary. Don't commit until I approve.
Then create branches data, agent, frontend, story from main and push them after I approve.
```

## Prompt: platform owner (run once, can overlap with Phase 1)

```text
/agents → platform-engineer
Read skills/gcp-platform. Then, for project <PROJECT_ID>, region us-central1, team <TEAM>:
1. Show me infra/bootstrap.sh and explain in one line each what it will change.
2. After I approve, run it and paste the output.
3. Verify: both service accounts exist, datasets a4i_climate and a4i_ml exist in US,
   and heat-agent-sa has dataViewer on both (query INFORMATION_SCHEMA.OBJECT_PRIVILEGES).
Record what you did in docs/DECISIONS.md.
```

## Prompt: anyone, to verify agy is set up correctly

```text
List the skills, rules and agents you can see in this workspace, and summarize the
non-negotiables from AGENTS.md in five bullets. Don't change anything.
```
