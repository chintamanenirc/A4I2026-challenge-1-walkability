# Phase 3: Deploy (~30 min)

**Slide stack:** Agent Runtime · or Cloud Run

**Goal:** the agent and the MCP Toolbox run on Google Cloud: warm, least-privilege, observable,
smoke-tested from the presenting laptop. After this, every improvement is a redeploy, not a migration.

## Exit criteria
- [ ] `heat-toolbox` on Cloud Run: private, `min-instances=1`, pinned image. URL in HANDOFF.
- [ ] Agent deployed (Cloud Run with `--with_ui`, or Agent Runtime), running as `heat-agent-sa`
      (or the Agent Runtime service agent with BigQuery grants).
- [ ] `infra/smoke.sh` passes against the deployed agent; tool calls are visible.
- [ ] Logs and traces are visible; nothing secret is in env vars or git.
- [ ] Runtime decision + reason is recorded in DECISIONS.md.

---

## Platform: decide the runtime (2 min, with the team lead)

```text
/agents → platform-engineer
Read skills/gcp-platform → "Choose the agent runtime". Our front end is <INTERFACE>.
Recommend Cloud Run or Agent Runtime in 3 sentences, with the trade-off we're accepting.
Write it to docs/DECISIONS.md after I confirm.
```

## Platform: deploy Toolbox

```text
/agents → platform-engineer
Read skills/mcp-toolbox and skills/gcp-platform. Project <PROJECT_ID>, region us-central1,
team <TEAM>, TOOLBOX_VERSION <VERSION from Phase 2>.
1. Show me infra/deploy_toolbox.sh and list exactly which resources it creates or changes.
2. After I approve, run it. Paste the smoke-test output.
3. Write TOOLBOX_URL to docs/HANDOFF.md and to agent/heat_planner/.env.
If you hit a permission error, quote the principal and the missing permission, and propose the
narrowest grant. Don't apply it until I approve.
```

## Platform: deploy the agent

```text
/agents → platform-engineer
Deploy agent/heat_planner from main with TARGET=<cloud_run|agent_runtime>.
1. Run `adk deploy <target> --help` on our pinned ADK and reconcile infra/deploy_agent.sh flags
   with it. Show me the diff.
2. Confirm .env has AGENT_MODEL, WRITER_MODEL, BQML_MODEL_ID, TOOLBOX_URL, and has NO secrets.
   If we use Maps, create secret maps-api-key from my input (ask me for it), not from a file in git.
3. After I approve, run the deploy. Then run infra/smoke.sh against the deployed URL and paste
   the tools called and the answers.
4. Show the last 20 log lines for the service and confirm a trace exists in Cloud Trace.
5. Write the agent URL (and the adk web UI URL if Cloud Run --with_ui) into docs/HANDOFF.md.
```

## Agent lane, in parallel: pre-deploy gate

```text
/agents → agent-engineer
Before the platform engineer deploys: run pytest -m "not live" and the eval set. Fix anything red.
Grep agent/ for hardcoded project ids, model ids, localhost URLs and "# STUB". Report findings.
Then merge agent → main.
```

## Front end: point at the deployed agent

```text
/agents → frontend-engineer
Point the backend at the deployed agent URL from docs/HANDOFF.md (server-side identity token if
the service is private). Deploy the frontend to Cloud Run as heat-planner-ui with
min-instances=1, and open it from the presenting laptop. Report the URL and one round-trip.
If our interface is Gemini Enterprise instead, list the exact console steps to register the
Agent Runtime agent and what a planner will see.
```

## Gate review (team lead)

```text
/agents → judge-reviewer
Run skills/judge-review focusing on "Hard requirements" and "Engineering". Blockers only, with evidence.
```

## Failure modes this phase
- `PERMISSION_DENIED` on BigQuery from the deployed agent: the runtime identity lacks `bigquery.jobUser`
  or dataViewer on `a4i_ml`. Re-run `bootstrap.sh` (Agent Runtime: after the first deploy).
- First request is slow on stage because of a cold start: set `min-instances=1` on every demoed service.
- `:latest` image or unpinned packages, so a deploy changes behaviour: pin versions.
