"use client";

import React from "react";
import { Thermometer, MapPin } from "lucide-react";

interface NavbarProps {
  activeTab: "ask" | "sites" | "equity" | "proposal";
  setActiveTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
  centersToFund?: number;
  totalReached?: number;
  totalBudgetStr?: string;
  onOpenCompareModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: "ask" as const, label: "Ask" },
    { id: "sites" as const, label: "Sites" },
    { id: "equity" as const, label: "Equity audit" },
    { id: "proposal" as const, label: "Proposal" },
  ];

  const isAsk = activeTab === "ask";

  return (
    <header className="border-b border-[#1a2436] bg-[#090d16] sticky top-0 z-50 w-full print:hidden">
      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto w-full px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Thermometer Logo, Title & City Pill */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center text-[#090d16] shadow-sm shrink-0">
            <Thermometer className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-slate-100 tracking-tight leading-tight">
              Atlanta Heat Planner
            </h1>
            {isAsk && (
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Decision support for cooling-center siting · City of Atlanta
              </p>
            )}
          </div>

          {isAsk && (
            <div className="hidden sm:flex items-center gap-1.5 ml-1 px-3 py-1 rounded-lg border border-[#223147] bg-[#111927] text-xs text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="font-semibold text-xs">Atlanta, GA</span>
              <span className="text-slate-400 text-[11px] ml-0.5">▾</span>
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#111927] border border-[#1f2d42] p-1 rounded-xl">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                  active
                    ? "bg-[#f97316] text-[#090d16] font-extrabold shadow-sm"
                    : "text-slate-300 hover:text-white font-medium"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Tab-Specific Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1f2d42] bg-[#111927] text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          {activeTab === "ask" && (
            <span>ADK agent · 3 tools · Vertex AI</span>
          )}
          {activeTab === "sites" && (
            <span>BQML · ML.EXPLAIN_PREDICT</span>
          )}
          {activeTab === "equity" && (
            <span>Audit · ACS 2022 5-yr · 353 tracts</span>
          )}
          {activeTab === "proposal" && (
            <span>Draft · auto-generated · editable</span>
          )}
        </div>
      </div>

      {/* Subheader Scenario Bar (shown on Ask tab per Screenshot 1) */}
      {isAsk && (
        <div className="border-t border-[#182232] bg-[#0b101b]">
          <div className="max-w-7xl mx-auto w-full px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#2e1d15] border border-[#f97316]/40 text-[#fdba74] font-mono text-[10px] font-bold uppercase tracking-wider">
                Scenario
              </span>
              <span className="text-slate-200 font-semibold">
                Fund 3 permanent cooling centers ($600k cap)
              </span>
              <span className="text-slate-400">
                · Council vote in 3 weeks · City of Atlanta
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
              <span className="px-2.5 py-0.5 rounded-md bg-[#131d2e] border border-[#223147] text-slate-300">
                Heat Watch · 23.4k pts
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#131d2e] border border-[#223147] text-slate-300">
                GHCN · 7 yrs
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#131d2e] border border-[#223147] text-slate-300">
                ACS · 353 tracts
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
