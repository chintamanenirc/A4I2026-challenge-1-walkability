export type AgentStatus = "Idle" | "Executing" | "Waiting for Human" | "Failed";

export type ToolCategory =
  | "execute_sql"
  | "fetch_webpage"
  | "explain_heat_offset"
  | "select_cooling_center_sites"
  | "run_equity_audit"
  | "compile_council_memo";

export interface SpecializedAgent {
  id: string;
  name: string;
  role: string;
  codename: string;
  status: AgentStatus;
  model: string;
  description: string;
  currentTask: string;
  tools: ToolCategory[];
  tokensUsed: number;
  avgLatencyMs: number;
  groundingScore: string;
}

export interface ThoughtStep {
  id: string;
  index: number;
  title: string;
  detail: string;
  durationMs: number;
  status: "completed" | "processing" | "pending";
  agentCodename: string;
}

export interface ToolCallItem {
  id: string;
  toolName: ToolCategory;
  agentCodename: string;
  status: "success" | "running" | "waiting_approval" | "error";
  durationMs: number;
  parameters: Record<string, unknown>;
  output: Record<string, unknown>;
  sqlOrCodeSnippet: string;
  sandboxTab: "canvas" | "sandbox" | "metrics";
  linkedSiteRank?: number;
}

export interface ApprovalGateState {
  id: string;
  title: string;
  riskLevel: "critical" | "high" | "medium";
  agentName: string;
  actionType: string;
  summary: string;
  budgetImpact: string;
  affectedTracts: string[];
  permissionsRequested: string[];
  status: "pending" | "approved" | "denied" | "corrected";
  userFeedback?: string;
  resolvedAt?: string;
}

export interface SubTaskItem {
  id: string;
  label: string;
  status: "completed" | "current" | "scheduled";
  agentCodename: string;
  durationMs?: number;
}

export interface TokenUsageMetrics {
  promptTokens: number;
  reasoningTokens: number;
  toolIoTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextWindowLimit: number;
  estimatedCostUsd: number;
  inputRatePer1M: number;
  outputRatePer1M: number;
}

export interface StepTimerItem {
  id: string;
  stepName: string;
  agentCodename: string;
  durationMs: number;
  percentageOfTotal: number;
  status: "completed" | "running" | "waiting";
}

export interface AgentCitation {
  tractFips: string;
  neighborhood: string;
  metric: string;
  value: string;
  sourceTable: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  timestamp: string;
  content: string;
  agentId?: string;
  agentName?: string;
  agentModel?: string;
  progressPct?: number;
  isStreaming?: boolean;
  thoughtSteps?: ThoughtStep[];
  toolCalls?: ToolCallItem[];
  subTasks?: SubTaskItem[];
  approvalGate?: ApprovalGateState;
  citations?: AgentCitation[];
  groundingStatus?: {
    passed: boolean;
    checkedCount: number;
    withinToleranceCount: number;
    methodologicalGate: "PASSED" | "SCOPE_REFUSED" | "PENDING_HITL";
  };
  latencyMs?: number;
  tokenMetrics?: TokenUsageMetrics;
  stepTimers?: StepTimerItem[];
  linkedSiteRank?: number;
}

export interface AgentSession {
  id: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  activeAgentId: string;
  badge: string;
  status: AgentStatus;
  messages: AgentMessage[];
}

/* -------------------------------------------------------------------------- */
/*                          Specialized Agents Roster                         */
/* -------------------------------------------------------------------------- */

export const INITIAL_SPECIALIZED_AGENTS: SpecializedAgent[] = [
  {
    id: "orchestrator-agent",
    name: "HeatPlanner Orchestrator",
    role: "Lead Multi-Agent Coordinator & Grounding Verifier",
    codename: "orchestrator.v2",
    status: "Waiting for Human",
    model: "gemini-2.5-pro-agentic",
    description:
      "Routes multi-step municipal planning queries, enforces Stage-2 methodological scope guardrails, and gates capital budget commitments on Human-In-The-Loop approval.",
    currentTask: "Awaiting HITL sign-off on $540,000 FY26 Cooling Center Capital Allocation",
    tools: [
      "select_cooling_center_sites",
      "compile_council_memo",
      "run_equity_audit",
    ],
    tokensUsed: 14820,
    avgLatencyMs: 640,
    groundingScore: "100% (±0.01°F)",
  },
  {
    id: "data-analyst-agent",
    name: "Data Analyst Agent",
    role: "BigQuery ML & GHCN Climate Attribution Modeler",
    codename: "bqml-analyst.sql",
    status: "Idle",
    model: "gemini-2.5-pro + bqml",
    description:
      "Executes deterministic SQL and ML.EXPLAIN_PREDICT against a4i_ml.offset_model_v1 (R² = 0.72, 7-yr GHCN hot-day baseline 91.6°F across 207 Fulton County tracts).",
    currentTask: "Indexed 207 census tracts & 698 top-decile GHCN hot days (2018–2024)",
    tools: ["execute_sql", "explain_heat_offset"],
    tokensUsed: 21450,
    avgLatencyMs: 410,
    groundingScore: "100% SQL Verified",
  },
  {
    id: "browser-spatial-agent",
    name: "Browser & Spatial Agent",
    role: "TIGER/Line Walkability & Street View Inspector",
    codename: "spatial-browser.mcp",
    status: "Idle",
    model: "gemini-2.5-flash-spatial",
    description:
      "Scrapes Fulton County parcel metadata, resolves neighborhood polygon centroids, and inspects 10-minute (0.5-mile) pedestrian walkability catchments.",
    currentTask: "Rendered 0.5-mi pedestrian isochrones for Sites #1–#5",
    tools: ["fetch_webpage", "select_cooling_center_sites"],
    tokensUsed: 9340,
    avgLatencyMs: 520,
    groundingScore: "NAD83 / WGS84 Synced",
  },
  {
    id: "code-equity-agent",
    name: "Code & Equity Verifier",
    role: "Justice40 Audit & Policy Artifact Generator",
    codename: "equity-verifier.ts",
    status: "Idle",
    model: "gemini-2.5-pro-verifier",
    description:
      "Computes correlation r between urban heat offset and CDC SVI / poverty rates, validates numerical claims against BigQuery rows, and compiles council memos.",
    currentTask: "Verified Justice40 Priority Threshold (SVI ≥ 0.75) across 3 selected sites",
    tools: ["run_equity_audit", "execute_sql", "compile_council_memo"],
    tokensUsed: 11290,
    avgLatencyMs: 380,
    groundingScore: "0 Hallucinations",
  },
];

