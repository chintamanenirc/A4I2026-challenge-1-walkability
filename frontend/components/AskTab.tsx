"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { AtlantaMap } from "./AtlantaMap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  RotateCcw,
  Loader2,
  Sparkles,
  X,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  GitCompare,
  ArrowRight,
} from "lucide-react";

interface AskTabProps {
  sites: SiteData[];
  selectedSiteId: number;
  setSelectedSiteId: (id: number) => void;
  centersToFund: number;
  setCentersToFund: (fn: (prev: number) => number) => void;
  onNavigateTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
  onOpenCompareModal: () => void;
  onSendMessage: (
    query: string,
    agentId?: "atlanta_heat_agent" | "urban_heat_agent"
  ) => Promise<void>;
  isLoadingMessage: boolean;
  lastUserQuery?: string;
  agentReply?: string | null;
  agentLatencyMs?: number | null;
  agentSourceUrl?: string | null;
  agentToolsCalled?: string[];
  onClearAgentReply?: () => void;
}

const TRACE_STEPS = [
  { id: "read_question", label: "Parse question", desc: "what is being asked" },
  { id: "predict_offset", label: "BQML offset", desc: "BQML · EXPLAIN_PREDICT" },
  { id: "heat_frequency", label: "Station history", desc: "7 yrs GHCN ≥95°F days" },
  { id: "tract_lookup", label: "ACS vulnerability", desc: "MCP Toolbox · ACS tracts" },
  { id: "select_sites", label: "Siting rank", desc: "non-overlapping coverage" },
];

const QUICK_PROMPTS = [
  {
    label: "Rank top 3 sites",
    q: "We can fund 3 permanent cooling centers in Atlanta this summer. Where should they go and why?",
    agent: "urban_heat_agent" as const,
  },
  {
    label: "Why is Site #1 +4.3°F?",
    q: "Explain why Mechanicsville / Pittsburgh (Tract 44.00) runs +4.3°F hotter than Atlanta's average using BQML EXPLAIN_PREDICT.",
    agent: "urban_heat_agent" as const,
  },
  {
    label: "Days ≥95°F / summer",
    q: "How many days per summer reach ≥95°F in our top candidate tracts based on 7-year GHCN-D station history?",
    agent: "urban_heat_agent" as const,
  },
  {
    label: "Why not Site #4?",
    q: "Why was Site 4 (Adair Park / Mechanicsville S., Tract 58.00) passed over in favor of Sites 1–3?",
    agent: "urban_heat_agent" as const,
  },
  {
    label: "What if we plant trees? (Scope check)",
    q: "If we plant 500 trees in Mechanicsville, how many degrees will that cool the tract?",
    agent: "urban_heat_agent" as const,
  },
];

