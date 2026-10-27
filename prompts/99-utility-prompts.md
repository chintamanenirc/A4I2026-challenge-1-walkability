# Utility prompts (any phase)

## Stuck on an error
```text
Here is the error and the command that produced it:
<PASTE>
Diagnose it from our code and the relevant skill. Give the most likely cause first, the one
command or edit that confirms it, then the fix. Don't apply changes to cloud resources without asking.
```

## Data looks wrong
```text
/agents → data-engineer
Something looks off: <SYMPTOM>. Run the validation SQL and the notebook's diagnostic checks
read-only, and compare against the known traps (sentinels, Celsius, LPAD, SAFE_CAST, string
lat/lon, wrong dataset location, empty join). Report the evidence before proposing a fix.
```

## Model suspiciously good / bad
```text
/agents → ml-engineer
Our eval R² is <X>, MAE <Y>, baseline <Z>. Audit for leakage (features derived from drive-day
measurements, labels, or near-duplicate cells across the split) and for split degeneracy. Show
the evidence query for each hypothesis you rule in or out.
```

## Agent doesn't call the model
```text
/agents → agent-engineer
For the question "<Q>", the agent answered without calling explain_heat_offset. Show me the trace,
then fix it in this order: tool docstring clarity → system-instruction routing rule → a short
example in the instruction. Re-run the eval set after each change and stop at the first fix that passes.
```

## Phase gate
```text
/agents → tech-lead
We're at the end of Phase <N>. Check the exit criteria in prompts/0<N>-*.md against the repo,
docs and deployed URLs, with evidence. Then run judge-reviewer. Give me: done/not done,
blockers with owners, and the single cut you recommend if we're behind.
```

## Cut decision
```text
/agents → tech-lead
We have <MIN> minutes left before recording and these items open: <LIST>. Rank them by rubric
points per minute (Impact 30, Technical 30, Rigor 25, Craft 15, +10 range). Never cut the BQML tool
call, the deploy, the audit or the limitations. Recommend what to cut and say why in one line each.
```

## Merge to main
```text
Prepare a merge of branch <BRANCH> into main: show the diff summary, run tests, check for secrets
and hardcoded ids, and write a short merge description listing contract changes (schema, SQL, env)
other lanes must know about. Don't push until I approve.
```

## Write a decision down
```text
Append to docs/DECISIONS.md: decision "<WHAT>", alternatives "<A, B>", why "<WHY>", evidence
"<metric/command/link>". Keep it to one row.
```
