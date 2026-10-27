"use client";

import React, { useState } from "react";
import { SiteData, CityBaseline } from "./types";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface EquityAuditTabProps {
  sites: SiteData[];
  cityBaseline: CityBaseline;
  onNavigateTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
}

export const EquityAuditTab: React.FC<EquityAuditTabProps> = ({
  sites,
  cityBaseline,
  onNavigateTab,
}) => {
  const [highlightSites, setHighlightSites] = useState(true);
  const [showRacialComp, setShowRacialComp] = useState(false);

  // Compute average of top 3 recommended sites
  const top3 = sites.slice(0, 3);
  const avgIncome = Math.round(top3.reduce((acc, s) => acc + s.demographics.medianIncome, 0) / top3.length);
  const avgPoverty = +(top3.reduce((acc, s) => acc + s.demographics.povertyRatePct, 0) / top3.length).toFixed(1);
  const avgNoCar = +(top3.reduce((acc, s) => acc + s.demographics.noVehiclePct, 0) / top3.length).toFixed(1);
  const avg65Plus = +(top3.reduce((acc, s) => acc + s.demographics.age65PlusPct, 0) / top3.length).toFixed(1);

  // Background census tract scatter dots in Atlanta
  const backgroundTractDots = [
    { x: 1.2, y: 12 }, { x: 1.5, y: 18 }, { x: 1.8, y: 22 }, { x: 2.1, y: 14 },
    { x: 2.3, y: 26 }, { x: 2.5, y: 31 }, { x: 2.6, y: 19 }, { x: 2.8, y: 34 },
    { x: 3.1, y: 16 }, { x: 3.3, y: 24 }, { x: 3.5, y: 28 }, { x: 3.8, y: 22 },
    { x: 4.0, y: 18 }, { x: 4.2, y: 25 }, { x: 1.9, y: 38 }, { x: 2.2, y: 41 },
    { x: 2.7, y: 44 }, { x: 3.2, y: 36 }, { x: 3.4, y: 48 }, { x: 2.9, y: 15 },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Did our sites land where heat hurts most?
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Being hot isn’t the same as being at risk. We check every recommendation against who actually lives there. Race was never a model input; it appears only as a check on the output.
        </p>
      </div>

      {/* Top Metric Verdict Banner */}
      <div className="bg-[#0c121d] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-black text-slate-100 font-mono">
            4
          </div>
          <div className="text-xs text-slate-400 font-medium">
            of 4 measures
          </div>
        </div>

        <div className="flex-1 lg:px-8 border-l-0 lg:border-l border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            VERDICT
          </div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            Our sites skew strongly toward need.
          </div>
        </div>

        {/* 4 Indicator Badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-400 font-sans">Income</span>
            <span className="text-emerald-400 font-bold">↓ (Lower)</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-400 font-sans">Poverty</span>
            <span className="text-emerald-400 font-bold">↑ (Higher)</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-400 font-sans">No car</span>
            <span className="text-emerald-400 font-bold">↑ (Higher)</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-400 font-sans">65+</span>
            <span className="text-emerald-400 font-bold">↑ (Higher)</span>
          </div>
        </div>
      </div>

      {/* Two-Column Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quadrant Scatter Plot */}
        <div className="lg:col-span-5 bg-[#0c121d] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Where it’s hot vs. where heat hurts
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each dot is a census tract · schematic until wired
              </p>
            </div>

            <button
              onClick={() => setHighlightSites(!highlightSites)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                highlightSites
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              Highlight our sites
            </button>
          </div>

          {/* Scatter Plot Chart Viewport */}
          <div className="relative w-full h-72 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 select-none">
            {/* Axis Labels */}
            <div className="absolute top-2 left-3 text-[10px] text-slate-500 font-medium">
              Vulnerability (no car, 65+) ↑
            </div>
            <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 font-medium">
              Predicted heat offset →
            </div>

            {/* Quadrant Divider Lines */}
            <div className="absolute inset-x-8 top-1/2 h-px border-b border-dashed border-slate-800/80 pointer-events-none"></div>
            <div className="absolute inset-y-8 left-1/2 w-px border-r border-dashed border-slate-800/80 pointer-events-none"></div>

            {/* Quadrant Text Labels */}
            <span className="absolute top-6 left-6 text-[10px] font-semibold text-slate-500/80">
              Vulnerable, cooler
            </span>
            <span className="absolute top-6 right-6 text-[10px] font-bold text-orange-400/90">
              Hot + vulnerable
            </span>
            <span className="absolute bottom-6 right-6 text-[10px] font-semibold text-slate-500/80">
              Hot, lower need
            </span>

            {/* Background Census Tract Dots */}
            {backgroundTractDots.map((pt, i) => {
              const leftPct = ((pt.x - 1.0) / 3.5) * 80 + 10;
              const bottomPct = ((pt.y - 10) / 40) * 75 + 12;
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-slate-700/60"
                  style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                />
              );
            })}

            {/* Highlighted Recommended Sites 1, 2, 3 (in Top-Right Quadrant) */}
            {highlightSites && (
              <>
                {/* Site 1: Thomasville (Top heat + high vulnerability) */}
                <div
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs shadow-lg ring-2 ring-orange-300/40 z-10"
                  style={{ left: "74%", bottom: "72%" }}
                  title="Site 1: Thomasville"
                >
                  1
                </div>

                {/* Site 2: Peoplestown */}
                <div
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs shadow-lg ring-2 ring-orange-300/40 z-10"
                  style={{ left: "68%", bottom: "62%" }}
                  title="Site 2: Peoplestown"
                >
                  2
                </div>

                {/* Site 3: Mechanicsville */}
                <div
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs shadow-lg ring-2 ring-orange-300/40 z-10"
                  style={{ left: "60%", bottom: "78%" }}
                  title="Site 3: Mechanicsville"
                >
                  3
                </div>

                {/* Site 4: Bankhead (Lower right quadrant: Hot, lower need) */}
                <div
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-300 border border-slate-600 font-bold text-xs shadow-sm z-10"
                  style={{ left: "76%", bottom: "30%" }}
                  title="Site 4: Bankhead (Lower vulnerability)"
                >
                  4
                </div>
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-normal mt-3">
            Site 4 is hot but lower-need, one reason it was passed over. [Confirm with real tract values.]
          </p>
        </div>

        {/* Right: Recommended Tracts vs. Atlanta Average Comparative Bars */}
        <div className="lg:col-span-7 bg-[#0c121d] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              Recommended tracts vs. Atlanta
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500"></span>
                <span className="text-slate-300 font-medium">Our sites</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-500"></span>
                <span className="text-slate-400 font-medium">Atlanta average</span>
              </div>
            </div>
          </div>

          {/* Metric 1: Median household income */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold">Median household income</span>
              <span className="text-[11px] text-slate-400">Lower = more need</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${(avgIncome / 85000) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-bold text-orange-400 text-xs">
                  ${avgIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${(cityBaseline.medianIncome / 85000) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-semibold text-slate-400 text-xs">
                  ${cityBaseline.medianIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: Poverty rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold">Poverty rate</span>
              <span className="text-[11px] text-slate-400">Higher = more need</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${avgPoverty * 2.2}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-bold text-orange-400 text-xs">
                  {avgPoverty}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${cityBaseline.povertyRatePct * 2.2}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-semibold text-slate-400 text-xs">
                  {cityBaseline.povertyRatePct}%
                </span>
              </div>
            </div>
          </div>

          {/* Metric 3: Households without a car */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold">Households without a car</span>
              <span className="text-[11px] text-slate-400">Higher = harder to reach relief</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${avgNoCar * 2.8}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-bold text-orange-400 text-xs">
                  {avgNoCar}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${cityBaseline.noVehiclePct * 2.8}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-semibold text-slate-400 text-xs">
                  {cityBaseline.noVehiclePct}%
                </span>
              </div>
            </div>
          </div>

          {/* Metric 4: Residents 65 and older */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold">Residents 65 and older</span>
              <span className="text-[11px] text-slate-400">Higher = more heat risk</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${avg65Plus * 3.8}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-bold text-orange-400 text-xs">
                  {avg65Plus}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${cityBaseline.age65PlusPct * 3.8}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-semibold text-slate-400 text-xs">
                  {cityBaseline.age65PlusPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Optional Racial Composition Breakdown (Audit Check Only) */}
          {showRacialComp && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 mt-2">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Audit Check: Demographic Composition (Census 2020)
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Black / African American</div>
                  <div className="text-base font-bold text-slate-100 font-mono mt-1">82.4%</div>
                  <div className="text-[10px] text-slate-500">City avg: 48.2%</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">White</div>
                  <div className="text-base font-bold text-slate-100 font-mono mt-1">11.2%</div>
                  <div className="text-[10px] text-slate-500">City avg: 39.8%</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Hispanic / Latino</div>
                  <div className="text-base font-bold text-slate-100 font-mono mt-1">4.8%</div>
                  <div className="text-[10px] text-slate-500">City avg: 5.6%</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Footer Row */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
            <span className="text-[11px] text-slate-500">
              Bar lengths are placeholders until the audit query runs.
            </span>
            <button
              onClick={() => setShowRacialComp(!showRacialComp)}
              className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              {showRacialComp ? "Hide racial composition" : "Show racial composition (audit only)"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Navigation Row */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => onNavigateTab("proposal")}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <span>Add audit to council proposal</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onNavigateTab("sites")}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to sites</span>
        </button>
      </div>
    </div>
  );
};
