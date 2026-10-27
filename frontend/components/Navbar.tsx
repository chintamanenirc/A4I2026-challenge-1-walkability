"use client";

import React from "react";
import { Thermometer, MapPin, ChevronDown } from "lucide-react";

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
    <header className="border-b border-[#1a2436] bg-[#0b111b] sticky top-0 z-50 w-full">
      {/* Main Header Row */}
      <div className="max-w-[1440px] mx-auto w-full px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Thermometer Logo, Title & City Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center text-[#090d16] shadow-sm shrink-0">
              <Thermometer className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-100 tracking-tight leading-tight">
                {isAsk ? "Heat Planner" : "Atlanta Heat Planner"}
              </h1>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                {isAsk
                  ? "Internal city planning tool"
                  : "City of Atlanta · internal planning tool"}
              </p>
            </div>
          </div>

          {isAsk && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#223147] bg-[#111927] text-xs text-slate-200 hover:border-slate-600 cursor-pointer transition-colors">
              <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="font-semibold text-xs">City: Atlanta</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#111927] border border-[#1f2d42] p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[#f97316] text-[#090d16] font-bold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Contextual Status Badge */}
        <div className="flex items-center gap-3">
          {activeTab === "ask" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#223147] bg-[#111927] text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Agent live · Cloud Run</span>
            </div>
          )}

          {activeTab === "sites" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#223147] bg-[#111927] text-xs font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
                <span>City: Atlanta</span>
              </div>
              <span className="text-slate-400 font-mono text-xs tracking-wide">
                ML.EXPLAIN_PREDICT
              </span>
            </div>
          )}

          {activeTab === "equity" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#223147] bg-[#111927] text-xs font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
                <span>City: Atlanta</span>
              </div>
              <span className="text-slate-400 font-mono text-xs">
                Audit of our own output
              </span>
            </div>
          )}

          {activeTab === "proposal" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#223147] bg-[#111927] text-xs font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
                <span>City: Atlanta</span>
              </div>
              <span className="text-slate-400 font-mono text-xs">
                Gemini · drafting
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subheader Scenario Banner on Ask Tab */}
      {isAsk && (
        <div className="border-t border-[#182232] bg-[#0a0f18]">
          <div className="max-w-[1440px] mx-auto w-full px-6 py-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Scenario</span>
            <span className="text-slate-100 font-bold mr-1">
              Fund permanent cooling centers · council vote in 3 weeks
            </span>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-300">
              <span className="px-2.5 py-0.5 rounded-md bg-[#111927] border border-[#223147]">
                Heat Watch · 1 campaign day
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#111927] border border-[#223147]">
                Stations · 7 yrs
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#111927] border border-[#223147]">
                ACS tracts
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
