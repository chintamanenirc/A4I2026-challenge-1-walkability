# Phase prompts

Five phases, the same for every team (from the A4I kickoff slide), plus a 20-minute Step 0.
Each file has: **goal → exit criteria → one prompt per lane → hand-offs → failure modes**.
Paste a lane's prompt into `agy` (from the team repo root), then keep building on it in the
same session.

| # | Phase | Time | Clock (from start) | Stack on the slide | File |
|---|---|---|---|---|---|
| 0 | Kickoff | 20 min | 0:00–0:20 | team, repo, city, track | `00-kickoff.md` |
| 1 | Load & Explore | ~40 min | 0:20–1:00 | your team's repo · BigQuery · Colab Enterprise · (+ your own data) | `01-load-and-explore.md` |
| 2 | Build | ~60 min | 1:00–2:00 | ADK · MCP Server · Gemini models · (Antigravity) | `02-build.md` |
| 3 | Deploy | ~30 min | 2:00–2:30 | Agent Runtime · or Cloud Run | `03-deploy.md` |
| 4 | Differentiate | ~70 min | 2:30–3:40 | **named in your repo: BigQuery ML** | `04-differentiate.md` |
| 5 | Show | ~60 min | 3:40–4:40 | your UI · Gemini (Enterprise) · or ADK Web | `05-show.md` |

`99-utility-prompts.md` has reusable prompts: stuck on an error, phase-gate review, merge, and the cut decision.

## How to use them with agy

```bash
agy                      # from the team repo root, after running install.sh
/agents                  # pick a lane specialist as the primary agent (e.g. ml-engineer)
/heat-data               # skills are slash commands too
```
Placeholders look like `<CITY>`. Replace them, or fill `AGENTS.md → Team decisions` once and say
"use the team decisions in AGENTS.md".

## Ground rules baked into every prompt
- **Verify, then claim.** The agent pastes real command output, not "should work".
- **Contracts over coordination.** Lanes meet at `docs/HANDOFF.md`, `docs/contracts/`, and
  `sql/serve/explain_point.sql`.
- **Record decisions** in `docs/DECISIONS.md`. That file *is* the Rigor section of the deck.
- **Ask before destructive or cloud-mutating commands.** Shared project, shared tables.
