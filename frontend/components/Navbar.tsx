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

  return (
    <header className="border-b border-slate-800 bg-[#0d131f] sticky top-0 z-50">
      {/* Top Header Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Branding & City Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-sm">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-tight">Heat Planner</h1>
              <p className="text-[11px] text-slate-400 leading-none">Internal city planning tool</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700/80 bg-slate-800/80 text-xs text-slate-200 hover:border-slate-600 cursor-pointer transition-colors shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-medium">City: Atlanta</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-full shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-md"
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
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-900/60 bg-emerald-950/40 text-[11px] font-medium text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Agent live · Cloud Run</span>
            </div>
          )}

          {activeTab === "sites" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="text-slate-400">City: Atlanta</span>
              <span className="text-slate-600">·</span>
              <span className="text-orange-400 font-mono font-semibold">ML.EXPLAIN_PREDICT</span>
            </div>
          )}

          {activeTab === "equity" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="text-slate-400">City: Atlanta</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">Audit of our own output</span>
            </div>
          )}

          {activeTab === "proposal" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 text-[11px] font-medium text-slate-300 shadow-sm">
              <span className="text-slate-400">City: Atlanta</span>
              <span className="text-slate-600">·</span>
              <span className="text-sky-400">Gemini · drafting</span>
            </div>
          )}
        </div>
      </div>

      {/* Subheader Scenario Banner (Only visible on Ask tab as shown in Page 1 design) */}
      {activeTab === "ask" && (
        <div className="border-t border-slate-800/60 bg-[#090e18] px-6 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider">Scenario</span>
            <span className="text-slate-200 font-medium">Fund permanent cooling centers · council vote in 3 weeks</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
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
