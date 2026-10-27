"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { AtlantaMap } from "./AtlantaMap";
import { Check, RotateCcw } from "lucide-react";

interface AskTabProps {
  sites: SiteData[];
  selectedSiteId: number;
  setSelectedSiteId: (id: number) => void;
  centersToFund: number;
  setCentersToFund: (fn: (prev: number) => number) => void;
  onNavigateTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
  onOpenCompareModal: () => void;
  onSendMessage: (query: string) => Promise<void>;
  isLoadingMessage: boolean;
}

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
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [activeLayer, setActiveLayer] = useState<"heat" | "nocar" | "age65">("heat");

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoadingMessage) return;
    const msg = inputPrompt;
    setInputPrompt("");
    await onSendMessage(msg);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Conversation, Agent Trace & Candidate List */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* User / Planner Message */}
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-end">
              <span>Planner · 3:40 PM</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              We can fund {centersToFund} permanent cooling centers in Atlanta this summer. Where should they go?
            </p>
          </div>

          {/* AGENT TRACE Panel */}
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AGENT TRACE
              </span>
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            </div>

            <div className="flex flex-col gap-1 text-xs font-mono">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-semibold">read_question</span>
                  <span className="text-slate-400 font-sans text-xs">what is being asked</span>
                </div>
                <span className="text-slate-500 text-[11px]">done</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-semibold">predict_offset</span>
                  <span className="text-slate-400 font-sans text-xs">BQML · EXPLAIN_PREDICT</span>
                </div>
                <span className="text-slate-500 text-[11px]">done</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-semibold">heat_frequency</span>
                  <span className="text-slate-400 font-sans text-xs">7 yrs station history</span>
                </div>
                <span className="text-slate-500 text-[11px]">done</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-semibold">tract_lookup</span>
                  <span className="text-slate-400 font-sans text-xs">MCP Toolbox · ACS tracts</span>
                </div>
                <span className="text-slate-500 text-[11px]">done</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-semibold">select_sites</span>
                  <span className="text-slate-400 font-sans text-xs">non-overlapping coverage</span>
                </div>
                <span className="text-slate-500 text-[11px]">done</span>
              </div>
            </div>
          </div>

          {/* Heat Planner Agent Response Card */}
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-300 mb-1.5">
                Heat Planner agent
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Funding <span className="font-bold text-orange-400">{centersToFund} centers</span> reaches the most residents who are exposed and least able to leave. Ranked by heat offset × days ≥95°F × residents nearby without a car or 65+. Tap a site to see why.
              </p>
            </div>

            {/* Recommended Sites Cards */}
            <div className="flex flex-col gap-3.5">
              {sites.slice(0, centersToFund).map((site) => {
                const isSelected = site.id === selectedSiteId;
                return (
                  <div
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#162032] border-[#ea580c] shadow-md"
                        : "bg-[#090d16]/80 border-slate-800 hover:bg-[#121927]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? "bg-white text-slate-900"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {site.id}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        [{site.name}]
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="font-bold text-orange-400">
                        +{site.offsetF.toFixed(1)}°F
                      </span>
                      <span className="text-slate-400 text-xs">
                        {site.residentsReached.toLocaleString()} reached
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 leading-normal border-t border-slate-800/60 pt-3">
              Offset = how much hotter than Atlanta’s average on the campaign day, not a forecast. “Nearby” is straight-line distance.
            </p>

            {/* Action Chips */}
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={onOpenCompareModal}
                className="px-5 py-2.5 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
              >
                Why not site 4?
              </button>
              <button
                onClick={() => onNavigateTab("equity")}
                className="px-5 py-2.5 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
              >
                Run the equity audit
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => onNavigateTab("proposal")}
              className="w-full py-3.5 px-6 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-semibold text-xs tracking-wide transition-all shadow-md active:scale-[0.99]"
            >
              Draft the council proposal
            </button>
          </div>

          {/* Bottom Chat Input Form */}
          <div className="mt-auto flex flex-col gap-3">
            <label className="block text-xs font-semibold text-slate-400">
              Ask the planner
            </label>
            <form onSubmit={handleSend} className="flex items-center gap-4">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="e.g. What's near Peachtree and 10th?"
                disabled={isLoadingMessage}
                className="flex-1 bg-[#090d16] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={isLoadingMessage || !inputPrompt.trim()}
                className="px-6 py-3 rounded-xl bg-[#ea580c] hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                {isLoadingMessage ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Map & Selected Site Driver Card */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Atlanta Map Viewport */}
          <AtlantaMap
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            centersToFund={centersToFund}
            setCentersToFund={setCentersToFund}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
          />

          {/* Selected Site Bottom Driver Breakdown Card matching PDF Page 1 */}
          {selectedSite && (
            <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-center">
              {/* Left: Site Info & Offset */}
              <div className="flex flex-col justify-between self-stretch space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-bold shadow-sm">
                    {selectedSite.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      [{selectedSite.name}]
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      FUNDED · Tract [{selectedSite.tractId}]
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-black text-orange-400 font-mono">
                    +[X.X]°F
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">vs. city average</div>
                </div>

                <button
                  onClick={() => onNavigateTab("sites")}
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 pt-1"
                >
                  <span>Full breakdown →</span>
                </button>
              </div>

              {/* Right: 4 Horizontal Driver Bars matching PDF Screen */}
              <div className="flex-1 max-w-sm flex flex-col justify-center space-y-4 w-full">
                {selectedSite.drivers.map((driver) => {
                  const isWarming = driver.attributionF >= 0;
                  const widthPct = Math.min(100, Math.max(15, Math.abs(driver.attributionF) * 38));

                  return (
                    <div key={driver.feature} className="flex items-center justify-between gap-4 text-xs">
                      <span className="w-32 text-slate-300 text-xs font-medium capitalize truncate">
                        {driver.feature.replace("_", " ")}
                      </span>

                      <div className="flex-1 h-3 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isWarming ? "bg-[#ea580c]" : "bg-sky-500"
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>

                      <span
                        className={`w-14 text-right font-mono font-bold text-xs ${
                          isWarming ? "text-orange-400" : "text-sky-400"
                        }`}
                      >
                        {isWarming ? "+" : "−"}[X.X]°F
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
