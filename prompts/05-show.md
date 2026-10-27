# Phase 5: Show (~60 min)

**Slide stack:** your UI · Gemini (Enterprise) · or ADK Web

**Goal:** a submission that answers every judge question without anyone in the room: repo,
Skills project link, deck, and a pitch video recorded on the **deployed** system.

**Code freeze at the start of this phase.** Only fixes merge, and the tech lead approves each one.

## Exit criteria
- [ ] Repo README (team's own, top of repo): what it is, city/track/scenario, architecture
      diagram, how to run, interface choice + why, limitations, data credits/licenses.
- [ ] Deck (≤7 slides) with every [TBD] resolved from DECISIONS/HANDOFF.
- [ ] Demo rehearsed twice, ≤2 min, timed out loud. Fallback screenshots saved.
- [ ] Pitch video recorded on the deployed app; backup take saved.
- [ ] `story/rubric_map.md` has no empty cells.
- [ ] Submitted at the portal: repo link, Skills project link, deck, video.

---

## Front end: final polish + demo hardening (first 25 min)

```text
/agents → frontend-engineer
Code freeze is on, so only fixes. On the presenting laptop and browser:
1. Open the deployed UI and run the demo script questions in order. Time each response.
2. Fix only what breaks the demo: unreadable text on a projector, pins not rendering, long waits
   without a loading state.
3. Pre-warm script: one command that calls the agent and Toolbox once (run it 2 min before recording).
4. Save fallback screenshots of each demo step to story/fallback/.
```

## Story lead: deck + script final

```text
/agents → story-lead
Read docs/DECISIONS.md, docs/HANDOFF.md, story/*. Produce:
1. story/deck.md, the final 7-slide content with speaker notes, every number sourced (cite the
   doc line). Slide 2 is the map + 3 sites from the latest deployed run.
2. story/demo_script.md, final ≤2 min, with exact questions and what to point at on screen,
   including showing one UNMEASURED site and one honest refusal.
3. story/rubric_map.md, complete. Flag any rubric question we don't answer.
4. A 30-second "if we're cut off after slide 2" version of the pitch.
```

## Tech lead: team README

```text
/agents → tech-lead
Write the team repo README.md (replace the challenge text at the top or move it to
docs/CHALLENGE.md, whichever the team agreed). Sections: one-paragraph pitch · city, track and
scenario · architecture diagram (mermaid) · the three contracts · how to run locally · how
to deploy (infra/*) · how we evaluated (metrics vs baseline, spatial split) · equity audit result ·
interface choice and why · limitations · data sources, licenses and credits · team.
Every claim must match the code and DECISIONS.md. Show me the diff before committing.
```

## Final gate (team lead, before recording)

```text
/agents → judge-reviewer
Final skills/judge-review against main and the deployed URLs. Blockers and Majors only.
Then check: no secrets in git history (git log -p | grep for key patterns), README matches the
code, the deck's numbers match DECISIONS.md.
```

## Recording checklist (humans)
1. Run the pre-warm script. Close notifications. Use a clean browser profile, zoom 125%.
2. One narrator. Follow the script. Show: the question → tool trace (briefly) → answer → map.
3. Say out loud: "offset, not temperature", "this site was never measured", the audit numbers,
   one limitation.
4. Watch the take back once before submitting. Submit early; resubmit if the portal allows.

## After submission
Run `bash infra/teardown.sh` to **print** scale-to-zero commands. Keep services up until judging closes.