export const AskTab: React.FC<AskTabProps> = ({
  sites,
  selectedSiteId,
  setSelectedSiteId,
  centersToFund,
  setCentersToFund,
  onNavigateTab,
  onOpenCompareModal,
  onSendMessage,
  isLoadingMessage,
  lastUserQuery,
  agentReply,
  agentLatencyMs,
  agentSourceUrl,
  agentToolsCalled,
  onClearAgentReply,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<
    "atlanta_heat_agent" | "urban_heat_agent"
  >("urban_heat_agent");
  const [activeLayer, setActiveLayer] = useState<"heat" | "nocar" | "age65">(
    "heat"
  );
  const [replayingStep, setReplayingStep] = useState<number | null>(null);
  const [showDetailedTrace, setShowDetailedTrace] = useState(false);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const isSelectedFunded = selectedSite
    ? selectedSite.id <= centersToFund
    : true;

  const fundedSites = sites.slice(0, centersToFund);
  const passedOverSites = sites.slice(centersToFund);
  const totalReached = fundedSites.reduce(
    (sum, s) => sum + (s.residentsReached || 0),
    0
  );

  const handleReplay = () => {
    if (replayingStep !== null) return;
    setShowDetailedTrace(true);
    setReplayingStep(0);
    TRACE_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setReplayingStep(idx + 1);
      }, (idx + 1) * 320);
    });
    setTimeout(() => {
      setReplayingStep(null);
    }, (TRACE_STEPS.length + 1) * 320);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoadingMessage) return;
    const msg = inputPrompt.trim();
    setInputPrompt("");
    await onSendMessage(msg, selectedAgent);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* =====================================================================
          1. TOP CHAT & COMMAND BAR (Prominent, User-Friendly, First Thing Seen)
         ===================================================================== */}
      <section
        aria-label="Ask the Atlanta Heat Planning Assistant"
        className="bg-gradient-to-b from-[#11192c]/95 to-[#0c1220]/95 backdrop-blur-xl border border-[#f97316]/35 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/3 w-96 h-48 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12),transparent_70%)] blur-2xl"
        />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header Row: Title + Agent Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#f97316]/15 border border-[#f97316]/40 flex items-center justify-center text-[#f97316] shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-50 tracking-tight">
                    Ask the Atlanta Heat Planner
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live ADK + BQML
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ask in plain English or click a suggested question below to query{" "}
                  <span className="font-mono text-slate-300">ML.EXPLAIN_PREDICT</span>, 7-year station history, and ACS census tracts.
                </p>
              </div>
            </div>

            {/* Agent Mode Selector */}
            <div className="flex items-center gap-1.5 bg-[#080d17] border border-white/10 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSelectedAgent("urban_heat_agent")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-150 ${
                  selectedAgent === "urban_heat_agent"
                    ? "bg-[#f97316] text-[#090d16] font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Main Multi-Agent Urban Heat Planner (Siting + Climate Modeler + Equity Auditor)"
              >
                Main Planner Agent
              </button>
              <button
                type="button"
                onClick={() => setSelectedAgent("atlanta_heat_agent")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-150 ${
                  selectedAgent === "atlanta_heat_agent"
                    ? "bg-[#f97316] text-[#090d16] font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="BQML Explainer Agent (ML.EXPLAIN_PREDICT + GHCN + ACS)"
              >
                BQML Explainer
              </button>
            </div>
          </div>

          {/* Prominent Chat Input Bar on Top */}
          <form onSubmit={handleSend} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                id="ask-planner-input"
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask a question — e.g. 'Where should we place 3 cooling centers in Atlanta and why?' or 'Why is Site 1 +4.3°F hotter?'"
                disabled={isLoadingMessage}
                className="w-full bg-[#070b14] border border-white/15 hover:border-white/25 focus:border-[#f97316] rounded-xl pl-4 pr-10 py-3.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 transition-all duration-200 shadow-inner"
              />
              {inputPrompt && !isLoadingMessage && (
                <button
                  type="button"
                  aria-label="Clear question input"
                  onClick={() => setInputPrompt("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoadingMessage || !inputPrompt.trim()}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-b from-[#fb923c] to-[#f97316] hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 text-[#090d16] text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-950/50 ring-1 ring-inset ring-white/25 active:scale-[0.98] shrink-0 cursor-pointer"
            >
              {isLoadingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Asking Agent...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ask Agent</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Starter Prompts Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mr-1">
              Quick ask:
            </span>
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={isLoadingMessage}
                onClick={() => {
                  setSelectedAgent(chip.agent);
                  onSendMessage(chip.q, chip.agent);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#f97316]/15 border border-white/10 hover:border-[#f97316]/50 active:scale-[0.98] text-xs font-medium text-slate-200 hover:text-white transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Active Conversation / Agent Answer & Trace Box (Right inside Top Section) */}
          <div className="bg-[#080d18]/90 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            {/* Top row of conversation: Current Question + Trace Toggle/Replay */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Active Query
                </span>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-100 truncate">
                  “
                  {lastUserQuery ||
                    `We can fund ${centersToFund} permanent cooling ${
                      centersToFund === 1 ? "center" : "centers"
                    } in Atlanta this summer. Where should they go?`}
                  ”
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDetailedTrace((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-[11px] font-mono text-slate-300 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Agent Trace (5/5 tools)</span>
                  {showDetailedTrace ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Replay agent reasoning trace"
                  onClick={handleReplay}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-200 font-medium transition-all"
                >
                  <RotateCcw
                    className={`w-3 h-3 ${
                      replayingStep !== null ? "animate-spin text-[#f97316]" : ""
                    }`}
                  />
                  <span>Replay</span>
                </button>
              </div>
            </div>

            {/* Collapsible 5-Step Agent Trace */}
            {showDetailedTrace && (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 py-1">
                {TRACE_STEPS.map((step, idx) => {
                  const isDone = replayingStep === null || idx < replayingStep;
                  const isCurrent =
                    replayingStep !== null && idx === replayingStep;
                  return (
                    <div
                      key={step.id}
                      className={`px-3 py-2 rounded-lg border text-xs flex flex-col gap-0.5 transition-all ${
                        isDone
                          ? "bg-emerald-950/25 border-emerald-500/30"
                          : isCurrent
                          ? "bg-amber-950/30 border-amber-500/40"
                          : "bg-slate-900/60 border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-slate-100">
                          {idx + 1}. {step.label}
                        </span>
                        {isCurrent ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                        ) : (
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Agent Response Body (Loading, Live Reply, or Default Executive Summary) */}
            {isLoadingMessage ? (
              <div className="flex items-center gap-3 py-3 px-2 text-xs text-slate-200">
                <Loader2 className="w-4 h-4 animate-spin text-[#f97316] shrink-0" />
                <div>
                  <span className="font-bold text-[#f97316]">
                    Running ADK Agent on Cloud Run...
                  </span>{" "}
                  <span className="text-slate-400">
                    Executing BigQuery ML{" "}
                    <code className="text-slate-300">ML.EXPLAIN_PREDICT</code>{" "}
                    and ACS census tract vulnerability lookup.
                  </span>
                </div>
              </div>
            ) : agentReply ? (
              <div className="p-3.5 rounded-xl bg-[#111b2e]/95 border border-[#f97316]/40 text-xs sm:text-[13px] text-slate-100 leading-relaxed max-h-72 overflow-y-auto shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#f97316]">
                      Live Agent Response ({selectedAgent === "urban_heat_agent" ? "Main Planner Agent" : "BQML Explainer"})
                    </span>
                    {agentSourceUrl && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                        {agentSourceUrl.includes(".run.app") ? "Cloud Run · urban-heat-agent" : "Local ADK"}
                      </span>
                    )}
                    {agentToolsCalled && agentToolsCalled.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-mono">
                        Tools: {agentToolsCalled.join(", ")}
                      </span>
                    )}
                    {agentLatencyMs && (
                      <span className="text-[11px] font-mono text-slate-400">
                        · {(agentLatencyMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  {onClearAgentReply && (
                    <button
                      type="button"
                      onClick={onClearAgentReply}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Reset to summary</span>
                    </button>
                  )}
                </div>
                <div className="prose-dark text-xs sm:text-[13px] leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {agentReply}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-[13px] text-slate-200 leading-relaxed">
                <p>
                  <span className="font-bold text-emerald-400">
                    Recommendation:
                  </span>{" "}
                  Funding{" "}
                  <span className="font-bold text-[#f97316]">
                    {centersToFund}{" "}
                    {centersToFund === 1 ? "center" : "centers"}
                  </span>{" "}
                  (${fundedSites.length * 180}k / $600k cap) reaches{" "}
                  <span className="font-bold text-white">
                    {totalReached.toLocaleString()} residents
                  </span>{" "}
                  who lack a car or are 65+ within a 10-minute walk. Ranked by{" "}
                  <span className="font-mono text-slate-300">
                    predicted heat offset × days ≥95°F × transit-dependent need
                  </span>
                  .
                </p>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  Click any site below to inspect drivers ↓
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. INTERACTIVE WORKSPACE: CANDIDATE SITES LIST (LEFT) + MAP (RIGHT)
         ===================================================================== */}
      <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative">
        {/* Left Column: All 5 Ranked Candidate Sites (Funded + Passed Over) & Guided Actions */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 p-5 sm:p-6 flex flex-col justify-between gap-5 bg-[#0b101e]/95 relative overflow-hidden">
          <div className="flex flex-col gap-4 relative z-10">
            {/* Section Header + Quick Funding Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-50 tracking-tight">
                  Candidate Cooling Center Sites
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click any site to highlight on map & inspect{" "}
                  <span className="font-mono">EXPLAIN_PREDICT</span> drivers
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#f97316]/15 border border-[#f97316]/35 text-[#fdba74] font-mono text-[11px] font-bold">
                Top {centersToFund} Funded
              </span>
            </div>

            {/* Recommended / Funded Sites */}
            <div className="flex flex-col gap-2" role="listbox" aria-label="Recommended cooling center candidate sites">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between px-1">
                <span>Recommended to Fund ({fundedSites.length})</span>
                <span>Offset · Coverage</span>
              </div>
              {fundedSites.map((site) => {
                const isSelected = site.id === selectedSiteId;
                return (
                  <div
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedSiteId(site.id);
                      }
                    }}
                    className={`w-full flex flex-col gap-2 px-3.5 py-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#1a253a] to-[#131c2e] border-[#f97316] ring-1 ring-[#f97316]/40 shadow-lg"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#f97316] text-[#090d16]"
                              : "bg-white text-[#090d16]"
                          }`}
                        >
                          {site.id}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-50 truncate">
                            {site.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Tract {site.shortTract} · {site.noCarPct}% no car ·{" "}
                            {site.seniorsPct}% 65+
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end font-mono shrink-0">
                        <span className="text-xs font-bold text-[#f97316]">
                          +{site.offsetF.toFixed(1)}°F
                        </span>
                        <span className="text-[11px] text-slate-300">
                          {site.residentsReached.toLocaleString()} reached
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px]">
                        <span className="text-emerald-400 font-mono font-semibold">
                          ✓ Selected on map
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendMessage(
                              `Explain why Site ${site.id} (${site.name}, Tract ${site.shortTract}) runs +${site.offsetF.toFixed(1)}°F hotter than Atlanta's average and why it ranks #${site.id}.`,
                              selectedAgent
                            );
                          }}
                          className="inline-flex items-center gap-1 text-[#fdba74] hover:text-white font-semibold"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Ask AI about Site #{site.id}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Passed Over Sites (So users can easily see & click Site #4 and #5!) */}
            {passedOverSites.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400/90 flex items-center justify-between px-1">
                  <span>Passed Over / Unfunded ({passedOverSites.length})</span>
                  <span>Click to compare</span>
                </div>
                {passedOverSites.map((site) => {
                  const isSelected = site.id === selectedSiteId;
                  return (
                    <div
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedSiteId(site.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#1a253a] to-[#131c2e] border-amber-400/80 ring-1 ring-amber-400/30 shadow-lg"
                          : "bg-white/[0.015] border-white/10 opacity-80 hover:opacity-100 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full border border-slate-500 bg-slate-800/90 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {site.id}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {site.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Tract {site.shortTract} · {site.noCarPct}% no car (lower need)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="text-xs font-bold text-amber-300">
                          +{site.offsetF.toFixed(1)}°F
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
              <strong className="text-slate-200">Note on heat offset:</strong>{" "}
              Offset is how much hotter a tract runs relative to Atlanta’s campaign mean (`+°F`), not a single-day weather forecast.
            </p>
          </div>

          {/* Guided Next-Step Workflow Buttons */}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-2 relative z-10">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Next Steps in Planning Workflow
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenCompareModal}
                className="px-3 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-100 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Why not Site #4?</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("sites")}
                className="px-3 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-100 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>2. Site Drivers</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("equity")}
                className="px-3 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-100 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>3. Equity Audit</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("proposal")}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-b from-[#fb923c] to-[#f97316] hover:from-orange-400 hover:to-orange-500 text-[#090d16] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-950/50 cursor-pointer"
              >
                <span>4. Council Memo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Selected Site Bottom Card */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-[#0b101b]/90">
          <AtlantaMap
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            centersToFund={centersToFund}
            setCentersToFund={setCentersToFund}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
          />

          {/* Selected Site Bottom Driver Breakdown Card */}
          {selectedSite && (
            <div className="bg-[#101829]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.09),transparent_70%)] blur-2xl"
              />
              {/* Left 4 cols: Site Badge, Name, FUNDED · Tract, and Links */}
              <div className="md:col-span-4 flex flex-col justify-between h-full gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white text-[#090d16] flex items-center justify-center text-sm font-extrabold shadow-md shrink-0">
                    {selectedSite.id}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-50 tracking-tight truncate">
                      {selectedSite.name}
                    </h3>
                    <div className="text-xs font-mono mt-0.5 flex items-center gap-1.5">
                      <span
                        className={
                          isSelectedFunded
                            ? "text-emerald-400 font-bold"
                            : "text-amber-400 font-bold"
                        }
                      >
                        {isSelectedFunded ? "FUNDED" : "PASS OVER"}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">
                        Tract {selectedSite.shortTract}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("sites")}
                    className="text-xs text-[#f97316] hover:text-orange-300 font-bold underline underline-offset-4 decoration-[#f97316]/60 transition-all duration-200 active:scale-[0.98]"
                  >
                    Full breakdown →
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCompareModal}
                    className="text-xs text-slate-300 hover:text-white font-semibold transition-all duration-200 active:scale-[0.98]"
                  >
                    Compare with site 4 →
                  </button>
                </div>
              </div>

              {/* Middle 4 cols: Main Metrics */}
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l md:border-r border-white/10 pt-4 md:pt-0 md:px-6 flex flex-col gap-2 text-xs relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Heat offset</span>
                  <span className="font-mono font-bold text-[#f97316]">
                    +{selectedSite.offsetF.toFixed(1)}°F vs. city
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Days ≥95°F / summer</span>
                  <span className="font-mono font-bold text-slate-100">
                    {selectedSite.hotDaysPerSummer} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Residents reached</span>
                  <span className="font-mono font-bold text-slate-100">
                    {selectedSite.residentsReached.toLocaleString()} (≤10-min)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Est. annual cost</span>
                  <span className="font-mono font-bold text-slate-100">
                    {selectedSite.estAnnualCost} / yr
                  </span>
                </div>
              </div>

              {/* Right 4 cols: WHY THIS SITE IS HOT (EXPLAIN_PREDICT) */}
              <div className="md:col-span-4 border-t md:border-t-0 border-white/10 pt-4 md:pt-0 flex flex-col gap-2.5 relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  WHY THIS SITE IS HOT (EXPLAIN_PREDICT)
                </div>

                <div className="flex flex-col gap-2">
                  {selectedSite.drivers.map((drv) => {
                    const val = drv.attributionF ?? drv.deltaF ?? 0;
                    const widthPct = Math.min(
                      100,
                      Math.round((Math.abs(val) / 2.2) * 100)
                    );
                    return (
                      <div
                        key={drv.label || drv.feature}
                        className="grid grid-cols-12 items-center gap-2 text-xs"
                      >
                        <span className="col-span-5 text-slate-300 truncate">
                          {drv.label || drv.feature}
                        </span>
                        <div className="col-span-5 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              val >= 0 ? "bg-[#f97316]" : "bg-emerald-400"
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="col-span-2 text-right font-mono font-bold text-slate-200 text-[11px]">
                          {val >= 0 ? "+" : ""}
                          {val.toFixed(1)}°F
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
