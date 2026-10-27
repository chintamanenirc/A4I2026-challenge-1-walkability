"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { AtlantaMap } from "./AtlantaMap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, RotateCcw, Loader2, Sparkles, X } from "lucide-react";

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

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const isSelectedFunded = selectedSite
    ? selectedSite.id <= centersToFund
    : true;

  const fundedSites = sites.slice(0, centersToFund);

  const handleReplay = () => {
    if (replayingStep !== null) return;
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
    await onSendMessage(msg);
  };

  return (
    <div className="w-full">
      {/* Main Unified 2-Column Container matching Screenshot 1 */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Planner Conversation, Agent Trace, Ranked Sites & Ask Input */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/90 p-5 flex flex-col justify-between gap-5 bg-[#0c121e]">
          <div className="flex flex-col gap-4">
            {/* Planner · 3:40 PM Prompt Bubble */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 text-right mb-1.5">
                Planner · 3:40 PM
              </div>
              <div className="bg-[#162032] border border-slate-700/70 rounded-2xl rounded-tr-sm px-4 py-3.5 ml-4 shadow-sm">
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  AGENT TRACE
                </span>
                <button
                  type="button"
                  onClick={handleReplay}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-[#162032]/80 hover:bg-slate-800 text-[11px] text-slate-200 font-medium transition-colors"
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
                <div className="text-[11px] font-medium text-slate-400 mb-1">
                  Heat Planner agent
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

                {/* Live Agent Reply (shown when user sends a live prompt) */}
                {agentReply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#141e30] border border-[#f97316]/40 text-xs text-slate-200 leading-relaxed max-h-56 overflow-y-auto shadow-inner">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#f97316]">
                          Live Agent Response
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

              {/* Ranked Site Cards */}
              <div className="flex flex-col gap-2">
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
                        <span className="text-[13px] font-bold text-slate-100 truncate">
                          {site.name}
                        </span>
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
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Offset = how much hotter than Atlanta’s average on the campaign
                day, not a forecast. “Nearby” is straight-line distance.
              </p>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onOpenCompareModal}
                  className="px-3.5 py-2 rounded-full border border-slate-700 bg-[#101827] hover:bg-slate-800 text-xs text-slate-200 font-semibold transition-colors"
                >
                  Why not site 4?
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("equity")}
                  className="px-3.5 py-2 rounded-full border border-slate-700 bg-[#101827] hover:bg-slate-800 text-xs text-slate-200 font-semibold transition-colors"
                >
                  Run the equity audit →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("proposal")}
                  className="px-4 py-2 rounded-full bg-[#f97316] hover:bg-orange-400 text-[#090d16] font-extrabold text-xs tracking-wide transition-all shadow-md active:scale-[0.99]"
                >
                  Draft the council proposal →
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Interactive Ask the Planner Box */}
          <div className="border-t border-slate-800/90 pt-4 mt-2">
            <label className="block text-xs font-bold text-slate-200 mb-2">
              Ask the planner
            </label>
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoadingMessage}
                className="flex-1 bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
              />
              <button
                type="submit"
                disabled={isLoadingMessage || !inputPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-[#f97316] hover:bg-orange-400 disabled:opacity-60 text-[#090d16] text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isLoadingMessage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
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
              {/* Left 4 cols: Site Badge, Name, FUNDED · Tract, and Links */}
              <div className="md:col-span-4 flex flex-col justify-between h-full gap-4">
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
                    className="text-xs text-[#f97316] hover:text-orange-300 font-bold underline underline-offset-4 decoration-[#f97316]/60 transition-colors"
                  >
                    Full breakdown →
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCompareModal}
                    className="text-xs text-slate-200 hover:text-white font-semibold transition-colors"
                  >
                    Compare with site 4 →
                  </button>
                </div>
              </div>

              {/* Middle 4 cols: Main Metrics */}
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l md:border-r border-slate-800/80 pt-4 md:pt-0 md:px-6 flex flex-col gap-2 text-xs">
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
              <div className="md:col-span-4 border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0 flex flex-col gap-2.5">
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
                        <div className="col-span-5 h-2 rounded-full bg-slate-800/90 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${val >= 0 ? "bg-[#f97316]" : "bg-emerald-400"}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="col-span-2 text-right font-mono font-bold text-slate-200 text-[11px]">
                          {val >= 0 ? "+" : ""}{val.toFixed(1)}°F
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