/* -------------------------------------------------------------------------- */
/*                       Pre-built Multi-Step Sessions                        */
/* -------------------------------------------------------------------------- */

export const INITIAL_SESSIONS: AgentSession[] = [
  {
    id: "siting-fy26-approval",
    title: "FY26 Cooling Center Siting & $540k Approval",
    subtitle: "3 sites · 1.5km spacing · Waiting for HITL budget sign-off",
    updatedAt: "Just now",
    activeAgentId: "orchestrator-agent",
    badge: "HITL Gate Active",
    status: "Waiting for Human",
    messages: [
      {
        id: "msg-user-1",
        role: "user",
        timestamp: "14:21:04",
        content:
          "Run the full FY2026 Cooling Center Siting optimization for $540,000 (3 centers at $180k each) with a 1.5 km minimum spacing constraint. Audit the equity distribution across vulnerable tracts and prepare the City Council capital deployment memo.",
      },
      {
        id: "msg-agent-1",
        role: "assistant",
        timestamp: "14:21:08",
        agentId: "orchestrator-agent",
        agentName: "HeatPlanner Orchestrator",
        agentModel: "gemini-2.5-pro-agentic",
        progressPct: 82,
        isStreaming: false,
        linkedSiteRank: 1,
        latencyMs: 1840,
        groundingStatus: {
          passed: true,
          checkedCount: 14,
          withinToleranceCount: 14,
          methodologicalGate: "PENDING_HITL",
        },
        subTasks: [
          {
            id: "st-1",
            label: "Scraped TIGER/ACS & GHCN Station Docs",
            status: "completed",
            agentCodename: "spatial-browser.mcp",
            durationMs: 340,
          },
          {
            id: "st-2",
            label: "Executed BQML EXPLAIN_PREDICT SQL",
            status: "completed",
            agentCodename: "bqml-analyst.sql",
            durationMs: 520,
          },
          {
            id: "st-3",
            label: "Solved 1.5km Spatial Siting + Equity Audit",
            status: "completed",
            agentCodename: "equity-verifier.ts",
            durationMs: 490,
          },
          {
            id: "st-4",
            label: "Awaiting Human Approval ($540k Capital Lock)",
            status: "current",
            agentCodename: "orchestrator.v2",
            durationMs: 490,
          },
          {
            id: "st-5",
            label: "Dispatch Signed FY26 Council Ordinance Packet",
            status: "scheduled",
            agentCodename: "equity-verifier.ts",
          },
        ],
        thoughtSteps: [
          {
            id: "th-1",
            index: 1,
            title: "Decomposing municipal siting constraint & Stage-1 intent routing",
            detail:
              "Parsed parameters: budget = $540,000 ($180,000 × 3 facilities), min_distance_km = 1.5, objective = composite heat-vulnerability index (0.45 Heat Offset + 0.35 CDC SVI + 0.20 Walk-Shed Population Density). Methodological scope check PASSED (observational cross-sectional optimization).",
            durationMs: 210,
            status: "completed",
            agentCodename: "orchestrator.v2",
          },
          {
            id: "th-2",
            index: 2,
            title: "Querying BigQuery ML offset_model_v1 across 207 Fulton County tracts",
            detail:
              "Delegated to Data Analyst Agent (bqml-analyst.sql) to fetch top-decile urban heat islands calibrated against 7-year GHCN summer hot-day baseline (91.6°F, 2018–2024). Extracted local feature attributions for impervious surface, tree canopy deficit, and albedo.",
            durationMs: 520,
            status: "completed",
            agentCodename: "bqml-analyst.sql",
          },
          {
            id: "th-3",
            index: 3,
            title: "Applying 1.5 km Haversine exclusion & 10-minute walkability verification",
            detail:
              "Selected Rank #1 Mechanicsville (Tract 13121006700, +4.3°F), Rank #2 West End / English Ave (Tract 13121005501, +4.1°F, 2.84 km from #1), and Rank #3 Sweet Auburn / Old Fourth Ward (Tract 13121004400, +3.9°F, 2.41 km from #1). Candidate #4 Adair Park (+3.8°F) was deprioritized due to 38% walk-shed overlap with Site #1.",
            durationMs: 610,
            status: "completed",
            agentCodename: "spatial-browser.mcp",
          },
          {
            id: "th-4",
            index: 4,
            title: "Pausing execution at Human-In-The-Loop Governance Gate",
            detail:
              "Committing $540,000 from the FY2026 Sustainability & Resilience Capital Fund and transmitting the binding City Council ordinance memo requires explicit human operator authorization.",
            durationMs: 500,
            status: "processing",
            agentCodename: "orchestrator.v2",
          },
        ],
        toolCalls: [
          {
            id: "tc-sql-1",
            toolName: "execute_sql",
            agentCodename: "bqml-analyst.sql",
            status: "success",
            durationMs: 520,
            sandboxTab: "sandbox",
            linkedSiteRank: 1,
            parameters: {
              project_id: "atlanta-heat-planner-2026",
              dataset: "a4i_ml",
              model: "offset_model_v1",
              top_k_tracts: 15,
              ghcn_baseline_f: 91.6,
            },
            output: {
              rows_scanned: 207,
              top_tract_fips: "13121006700",
              top_neighborhood: "Mechanicsville / Pittsburgh",
              predicted_uhi_offset_f: 4.3,
              estimated_peak_temp_f: 95.9,
              model_r2: 0.72,
              status: "VERIFIED_BIGQUERY_RESULT",
            },
            sqlOrCodeSnippet: `SELECT
  tract_fips,
  neighborhood_name,
  ROUND(predicted_heat_offset_f, 2) AS heat_offset_f,
  ROUND(91.6 + predicted_heat_offset_f, 1) AS est_summer_peak_f,
  ROUND(svi_percentile, 2) AS cdc_svi,
  ROUND(tree_canopy_pct, 1) AS canopy_pct,
  ROUND(impervious_surface_pct, 1) AS impervious_pct
FROM
  ML.EXPLAIN_PREDICT(
    MODEL \`a4i_ml.offset_model_v1\`,
    TABLE \`a4i_gold.fulton_tract_features_2024\`,
    STRUCT(3 AS top_k_features)
  )
WHERE county_fips = '13121'
ORDER BY (0.45 * norm_heat + 0.35 * svi_percentile + 0.20 * norm_pop_density) DESC
LIMIT 5;`,
          },
          {
            id: "tc-web-2",
            toolName: "fetch_webpage",
            agentCodename: "spatial-browser.mcp",
            status: "success",
            durationMs: 340,
            sandboxTab: "canvas",
            linkedSiteRank: 1,
            parameters: {
              url: "https://gis.atlantaga.gov/dpcd/cooling-corridors/tracts/13121006700",
              layer: "TIGER_2024_WalkShed_800m",
              verify_ada_access: true,
            },
            output: {
              http_status: 200,
              parcel_anchor: "Rosa L. Burney Park / Windsor St Corridor",
              centroid_lat: 33.737,
              centroid_lon: -84.401,
              walkshed_10min_residents: 6180,
              marta_bus_stops_within_400m: 4,
            },
            sqlOrCodeSnippet: `// MCP Spatial Browser Extraction — gis.atlantaga.gov
{
  "tract_fips": "13121006700",
  "anchor_facility": "Mechanicsville Recreation & Library Annex",
  "coordinates": { "lat": 33.7370, "lng": -84.4010 },
  "walkshed_isochrone_m": 800,
  "pedestrian_network_coverage": 0.91,
  "marta_connectivity": ["Route 55", "Route 79", "Garnett Station (0.7 mi)"]
}`,
          },
          {
            id: "tc-siting-3",
            toolName: "select_cooling_center_sites",
            agentCodename: "orchestrator.v2",
            status: "success",
            durationMs: 490,
            sandboxTab: "canvas",
            linkedSiteRank: 1,
            parameters: {
              k_sites: 3,
              min_distance_km: 1.5,
              unit_cost_usd: 180000,
              total_budget_usd: 540000,
              weights: { heat: 0.45, svi: 0.35, density: 0.2 },
            },
            output: {
              selected_sites: [
                {
                  rank: 1,
                  tract_fips: "13121006700",
                  neighborhood: "Mechanicsville / Pittsburgh",
                  heat_offset_f: "+4.3°F",
                  svi: 0.94,
                  score: 0.934,
                },
                {
                  rank: 2,
                  tract_fips: "13121005501",
                  neighborhood: "West End / English Avenue",
                  heat_offset_f: "+4.1°F",
                  svi: 0.91,
                  score: 0.898,
                },
                {
                  rank: 3,
                  tract_fips: "13121004400",
                  neighborhood: "Sweet Auburn / Old Fourth Ward",
                  heat_offset_f: "+3.9°F",
                  svi: 0.86,
                  score: 0.861,
                },
              ],
              total_residents_served_10min: 19420,
              min_pairwise_spacing_km: 2.41,
            },
            sqlOrCodeSnippet: `// Greedy Spatial Optimization with 1.5km Haversine Exclusion
Selected #1: Tract 13121006700 (Mechanicsville)    | Score: 0.934 | +4.3°F
Selected #2: Tract 13121005501 (West End)          | Score: 0.898 | +4.1°F | dist(#1)=2.84km
Selected #3: Tract 13121004400 (Sweet Auburn)      | Score: 0.861 | +3.9°F | dist(#1)=2.41km, dist(#2)=3.62km
Skipped  #4: Tract 13121006802 (Adair Park)        | Score: 0.842 | +3.8°F | 38% catchment overlap w/ #1`,
          },
          {
            id: "tc-equity-4",
            toolName: "run_equity_audit",
            agentCodename: "equity-verifier.ts",
            status: "waiting_approval",
            durationMs: 490,
            sandboxTab: "sandbox",
            linkedSiteRank: 1,
            parameters: {
              jurisdiction: "Fulton County / City of Atlanta",
              justice40_svi_threshold: 0.75,
              capital_commitment_usd: 540000,
              generate_council_ordinance: true,
            },
            output: {
              pearson_r_heat_vs_poverty: 0.68,
              pearson_r_heat_vs_minority: 0.71,
              pearson_r_heat_vs_canopy_deficit: -0.79,
              justice40_compliance: "100% (3 of 3 sites in SVI >= 0.85 tracts)",
              governance_gate: "BLOCKED_ON_HUMAN_APPROVAL",
            },
            sqlOrCodeSnippet: `--- a/ordinances/fy2026_cooling_capital_allocation.md
+++ b/ordinances/fy2026_cooling_capital_allocation.md
@@ -12,6 +12,11 @@
-STATUS: DRAFT_PENDING_SITING_VERIFICATION
+STATUS: READY_FOR_COUNCIL_APPROVAL
+CAPITAL_ENCUMBRANCE_USD: $540,000.00 (3 x $180,000.00)
+PRIMARY_SITES:
+  1. Tract 13121006700 — Mechanicsville (+4.3°F offset, SVI 0.94)
+  2. Tract 13121005501 — West End / English Ave (+4.1°F offset, SVI 0.91)
+  3. Tract 13121004400 — Sweet Auburn / Old Fourth Ward (+3.9°F offset, SVI 0.86)
+JUSTICE40_CERTIFICATION: PASSED (Mean SVI = 0.903, 19,420 residents within 800m walk-shed)`,
          },
        ],
        approvalGate: {
          id: "gate-fy26-budget",
          title: "Human-In-The-Loop Authorization: FY26 Capital Encumbrance & Council Dispatch",
          riskLevel: "critical",
          agentName: "HeatPlanner Orchestrator",
          actionType: "CAPITAL_BUDGET_LOCK & ORDINANCE_DISPATCH",
          summary:
            "The agent is requesting permission to lock $540,000 in FY2026 Resilience Capital Funds across Tracts 13121006700, 13121005501, and 13121004400 and transmit the signed siting packet to the City Council Clerk.",
          budgetImpact: "$540,000.00 ($180,000 × 3 sites)",
          affectedTracts: [
            "13121006700 (Mechanicsville)",
            "13121005501 (West End)",
            "13121004400 (Sweet Auburn)",
          ],
          permissionsRequested: [
            "finance.capital_budget.encumber ($540,000)",
            "council.ordinance_packet.publish",
            "bigquery.audit_log.write_signed_manifest",
          ],
          status: "pending",
        },
        citations: [
          {
            tractFips: "13121006700",
            neighborhood: "Mechanicsville / Pittsburgh",
            metric: "UHI Heat Offset",
            value: "+4.3°F (95.9°F Peak)",
            sourceTable: "a4i_ml.offset_model_v1",
          },
          {
            tractFips: "13121005501",
            neighborhood: "West End / English Ave",
            metric: "UHI Heat Offset",
            value: "+4.1°F (95.7°F Peak)",
            sourceTable: "a4i_ml.offset_model_v1",
          },
          {
            tractFips: "13121004400",
            neighborhood: "Sweet Auburn / O4W",
            metric: "UHI Heat Offset",
            value: "+3.9°F (95.5°F Peak)",
            sourceTable: "a4i_ml.offset_model_v1",
          },
        ],
        tokenMetrics: {
          promptTokens: 2840,
          reasoningTokens: 1920,
          toolIoTokens: 3410,
          completionTokens: 1180,
          totalTokens: 9350,
          contextWindowLimit: 128000,
          estimatedCostUsd: 0.0314,
          inputRatePer1M: 1.25,
          outputRatePer1M: 5.0,
        },
        stepTimers: [
          {
            id: "tm-1",
            stepName: "1. Intent & Scope Guardrail",
            agentCodename: "orchestrator.v2",
            durationMs: 210,
            percentageOfTotal: 11,
            status: "completed",
          },
          {
            id: "tm-2",
            stepName: "2. BQML EXPLAIN_PREDICT Query",
            agentCodename: "bqml-analyst.sql",
            durationMs: 520,
            percentageOfTotal: 28,
            status: "completed",
          },
          {
            id: "tm-3",
            stepName: "3. TIGER Walk-Shed & Parcel Fetch",
            agentCodename: "spatial-browser.mcp",
            durationMs: 340,
            percentageOfTotal: 19,
            status: "completed",
          },
          {
            id: "tm-4",
            stepName: "4. 1.5km Spatial Optimizer & Equity Audit",
            agentCodename: "equity-verifier.ts",
            durationMs: 490,
            percentageOfTotal: 27,
            status: "completed",
          },
          {
            id: "tm-5",
            stepName: "5. HITL Governance Gate (Waiting)",
            agentCodename: "orchestrator.v2",
            durationMs: 280,
            percentageOfTotal: 15,
            status: "waiting",
          },
        ],
        content: `### FY2026 Cooling Center Siting Optimization ($540,000 Capital Plan)

I have completed the multi-step spatial optimization and Justice40 equity verification across **207 Fulton County census tracts** calibrated against the 7-year GHCN summer hot-day baseline (**91.6°F**, 2018–2024).

#### 1. Recommended 3-Site Portfolio (1.5 km Minimum Spacing Enforced)

| Rank | Census Tract | Neighborhood | Predicted UHI Offset | Est. Summer Peak | CDC SVI | 10-Min Walk-Shed Reach | Unit Allocation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | \`13121006700\` | **Mechanicsville / Pittsburgh** | **+4.3°F** | **95.9°F** | **0.94** | 6,180 residents | $180,000 |
| **#2** | \`13121005501\` | **West End / English Avenue** | **+4.1°F** | **95.7°F** | **0.91** | 6,840 residents | $180,000 |
| **#3** | \`13121004400\` | **Sweet Auburn / Old Fourth Ward** | **+3.9°F** | **95.5°F** | **0.86** | 6,400 residents | $180,000 |

---

#### 2. Key BQML Attribution & Equity Findings
* **Primary Physical Drivers (\`ML.EXPLAIN_PREDICT\`):** Across the top 3 tracts, **impervious surface fraction (58%–64%)** and **tree canopy deficit (11.2%–14.8% vs. 36.4% county median)** account for **74.6%** of the positive heat offset attribution.
* **Why Candidate #4 (\`13121006802\` · Adair Park, +3.8°F) Was Deprioritized:** Although Adair Park ranks #4 in raw vulnerability, its 800-meter pedestrian walk-shed overlaps **38%** with Site #1 (Mechanicsville). Selecting Site #3 (Sweet Auburn, 2.41 km away) adds **+4,120 net unique residents** within a 10-minute walk.
* **Justice40 Compliance:** All 3 sites exceed the federal Justice40 threshold (**SVI ≥ 0.75**), achieving a portfolio mean SVI of **0.903** and serving **19,420 unique residents**.

> **Action Required:** Please review and resolve the **Human-In-The-Loop Approval Gate** above to authorize the **$540,000 capital encumbrance** or provide path correction feedback.`,
      },
    ],
  },
  {
    id: "mechanicsville-bqml-explain",
    title: "Mechanicsville (+4.3°F) BQML Attribution Audit",
    subtitle: "Tract 13121006700 · ML.EXPLAIN_PREDICT waterfall & GHCN stations",
    updatedAt: "18 mins ago",
    activeAgentId: "data-analyst-agent",
    badge: "SQL Verified",
    status: "Idle",
    messages: [
      {
        id: "msg-m2-user",
        role: "user",
        timestamp: "14:02:11",
        content:
          "Explain the exact BigQuery ML feature attributions driving Tract 13121006700 (Mechanicsville / Pittsburgh) to a +4.3°F urban heat offset.",
      },
      {
        id: "msg-m2-agent",
        role: "assistant",
        timestamp: "14:02:13",
        agentId: "data-analyst-agent",
        agentName: "Data Analyst Agent",
        agentModel: "gemini-2.5-pro + bqml",
        progressPct: 100,
        isStreaming: false,
        linkedSiteRank: 1,
        latencyMs: 920,
        groundingStatus: {
          passed: true,
          checkedCount: 9,
          withinToleranceCount: 9,
          methodologicalGate: "PASSED",
        },
        subTasks: [
          {
            id: "m2-st1",
            label: "Queried ML.EXPLAIN_PREDICT for 13121006700",
            status: "completed",
            agentCodename: "bqml-analyst.sql",
            durationMs: 410,
          },
          {
            id: "m2-st2",
            label: "Cross-checked GHCN 7-yr Hot-Day Baseline (91.6°F)",
            status: "completed",
            agentCodename: "bqml-analyst.sql",
            durationMs: 290,
          },
          {
            id: "m2-st3",
            label: "Verified Numerical Grounding (±0.01°F)",
            status: "completed",
            agentCodename: "equity-verifier.ts",
            durationMs: 220,
          },
        ],
        thoughtSteps: [
          {
            id: "m2-th1",
            index: 1,
            title: "Executing ML.EXPLAIN_PREDICT on a4i_ml.offset_model_v1",
            detail:
              "Queried tract_fips = '13121006700'. Model baseline_value = +1.42°F across Fulton County; tract prediction = +4.30°F (+2.88°F above county mean offset).",
            durationMs: 410,
            status: "completed",
            agentCodename: "bqml-analyst.sql",
          },
          {
            id: "m2-th2",
            index: 2,
            title: "Decomposing Shapley / linear feature attributions",
            detail:
              "Top contributors: impervious_surface_pct = 63.8% (+1.54°F attribution), tree_canopy_pct = 11.4% (+0.89°F attribution), surface_albedo = 0.13 (+0.45°F attribution).",
            durationMs: 510,
            status: "completed",
            agentCodename: "bqml-analyst.sql",
          },
        ],
        toolCalls: [
          {
            id: "m2-tc1",
            toolName: "explain_heat_offset",
            agentCodename: "bqml-analyst.sql",
            status: "success",
            durationMs: 410,
            sandboxTab: "sandbox",
            linkedSiteRank: 1,
            parameters: {
              tract_fips: "13121006700",
              model_name: "a4i_ml.offset_model_v1",
              top_k_features: 4,
            },
            output: {
              tract_fips: "13121006700",
              neighborhood: "Mechanicsville / Pittsburgh",
              predicted_offset_f: 4.3,
              ghcn_baseline_f: 91.6,
              estimated_peak_f: 95.9,
              attributions: [
                { feature: "impervious_surface_pct (63.8%)", delta_f: "+1.54°F" },
                { feature: "tree_canopy_deficit (11.4%)", delta_f: "+0.89°F" },
                { feature: "low_roof_albedo (0.13)", delta_f: "+0.45°F" },
                { feature: "county_baseline_intercept", delta_f: "+1.42°F" },
              ],
            },
            sqlOrCodeSnippet: `SELECT
  tract_fips,
  predicted_heat_offset_f,
  baseline_value,
  feature,
  ROUND(attribution, 3) AS attribution_f
FROM
  ML.EXPLAIN_PREDICT(
    MODEL \`a4i_ml.offset_model_v1\`,
    (SELECT * FROM \`a4i_gold.fulton_tract_features_2024\` WHERE tract_fips = '13121006700')
  ),
  UNNEST(top_feature_attributions)
ORDER BY ABS(attribution) DESC;`,
          },
        ],
        tokenMetrics: {
          promptTokens: 1640,
          reasoningTokens: 890,
          toolIoTokens: 1420,
          completionTokens: 780,
          totalTokens: 4730,
          contextWindowLimit: 128000,
          estimatedCostUsd: 0.0158,
          inputRatePer1M: 1.25,
          outputRatePer1M: 5.0,
        },
        stepTimers: [
          {
            id: "m2-tm1",
            stepName: "1. ML.EXPLAIN_PREDICT SQL",
            agentCodename: "bqml-analyst.sql",
            durationMs: 410,
            percentageOfTotal: 45,
            status: "completed",
          },
          {
            id: "m2-tm2",
            stepName: "2. GHCN Station Calibration",
            agentCodename: "bqml-analyst.sql",
            durationMs: 290,
            percentageOfTotal: 31,
            status: "completed",
          },
          {
            id: "m2-tm3",
            stepName: "3. Grounding Verifier Pass",
            agentCodename: "equity-verifier.ts",
            durationMs: 220,
            percentageOfTotal: 24,
            status: "completed",
          },
        ],
        content: `### BQML Feature Attribution Breakdown: Tract \`13121006700\` (Mechanicsville / Pittsburgh)

Using \`ML.EXPLAIN_PREDICT\` against \`a4i_ml.offset_model_v1\` (**R² = 0.72**), Tract \`13121006700\` exhibits a **+4.3°F** urban heat island offset above the 7-year GHCN top-decile summer baseline (**91.6°F**), yielding an estimated summer peak of **95.9°F**.

| Feature Driver | Observed Tract Value | County Median | Attribution Delta | Share of Offset |
| :--- | :--- | :--- | :--- | :--- |
| **Impervious Surface Fraction** | **63.8%** | 31.2% | **+1.54°F** | 35.8% |
| **County Baseline Intercept** | — | — | **+1.42°F** | 33.0% |
| **Tree Canopy Deficit** | **11.4% canopy** | 36.4% | **+0.89°F** | 20.7% |
| **Surface Albedo / Rail Yards** | **0.13 albedo** | 0.19 | **+0.45°F** | 10.5% |
| **Total Predicted UHI Offset** | — | — | **+4.30°F** | **100.0%** |

> *Methodological Note:* These attributions reflect cross-sectional statistical associations across Fulton County census tracts and prioritize where cooling interventions are needed most; they do not simulate dynamic fluid/radiative temperature reductions.`,
      },
    ],
  },
  {
    id: "scope-guardrail-trees",
    title: "Scope Guardrail: 500 Trees Causal Simulation",
    subtitle: "Deterministic Stage-2 methodological refusal demonstration",
    updatedAt: "42 mins ago",
    activeAgentId: "orchestrator-agent",
    badge: "Scope Refused",
    status: "Idle",
    messages: [
      {
        id: "msg-m3-user",
        role: "user",
        timestamp: "13:39:10",
        content:
          "If we plant 500 mature oak trees in Mechanicsville (Tract 13121006700) next spring, how many degrees Fahrenheit will the neighborhood temperature drop?",
      },
      {
        id: "msg-m3-agent",
        role: "assistant",
        timestamp: "13:39:11",
        agentId: "orchestrator-agent",
        agentName: "HeatPlanner Orchestrator",
        agentModel: "gemini-2.5-pro-agentic",
        progressPct: 100,
        isStreaming: false,
        linkedSiteRank: 1,
        latencyMs: 310,
        groundingStatus: {
          passed: true,
          checkedCount: 4,
          withinToleranceCount: 4,
          methodologicalGate: "SCOPE_REFUSED",
        },
        subTasks: [
          {
            id: "m3-st1",
            label: "Parsed Causal Counterfactual Intent",
            status: "completed",
            agentCodename: "orchestrator.v2",
            durationMs: 120,
          },
          {
            id: "m3-st2",
            label: "Triggered Stage-2 Methodological Guardrail",
            status: "completed",
            agentCodename: "orchestrator.v2",
            durationMs: 190,
          },
        ],
        thoughtSteps: [
          {
            id: "m3-th1",
            index: 1,
            title: "Detecting out-of-scope causal biophysical simulation request",
            detail:
              "User requested a exact °F temperature drop from planting 500 trees. However, a4i_ml.offset_model_v1 is a cross-sectional observational regression model (R² = 0.72), not a prognostic urban canopy / CFD microclimate model (e.g., ENVI-met or WRF-UCM).",
            durationMs: 190,
            status: "completed",
            agentCodename: "orchestrator.v2",
          },
        ],
        toolCalls: [
          {
            id: "m3-tc1",
            toolName: "explain_heat_offset",
            agentCodename: "bqml-analyst.sql",
            status: "success",
            durationMs: 190,
            sandboxTab: "sandbox",
            linkedSiteRank: 1,
            parameters: {
              tract_fips: "13121006700",
              guardrail_mode: "OBSERVATIONAL_ONLY_NO_CAUSAL_EXTRAPOLATION",
            },
            output: {
              scope_decision: "REFUSE_CAUSAL_TEMPERATURE_DELTA",
              observed_canopy_pct: 11.4,
              cross_sectional_canopy_attribution_f: "+0.89°F",
              recommended_pivot: "SITING_AND_VULNERABILITY_PRIORITIZATION",
            },
            sqlOrCodeSnippet: `// Stage-2 Methodological Scope Guardrail (orchestrator.py)
if intent == "CAUSAL_INTERVENTION_SIMULATION":
    return ScopeGuardrailRefusal(
        reason="a4i_ml.offset_model_v1 is cross-sectional observational (R²=0.72).",
        allowed="Report observed canopy deficit (11.4% vs 36.4% median) and +0.89°F attribution."
    )`,
          },
        ],
        tokenMetrics: {
          promptTokens: 980,
          reasoningTokens: 410,
          toolIoTokens: 520,
          completionTokens: 540,
          totalTokens: 2450,
          contextWindowLimit: 128000,
          estimatedCostUsd: 0.0086,
          inputRatePer1M: 1.25,
          outputRatePer1M: 5.0,
        },
        stepTimers: [
          {
            id: "m3-tm1",
            stepName: "1. Stage-2 Scope Guardrail Check",
            agentCodename: "orchestrator.v2",
            durationMs: 190,
            percentageOfTotal: 61,
            status: "completed",
          },
          {
            id: "m3-tm2",
            stepName: "2. Observational Context Lookup",
            agentCodename: "bqml-analyst.sql",
            durationMs: 120,
            percentageOfTotal: 39,
            status: "completed",
          },
        ],
        content: `### Methodological Scope Boundary: Causal Microclimate Simulation Refused

I **cannot estimate a causal temperature drop (°F)** from planting 500 trees in **Mechanicsville (\`13121006700\`)**.

#### Why This Request Is Blocked by Stage-2 Governance
1. **Observational vs. Prognostic Physics:** Our BigQuery ML model (\`a4i_ml.offset_model_v1\`, $R^2 = 0.72$) is trained on **cross-sectional observational data** across 207 Fulton County tracts. It measures how existing canopy and impervious surfaces correlate with historical heat islands—it does **not** simulate evapotranspiration, wind advection, or radiative shading from new tree plantings (which requires a prognostic microclimate model such as ENVI-met or WRF-UCM).
2. **What We Can Verifiably Report:**
   * Tract \`13121006700\` currently has **11.4% tree canopy coverage** (compared to the **36.4%** Fulton County median).
   * In \`ML.EXPLAIN_PREDICT\`, this canopy deficit accounts for **+0.89°F** of the tract's **+4.3°F** cross-sectional heat offset.
   * Consequently, Mechanicsville is our **#1 priority tract** for immediate cooling center siting ($180,000 allocation) and co-located urban forestry grants.`,
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*              Dynamic Simulation Builder for Live User Prompts              */
/* -------------------------------------------------------------------------- */

export function buildSimulatedAgentTurn(
  prompt: string,
  apiAnswerMarkdown?: string,
  apiTrace?: {
    intent?: string;
    toolsCalled?: string[];
    citations?: Array<{
      tract_fips?: string;
      neighborhood?: string;
      metric?: string;
      value?: string;
    }>;
    verifierPassed?: boolean;
    checkedCount?: number;
    withinToleranceCount?: number;
    latencyMs?: number;
  }
): AgentMessage {
  const lower = prompt.toLowerCase();
  const isTreeScope =
    lower.includes("tree") ||
    lower.includes("albedo") ||
    lower.includes("cool roof") ||
    lower.includes("how many degrees");
  const isSite4 =
    lower.includes("site 4") ||
    lower.includes("site #4") ||
    lower.includes("adair");
  const isApproval =
    lower.includes("budget") ||
    lower.includes("approve") ||
    lower.includes("540") ||
    lower.includes("ordinance") ||
    lower.includes("deploy");

  const linkedSiteRank = isSite4 ? 4 : lower.includes("west end") ? 2 : lower.includes("auburn") ? 3 : 1;

  const thoughtSteps: ThoughtStep[] = [
    {
      id: `th-${Date.now()}-1`,
      index: 1,
      title: "Stage-1 Intent Classification & Methodological Guardrail Check",
      detail: isTreeScope
        ? "Detected counterfactual intervention prompt. Triggering Stage-2 Scope Guardrail to prevent ungrounded causal °F extrapolation while retrieving observational BQML attributions."
        : "Classified intent as empirical urban heat & cooling center planning query. Routing to Data Analyst (bqml-analyst.sql) and Spatial Browser (spatial-browser.mcp).",
      durationMs: 185,
      status: "completed",
      agentCodename: "orchestrator.v2",
    },
    {
      id: `th-${Date.now()}-2`,
      index: 2,
      title: "Executing BigQuery ML & Spatial Catchment Lookup",
      detail: isSite4
        ? "Comparing Candidate #4 (Tract 13121006802, Adair Park, +3.8°F) against Selected #1 (Mechanicsville, +4.3°F) and #3 (Sweet Auburn, +3.9°F) using 800m TIGER walk-shed polygons."
        : "Querying a4i_ml.offset_model_v1 and 7-year GHCN station hot-day baseline (91.6°F) across 207 Fulton County tracts.",
      durationMs: 440,
      status: "completed",
      agentCodename: "bqml-analyst.sql",
    },
    {
      id: `th-${Date.now()}-3`,
      index: 3,
      title: "Running GroundingVerifier (±0.01°F Numerical Audit)",
      detail:
        "Cross-checked every cited tract FIPS code, heat offset (°F), and CDC SVI percentile against canonical BigQuery rows before streaming response.",
      durationMs: 240,
      status: "completed",
      agentCodename: "equity-verifier.ts",
    },
  ];

  const toolCalls: ToolCallItem[] = [
    {
      id: `tc-${Date.now()}-1`,
      toolName: isTreeScope ? "explain_heat_offset" : "execute_sql",
      agentCodename: "bqml-analyst.sql",
      status: "success",
      durationMs: 440,
      sandboxTab: "sandbox",
      linkedSiteRank,
      parameters: {
        query_intent: apiTrace?.intent || (isSite4 ? "COMPARE_CANDIDATE_SITE_4" : "TRACT_HEAT_ATTRIBUTION"),
        target_tract: isSite4 ? "13121006802" : "13121006700",
        ghcn_baseline_f: 91.6,
      },
      output: {
        verified_rows: 5,
        top_tract: isSite4 ? "13121006802 (Adair Park)" : "13121006700 (Mechanicsville)",
        heat_offset_f: isSite4 ? "+3.8°F" : "+4.3°F",
        walkshed_overlap_with_site1: isSite4 ? "38.2%" : "0.0%",
        verifier_tolerance: "±0.01°F PASSED",
      },
      sqlOrCodeSnippet: `SELECT
  tract_fips,
  neighborhood_name,
  ROUND(predicted_heat_offset_f, 2) AS heat_offset_f,
  ROUND(svi_percentile, 2) AS svi_percentile,
  walkshed_800m_pop
FROM \`a4i_gold.fulton_tract_features_2024\`
WHERE tract_fips IN ('13121006700', '13121005501', '13121004400', '13121006802')
ORDER BY composite_priority_score DESC;`,
    },
    {
      id: `tc-${Date.now()}-2`,
      toolName: isSite4 ? "select_cooling_center_sites" : "run_equity_audit",
      agentCodename: "equity-verifier.ts",
      status: isApproval ? "waiting_approval" : "success",
      durationMs: 310,
      sandboxTab: "canvas",
      linkedSiteRank,
      parameters: {
        min_distance_km: 1.5,
        budget_usd: 540000,
        verify_justice40: true,
      },
      output: {
        justice40_tracts_selected: "3 / 3 (100%)",
        net_unique_residents_served: 19420,
        status: isApproval ? "AWAITING_HUMAN_APPROVAL" : "AUDIT_COMPLETE",
      },
      sqlOrCodeSnippet: `// Spatial Overlap & Justice40 Verification
Candidate #1 (13121006700) <-> Candidate #4 (13121006802): 1.18 km apart (38.2% walk-shed overlap)
Candidate #1 (13121006700) <-> Candidate #3 (13121004400): 2.41 km apart (0.0% overlap, +4,120 net residents)`,
    },
  ];

  const subTasks: SubTaskItem[] = [
    {
      id: `st-${Date.now()}-1`,
      label: "Parsed Intent & Scope Guardrail",
      status: "completed",
      agentCodename: "orchestrator.v2",
      durationMs: 185,
    },
    {
      id: `st-${Date.now()}-2`,
      label: "Executed BigQuery ML & Spatial Tools",
      status: "completed",
      agentCodename: "bqml-analyst.sql",
      durationMs: 440,
    },
    {
      id: `st-${Date.now()}-3`,
      label: "Verified Numerical Grounding (±0.01°F)",
      status: "completed",
      agentCodename: "equity-verifier.ts",
      durationMs: 240,
    },
  ];

  const defaultContent = isSite4
    ? `### Comparative Siting Audit: Why Site #3 (Sweet Auburn) Beats Candidate #4 (Adair Park)

While **Candidate #4 (\`13121006802\` · Adair Park)** exhibits a severe **+3.8°F** heat offset and **0.89 CDC SVI**, our 1.5 km spatial spacing optimizer selected **Site #3 (\`13121004400\` · Sweet Auburn / Old Fourth Ward, +3.9°F)** for the third $180,000 facility:

1. **Walk-Shed Redundancy (1.18 km centroid distance):** Adair Park sits immediately southwest of **Site #1 (Mechanicsville, \`13121006700\`)**, resulting in a **38.2% overlap** in 10-minute (800m) pedestrian catchments.
2. **Marginal Population Gain:** Allocating the third unit to **Sweet Auburn (2.41 km northeast)** expands 10-minute cooling access to **+4,120 additional heat-vulnerable residents** in east-central Atlanta while maintaining a **0.903 portfolio mean SVI**.`
    : `### Grounded Multi-Agent Synthesis

I executed the BigQuery ML attribution pipeline (\`a4i_ml.offset_model_v1\`) and verified all figures against the 207 Fulton County tracts:

* **Top Priority Site (#1):** Tract \`13121006700\` (**Mechanicsville / Pittsburgh**) at **+4.3°F** heat offset (**95.9°F** summer peak, **0.94 SVI**).
* **Second Priority Site (#2):** Tract \`13121005501\` (**West End / English Avenue**) at **+4.1°F** heat offset (**95.7°F** summer peak, **0.91 SVI**).
* **Third Priority Site (#3):** Tract \`13121004400\` (**Sweet Auburn / Old Fourth Ward**) at **+3.9°F** heat offset (**95.5°F** summer peak, **0.86 SVI**).`;

  const totalMs = apiTrace?.latencyMs || 865;

  return {
    id: `msg-agent-${Date.now()}`,
    role: "assistant",
    timestamp: new Date().toTimeString().slice(0, 8),
    agentId: "orchestrator-agent",
    agentName: "HeatPlanner Orchestrator",
    agentModel: "gemini-2.5-pro-agentic",
    progressPct: isApproval ? 85 : 100,
    isStreaming: false,
    linkedSiteRank,
    latencyMs: totalMs,
    groundingStatus: {
      passed: apiTrace?.verifierPassed ?? true,
      checkedCount: apiTrace?.checkedCount ?? 8,
      withinToleranceCount: apiTrace?.withinToleranceCount ?? 8,
      methodologicalGate: isTreeScope
        ? "SCOPE_REFUSED"
        : isApproval
        ? "PENDING_HITL"
        : "PASSED",
    },
    thoughtSteps,
    toolCalls,
    subTasks,
    approvalGate: isApproval
      ? {
          id: `gate-${Date.now()}`,
          title: "Human-In-The-Loop Authorization: FY26 Budget Deployment",
          riskLevel: "critical",
          agentName: "HeatPlanner Orchestrator",
          actionType: "CAPITAL_BUDGET_LOCK & ORDINANCE_DISPATCH",
          summary:
            "Approve locking $540,000 across the 3 selected cooling center tracts and publishing the final City Council ordinance memo.",
          budgetImpact: "$540,000.00 ($180,000 × 3 sites)",
          affectedTracts: [
            "13121006700 (Mechanicsville)",
            "13121005501 (West End)",
            "13121004400 (Sweet Auburn)",
          ],
          permissionsRequested: [
            "finance.capital_budget.encumber ($540,000)",
            "council.ordinance_packet.publish",
          ],
          status: "pending",
        }
      : undefined,
    tokenMetrics: {
      promptTokens: 2120,
      reasoningTokens: 1340,
      toolIoTokens: 2290,
      completionTokens: 960,
      totalTokens: 6710,
      contextWindowLimit: 128000,
      estimatedCostUsd: 0.0231,
      inputRatePer1M: 1.25,
      outputRatePer1M: 5.0,
    },
    stepTimers: [
      {
        id: `tm-${Date.now()}-1`,
        stepName: "1. Intent & Scope Gate",
        agentCodename: "orchestrator.v2",
        durationMs: 185,
        percentageOfTotal: 21,
        status: "completed",
      },
      {
        id: `tm-${Date.now()}-2`,
        stepName: "2. BigQuery ML & Spatial Tools",
        agentCodename: "bqml-analyst.sql",
        durationMs: 440,
        percentageOfTotal: 51,
        status: "completed",
      },
      {
        id: `tm-${Date.now()}-3`,
        stepName: "3. GroundingVerifier Audit",
        agentCodename: "equity-verifier.ts",
        durationMs: 240,
        percentageOfTotal: 28,
        status: "completed",
      },
    ],
    content: apiAnswerMarkdown || defaultContent,
  };
}
