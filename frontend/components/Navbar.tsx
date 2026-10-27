"use client";

import React from "react";
import { Flame, MapPin, ChevronDown } from "lucide-react";

interface NavbarProps {
  activeTab: "ask" | "sites" | "equity" | "proposal";
  setActiveTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "ask" as const, label: "Ask" },
    { id: "sites" as const, label: "Sites" },
    { id: "equity" as const, label: "Equity audit" },
    { id: "proposal" as const, label: "Proposal" },
  ];

  const isAsk = activeTab === "ask";

  return (
    <header className="border-b border-slate-800/80 bg-[#0c121e] sticky top-0 z-50">
      {/* Top Header Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between">
        {/* Left: Branding & City Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-sm">
              <Flame className="w-4 h-4 fill-orange-500/20 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-slate-100 tracking-tight leading-tight">
                {isAsk ? "Heat Planner" : "Atlanta Heat Planner"}
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">
                {isAsk ? "Internal city planning tool" : "City of Atlanta · internal planning tool"}
              </p>
            </div>
          </div>

          {/* City pill on Page 1 */}
          {isAsk && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-xs text-slate-300 hover:border-slate-600 cursor-pointer transition-colors shadow-sm">
              <MapPin className="w-3 h-3 text-orange-400" />
              <span className="font-medium text-[11px]">City: Atlanta</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#090d16] border border-slate-800 p-1 rounded-full shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[#ea580c] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Contextual Status Badge */}
        <div className="flex items-center gap-2">
          {activeTab === "ask" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700/80 bg-slate-800/60 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-medium">Agent live · Cloud Run</span>
            </div>
          )}

          {activeTab === "sites" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-orange-400" />
                City: Atlanta
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-orange-400 font-mono text-[10px] font-semibold tracking-wide">ML.EXPLAIN_PREDICT</span>
            </div>
          )}

          {activeTab === "equity" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-orange-400" />
                City: Atlanta
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 text-[10px]">Audit of our own output</span>
            </div>
          )}

          {activeTab === "proposal" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-orange-400" />
                City: Atlanta
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-sky-400 text-[10px]">Gemini · drafting</span>
            </div>
          )}
        </div>
      </div>

      {/* Subheader Scenario Banner (Only visible on Ask tab as shown in Page 1 design) */}
      {isAsk && (
        <div className="border-t border-slate-800/70 bg-[#080d16] px-6 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold text-[11px]">Scenario</span>
            <span className="text-slate-200 font-medium text-[11px]">Fund permanent cooling centers · council vote in 3 weeks</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Heat Watch · 1 campaign day</span>
            <span className="text-slate-600">·</span>
            <span>Stations · 7 yrs</span>
            <span className="text-slate-600">·</span>
            <span>ACS tracts</span>
          </div>
        </div>
      )}
    </header>
  );
};
