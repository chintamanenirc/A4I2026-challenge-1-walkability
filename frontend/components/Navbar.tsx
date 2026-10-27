"use client";

import React from "react";
import {
  Thermometer,
  MapPin,
  MessageSquare,
  BarChart3,
  Scale,
  FileText,
  GitCompare,
  Database,
} from "lucide-react";

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
  centersToFund = 3,
  totalReached = 12260,
  totalBudgetStr = "$540k",
  onOpenCompareModal,
}) => {
  const tabs = [
    { id: "ask" as const, step: "1", label: "Ask", icon: MessageSquare },
    { id: "sites" as const, step: "2", label: "Sites", icon: BarChart3 },
    { id: "equity" as const, step: "3", label: "Equity audit", icon: Scale },
    { id: "proposal" as const, step: "4", label: "Proposal", icon: FileText },
  ];

  const isAsk = activeTab === "ask";

  return (
    <header className="border-b border-white/10 bg-[#0d1322]/85 backdrop-blur-xl sticky top-0 z-50 w-full print:hidden shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]">
      {/* Main Header Row */}
      <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Thermometer Logo, Title & City Pill */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Go to Ask tab"
            onClick={() => setActiveTab("ask")}
            className="flex items-center gap-3.5 text-left group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/60 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fb923c] via-[#f97316] to-[#ea580c] flex items-center justify-center text-[#090d16] shadow-md shadow-orange-950/60 ring-1 ring-inset ring-white/25 shrink-0 group-hover:scale-105 transition-all duration-200">
              <Thermometer className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-50 tracking-tight leading-tight">
                Atlanta Heat Planner
              </h1>
              {isAsk && (
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Decision support for cooling-center siting · City of Atlanta
                </p>
              )}
            </div>
          </button>

          {isAsk && (
            <div
              className="hidden sm:flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs text-slate-200 shadow-inner"
              aria-label="Selected city: Atlanta, Georgia"
            >
              <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="font-semibold text-xs">Atlanta, GA</span>
              <span className="text-slate-400 text-[11px] ml-0.5">▾</span>
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs (rounded-2xl parent with rounded-xl children) */}
        <nav
          aria-label="Primary planning navigation"
          className="flex items-center gap-1.5 bg-[#090e1a]/90 border border-white/10 p-1.5 rounded-2xl shadow-inner backdrop-blur-md"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs transition-all duration-200 flex items-center gap-2 whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/60 ${
                  active
                    ? "bg-gradient-to-b from-[#fb923c] to-[#f97316] text-[#090d16] font-extrabold shadow-md shadow-orange-950/40 ring-1 ring-inset ring-white/25"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06] hover:ring-1 hover:ring-white/15 font-medium"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Active Scenario Pill + Quick Compare + Tab-Specific Status Badge */}
        <div className="hidden md:flex items-center gap-2.5">
          <div
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs"
            title="Active scenario funding and resident coverage"
          >
            <span className="font-mono font-bold text-[#f97316]">
              {centersToFund} {centersToFund === 1 ? "site" : "sites"}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-200 font-semibold">
              {(totalReached / 1000).toFixed(1)}k reached
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {totalBudgetStr}
            </span>
          </div>

          {onOpenCompareModal && (
            <button
              type="button"
              aria-label="Compare candidate cooling center sites"
              onClick={onOpenCompareModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 hover:ring-1 hover:ring-white/20 active:scale-[0.98] text-xs font-semibold text-slate-200 transition-all duration-200"
            >
              <GitCompare className="w-3.5 h-3.5 text-[#f97316]" />
              <span>Compare</span>
            </button>
          )}

          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-xs font-mono text-slate-300"
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.75)]" />
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
      </div>

      {/* Subheader Scenario Bar (shown on Ask tab per Screenshot 1) */}
      {isAsk && (
        <div className="border-t border-white/[0.08] bg-[#0a0f1c]/90 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/35 text-[#fdba74] font-mono text-[10px] font-bold uppercase tracking-wider">
                Scenario
              </span>
              <span className="text-slate-100 font-semibold">
                Fund {centersToFund} permanent cooling{" "}
                {centersToFund === 1 ? "center" : "centers"} ($600k cap)
              </span>
              <span className="text-slate-400">
                · Council vote in 3 weeks · City of Atlanta
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 transition-all duration-200 hover:border-white/20">
                <Database className="w-3 h-3 text-[#f97316]" />
                Heat Watch · 23.4k pts
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 transition-all duration-200 hover:border-white/20">
                GHCN · 7 yrs
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 transition-all duration-200 hover:border-white/20">
                ACS · 353 tracts
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
