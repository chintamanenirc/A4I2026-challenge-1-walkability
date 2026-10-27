"use client";

import React, { useState, useEffect } from "react";
import { SiteData } from "./types";
import { AtlantaMap } from "./AtlantaMap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  RotateCcw,
  Loader2,
  Sparkles,
  Send,
  ExternalLink,
  X,
  ArrowRight,
  GitCompare,
  ShieldCheck,
  FileText,
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
  onClearAgentReply?: () => void;
}

const TRACE_STEPS = [
  { id: "read_question", desc: "what is being asked" },
  { id: "predict_offset", desc: "BQML · EXPLAIN_PREDICT" },
  { id: "heat_frequency", desc: "7 yrs station history" },
  { id: "tract_lookup", desc: "MCP Toolbox · ACS tracts" },
  { id: "select_sites", desc: "non-overlapping coverage" },
];

const QUICK_PROMPTS = [
  {
    short: "Rank top 3 sites",
    prompt:
      "We can fund 3 permanent cooling centers in Atlanta this summer. Where should they go and why?",
    agent: "atlanta_heat_agent" as const,
  },
  {
    short: "Why is Site 1 +4.4°F?",
    prompt:
      "Explain why Mechanicsville (Tract 58.00) runs +4.4°F hotter than Atlanta's average using BQML EXPLAIN_PREDICT.",
    agent: "urban_heat_agent" as const,
  },
  {
    short: "Days ≥95°F / summer",
    prompt:
      "How many days per summer reach ≥95°F in our top candidate tracts based on 7-year GHCN-D station history?",
    agent: "atlanta_heat_agent" as const,
  },
  {
    short: "Why not Site 4?",
    prompt:
      "Why was Site 4 (Bankhead / Midtown Edge) passed over in favor of Sites 1–3?",
    agent: "atlanta_heat_agent" as const,
  },
  {
    short: "Run equity audit",
    prompt:
      "Compare the median income, poverty rate, car-free households, and seniors 65+ at our 3 funded sites against the Atlanta baseline.",
    agent: "atlanta_heat_agent" as const,
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
  onClearAgentReply,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [activeLayer, setActiveLayer] = useState<"heat" | "nocar" | "age65">(
    "heat"
  );
  const [replayingStep, setReplayingStep] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<
    "atlanta_heat_agent" | "urban_heat_agent"
  >("atlanta_heat_agent");
  const [showAlternates, setShowAlternates] = useState(true);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const isSelectedFunded = selectedSite
    ? selectedSite.id <= centersToFund
    : true;

  const fundedSites = sites.slice(0, centersToFund);
  const alternateSites = sites.slice(centersToFund);

  // Automatically animate trace steps while live agent query is running
  useEffect(() => {
    if (!isLoadingMessage) {
      setReplayingStep(null);
      return;
    }
    setReplayingStep(0);
    const interval = setInterval(() => {
      setReplayingStep((prev) => {
        if (prev === null) return 0;
        return prev < TRACE_STEPS.length - 1 ? prev + 1 : prev;
      });
    }, 650);
    return () => clearInterval(interval);
  }, [isLoadingMessage]);

  const handleReplay = () => {
    if (replayingStep !== null || isLoadingMessage) return;
    setReplayingStep(0);
    TRACE_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setReplayingStep(idx + 1);
      }, (idx + 1) * 300);
    });
    setTimeout(() => {
      setReplayingStep(null);
    }, (TRACE_STEPS.length + 1) * 300);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoadingMessage) return;
    const msg = inputPrompt.trim();
    setInputPrompt("");
    await onSendMessage(msg, selectedAgent);
  };

  const handleQuickPrompt = async (
    prompt: string,
    agent: "atlanta_heat_agent" | "urban_heat_agent"
  ) => {
    if (isLoadingMessage) return;
    setSelectedAgent(agent);
    await onSendMessage(prompt, agent);
  };

  const siteLon = selectedSite ? selectedSite.lon ?? selectedSite.lng : -84.398;

  return (
    <div className="w-full">
      {/* Main Unified 2-Column Container */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Planner Conversation, Agent Trace, Ranked Sites & Quick Ask */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/90 p-5 flex flex-col justify-between gap-5 bg-[#0c121e]">
          <div className="flex flex-col gap-4">
            {/* Planner Prompt Bubble */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Active Query
                </span>
                <span>Planner · Live Session</span>
              </div>
              <div className="bg-[#162032] border border-slate-700/70 rounded-2xl rounded-tr-sm px-4 py-3.5 ml-2 shadow-sm">
                <p className="text-[13px] text-slate-100 leading-relaxed">
                  {lastUserQuery ||
                    `We can fund ${centersToFund} permanent cooling ${
                      centersToFund === 1 ? "center" : "centers"
                    } in Atlanta this summer. Where should they go?`}
                </p>
              </div>
            </div>

            {/* AGENT TRACE Box */}
            <div className="bg-[#0f172a]/90 border border-slate-800/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    AGENT TRACE
                  </span>
                  {isLoadingMessage && (
                    <span className="text-[10px] font-mono text-[#f97316] animate-pulse">
                      · running live
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReplay}
                  disabled={isLoadingMessage}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-[#162032]/80 hover:bg-slate-800 disabled:opacity-50 text-[11px] text-slate-200 font-medium transition-colors"
                >
                  <RotateCcw
                    className={`w-3 h-3 ${
                      replayingStep !== null ? "animate-spin text-[#f97316]" : ""
                    }`}
                  />
                  <span>Replay</span>
                </button>
              </div>

              <div className="flex flex-col divide-y divide-slate-800/50 text-xs">
                {TRACE_STEPS.map((step, idx) => {
                  const isDone = replayingStep === null || idx < replayingStep;
                  const isCurrent =
                    replayingStep !== null && idx === replayingStep;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center justify-between py-2 first:pt-1 last:pb-0.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isDone
                              ? "bg-emerald-950 border border-emerald-500/60 text-emerald-400"
                              : isCurrent
                              ? "bg-amber-950 border border-amber-500/60 text-amber-400"
                              : "bg-slate-900 border border-slate-700 text-slate-600"
                          }`}
                        >
                          {isCurrent ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-slate-100 font-mono font-bold text-xs shrink-0">
                          {step.id}
                        </span>
                        <span className="text-slate-400 font-sans text-xs truncate">
                          {step.desc}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px] ml-2 shrink-0">
                        {isDone ? "done" : isCurrent ? "run" : "wait"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heat Planner Agent Response */}
            <div className="flex flex-col gap-3.5 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-400">
                    Heat Planner agent
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ADK · Gemini 2.5
                  </span>
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed">
                  Funding{" "}
                  <span className="font-bold text-[#f97316]">
                    {centersToFund}{" "}
                    {centersToFund === 1 ? "center" : "centers"}
                  </span>{" "}
                  reaches the most residents who are exposed and least able to
                  leave. Ranked by heat offset × days ≥95°F × residents nearby
                  without a car or 65+. Tap any site to inspect its drivers.
                </p>

                {/* Live Agent Markdown Response Box */}
                {agentReply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#141e30] border border-[#f97316]/45 text-xs text-slate-200 leading-relaxed max-h-60 overflow-y-auto shadow-inner">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#f97316]">
                          Live Agent Answer
                        </span>
                        {agentLatencyMs && (
                          <span className="text-[10px] font-mono text-slate-400">
                            · {(agentLatencyMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {onClearAgentReply && (
                        <button
                          type="button"
                          onClick={onClearAgentReply}
                          className="text-slate-400 hover:text-white p-0.5 rounded"
                          title="Dismiss live response"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="prose-dark text-xs leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {agentReply}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Ranked Funded Site Cards */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
                  <span>RECOMMENDED ({fundedSites.length} FUNDED)</span>
                  <span>OFFSET · REACH</span>
                </div>
                {fundedSites.map((site) => {
                  const isSelected = site.id === selectedSiteId;
                  return (
                    <div
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#192338] border-[#f97316] shadow-md"
                          : "bg-[#0e1625] border-slate-800/90 hover:bg-[#131d30] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            isSelected
                              ? "bg-[#f97316] text-[#090d16]"
                              : "bg-white text-[#090d16]"
                          }`}
                        >
                          {site.id}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-100 truncate">
                            {site.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Tract {site.shortTract} · {site.noCarPct}% no car
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                        <span className="font-bold text-[#f97316]">
                          +{site.offsetF.toFixed(1)}°F
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/70 text-slate-300 text-[11px]">
                          {site.residentsReached.toLocaleString()} reached
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Alternate / Unfunded Candidate Sites (#4-#5) */}
                {alternateSites.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAlternates(!showAlternates)}
                      className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-slate-200 px-0.5 py-1 transition-colors"
                    >
                      <span>
                        ALTERNATE CANDIDATES ({alternateSites.length} UNFUNDED)
                      </span>
                      <span>{showAlternates ? "Hide ▲" : "Show ▼"}</span>
                    </button>

                    {showAlternates && (
                      <div className="flex flex-col gap-2 mt-1.5">
                        {alternateSites.map((site) => {
                          const isSelected = site.id === selectedSiteId;
                          return (
                            <div
                              key={site.id}
                              onClick={() => setSelectedSiteId(site.id)}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-[#192338] border-[#f97316] shadow-md"
                                  : "bg-[#0a101d] border-slate-800/70 opacity-85 hover:opacity-100 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-6 h-6 rounded-full border border-dashed border-slate-400 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                                  {site.id}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-200 truncate">
                                    {site.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500">
                                    Tract {site.shortTract} · {site.noCarPct}%
                                    no car
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                                <span className="font-bold text-slate-300">
                                  +{site.offsetF.toFixed(1)}°F
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                                  {site.residentsReached.toLocaleString()}{" "}
                                  reached
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Offset = how much hotter than Atlanta’s average on the campaign
                day, not a forecast. “Nearby” is straight-line distance.
              </p>

              {/* Workflow Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onOpenCompareModal}
                  className="px-3.5 py-2 rounded-full border border-slate-700 bg-[#101827] hover:bg-slate-800 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <GitCompare className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Why not site 4?</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("equity")}
                  className="px-3.5 py-2 rounded-full border border-slate-700 bg-[#101827] hover:bg-slate-800 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Run equity audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("proposal")}
                  className="px-4 py-2 rounded-full bg-[#f97316] hover:bg-orange-400 text-[#090d16] font-extrabold text-xs tracking-wide flex items-center gap-1.5 transition-all shadow-md active:scale-[0.99]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft council proposal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Interactive Ask the Planner Box with 1-Click Starter Prompts */}
          <div className="border-t border-slate-800/90 pt-4 mt-2 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Ask the planner</span>
              </label>

              {/* Agent Selector Pill */}
              <div className="flex items-center bg-[#090d16] border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedAgent("atlanta_heat_agent")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    selectedAgent === "atlanta_heat_agent"
                      ? "bg-[#f97316] text-[#090d16] font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Equity Planner
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAgent("urban_heat_agent")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    selectedAgent === "urban_heat_agent"
                      ? "bg-[#f97316] text-[#090d16] font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  BQML Explainer
                </button>
              </div>
            </div>

            {/* 1-Click Sample Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.short}
                  type="button"
                  disabled={isLoadingMessage}
                  onClick={() => handleQuickPrompt(item.prompt, item.agent)}
                  className="px-2.5 py-1 rounded-lg bg-[#11192a] hover:bg-[#19253d] border border-slate-800 hover:border-[#f97316]/50 text-[11px] text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {item.short}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about any tract, site, heat driver, or equity metric..."
                disabled={isLoadingMessage}
                className="flex-1 bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
              />
              <button
                type="submit"
                disabled={isLoadingMessage || !inputPrompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#f97316] hover:bg-orange-400 disabled:opacity-60 text-[#090d16] text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                {isLoadingMessage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isLoadingMessage ? "Running" : "Send"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Map & Selected Site Bottom Card */}
        <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-5 bg-[#0b101b]">
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
            <div className="bg-[#101827] border border-slate-800/90 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left 4 cols: Site Badge, Name, FUNDED · Tract, and Quick Links */}
              <div className="md:col-span-4 flex flex-col justify-between h-full gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-white text-[#090d16] flex items-center justify-center text-sm font-extrabold shadow-sm shrink-0">
                    {selectedSite.id}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-100 truncate">
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
                        {isSelectedFunded ? "FUNDED" : "ALTERNATE"}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span
                        className="text-slate-400"
                        title={`Census Tract ${selectedSite.tractId}`}
                      >
                        Tract {selectedSite.shortTract}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("sites")}
                    className="text-xs text-[#f97316] hover:text-orange-300 font-bold flex items-center gap-1 underline underline-offset-4 decoration-[#f97316]/60 transition-colors"
                  >
                    <span>Full breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedSite.lat},${siteLon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Center 3 cols: Giant +[X.X]°F vs. city average + Key Stats */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#f97316] font-mono tracking-tight">
                  +{selectedSite.offsetF.toFixed(1)}°F
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  vs. city average · {selectedSite.hotDaysPerSummer ?? 41} days
                  ≥95°F
                </div>
                <div className="text-[11px] font-mono text-slate-300 mt-1.5">
                  {selectedSite.residentsReached.toLocaleString()} reached ·{" "}
                  {selectedSite.estAnnualCost ?? "$180,000"}/yr
                </div>
              </div>

              {/* Right 5 cols: 4 Horizontal Attribution Bars */}
              <div className="md:col-span-5 flex flex-col justify-center gap-2.5 w-full">
                {selectedSite.drivers.map((driver) => {
                  const isWarming = driver.attributionF >= 0;
                  const widthPct = Math.min(
                    100,
                    Math.max(14, Math.round(Math.abs(driver.attributionF) * 42))
                  );
                  const displayLabel =
                    driver.label ||
                    driver.feature
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <div
                      key={driver.feature}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="w-32 text-slate-300 text-xs font-medium truncate">
                        {displayLabel}
                      </span>

                      <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isWarming ? "bg-[#f97316]" : "bg-[#60a5fa]"
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>

                      <span className="w-14 text-right font-mono font-semibold text-xs text-slate-300">
                        {isWarming ? "+" : "−"}
                        {Math.abs(driver.attributionF).toFixed(1)}°F
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
