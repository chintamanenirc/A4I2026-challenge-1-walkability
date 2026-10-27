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
    <header className="border-b border-slate-800/80 bg-[#0c121e] sticky top-0 z-50 w-full shadow-sm">
      {/* Top Header Bar centered with consistent padding */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-6">
        {/* Left: Branding & City Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-sm">
              <Flame className="w-4.5 h-4.5 fill-orange-500/20 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-tight">
                {isAsk ? "Heat Planner" : "Atlanta Heat Planner"}
              </h1>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                {isAsk ? "Internal city planning tool" : "City of Atlanta · internal planning tool"}
              </p>
            </div>
          </div>

          {/* City pill on Page 1 */}
          {isAsk && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/70 text-xs text-slate-300 hover:border-slate-600 cursor-pointer transition-colors shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-medium text-xs">City: Atlanta</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#090d16] border border-slate-800 p-1.5 rounded-full shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
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
        <div className="flex items-center gap-3">
          {activeTab === "ask" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/70 text-xs font-medium text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-medium text-xs">Agent live · Cloud Run</span>
            </div>
          )}

          {activeTab === "sites" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/70 text-xs font-medium text-slate-300 shadow-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                City: Atlanta
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-orange-400 font-mono text-xs font-semibold tracking-wide">ML.EXPLAIN_PREDICT</span>
            </div>
          )}

          {activeTab === "equity" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/70 text-xs font-medium text-slate-300 shadow-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                City: Atlanta
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 text-xs">Audit of our own output</span>
            </div>
          )}

          {activeTab === "proposal" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/70 text-xs font-medium text-slate-300 shadow-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                City: Atlanta
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-sky-400 text-xs">Gemini · drafting</span>
            </div>
          )}
        </div>
      </div>

      {/* Subheader Scenario Banner centered */}
      {isAsk && (
        <div className="border-t border-slate-800/70 bg-[#080d16]">
          <div className="max-w-7xl mx-auto w-full px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-semibold text-xs">Scenario</span>
              <span className="text-slate-200 font-medium text-xs">Fund permanent cooling centers · council vote in 3 weeks</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span>Heat Watch · 1 campaign day</span>
              <span className="text-slate-600">·</span>
              <span>Stations · 7 yrs</span>
              <span className="text-slate-600">·</span>
              <span>ACS tracts</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
