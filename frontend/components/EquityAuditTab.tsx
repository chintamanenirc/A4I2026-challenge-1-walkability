"use client";

import React, { useState } from "react";
import { SiteData, CityBaseline } from "./types";

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
  const [showRacialAudit, setShowRacialAudit] = useState(false);

  // Background tract dots for the scatter plot
  const tractScatterDots = [
    { x: 30, y: 70 }, { x: 45, y: 60 }, { x: 60, y: 80 }, { x: 75, y: 75 },
    { x: 90, y: 55 }, { x: 110, y: 65 }, { x: 125, y: 90 }, { x: 140, y: 70 },
    { x: 155, y: 85 }, { x: 170, y: 60 }, { x: 185, y: 45 }, { x: 200, y: 75 },
    { x: 215, y: 50 }, { x: 230, y: 65 }, { x: 245, y: 40 }, { x: 260, y: 70 },
    { x: 275, y: 55 }, { x: 290, y: 35 }, { x: 310, y: 60 }, { x: 325, y: 45 },
    { x: 50, y: 140 }, { x: 80, y: 150 }, { x: 110, y: 130 }, { x: 140, y: 160 },
    { x: 170, y: 145 }, { x: 200, y: 135 }, { x: 230, y: 155 }, { x: 260, y: 140 },
    { x: 290, y: 165 }, { x: 320, y: 150 }, { x: 70, y: 190 }, { x: 100, y: 210 },
    { x: 130, y: 185 }, { x: 160, y: 200 }, { x: 190, y: 180 }, { x: 220, y: 195 },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Title & Introduction */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Did our sites land where heat hurts most?
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
          Being hot isn’t the same as being at risk. We check every recommendation against who actually lives there. Race was never a model input; it appears only as a check on the output.
        </p>
      </div>

      {/* Metric Verdict Banner matching PDF Screen */}
      <div className="bg-[#161214] border border-orange-950/60 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Measure count */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-100 font-mono">[n]</span>
          <span className="text-xs text-slate-400 font-medium">of 4 measures</span>
        </div>

        {/* Middle: Verdict Headline */}
        <div className="flex-1 max-w-md">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            VERDICT
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1">
            [Our sites skew toward / away from need.]
          </div>
        </div>

        {/* Right: 4 Directional Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="bg-[#0c121e] border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300">
            Income · <span className="text-orange-400 font-bold">[↑/↓]</span>
          </div>
          <div className="bg-[#0c121e] border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300">
            Poverty · <span className="text-orange-400 font-bold">[↑/↓]</span>
          </div>
          <div className="bg-[#0c121e] border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300">
            No car · <span className="text-orange-400 font-bold">[↑/↓]</span>
          </div>
          <div className="bg-[#0c121e] border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300">
            65+ · <span className="text-orange-400 font-bold">[↑/↓]</span>
          </div>
        </div>
      </div>

      {/* Main Analysis: 2 Columns with gap-6 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Scatter Plot (Where it’s hot vs. where heat hurts) */}
        <div className="lg:col-span-6 bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-100">
                Where it’s hot vs. where heat hurts
              </h3>
              <button
                onClick={() => setHighlightSites(!highlightSites)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                  highlightSites
                    ? "bg-[#ea580c] text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Highlight our sites
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Each dot is a census tract · schematic until wired
            </p>

            {/* Quadrant Scatter Viewport */}
            <div className="relative w-full h-[350px] bg-[#090d16] border border-slate-800/80 rounded-xl overflow-hidden p-6 select-none">
              {/* Quadrant Divider Grid */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-slate-800/80" />
                <div className="absolute h-full w-px bg-slate-800/80" />
              </div>

              {/* Quadrant Labels matching PDF Screen */}
              <div className="absolute top-3 left-3 text-[10px] font-semibold text-slate-500 uppercase">
                Vulnerable, cooler
              </div>
              <div className="absolute top-3 right-3 text-[10px] font-semibold text-slate-400 uppercase">
                Hot + vulnerable
              </div>
              <div className="absolute bottom-8 right-3 text-[10px] font-semibold text-slate-500 uppercase">
                Hot, lower need
              </div>

              {/* Y-axis label */}
              <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-slate-400 origin-center">
                Vulnerability (no car, 65+) →
              </div>

              {/* Scatter SVG */}
              <svg viewBox="0 0 400 260" className="w-full h-full">
                {/* Background City Tracts */}
                {tractScatterDots.map((dot, idx) => (
                  <circle
                    key={idx}
                    cx={dot.x}
                    cy={dot.y}
                    r="3"
                    fill="#334155"
                    opacity="0.6"
                  />
                ))}

                {/* Highlighted Sites 1, 2, 3 in Hot + Vulnerable Quadrant */}
                {highlightSites && (
                  <g>
                    {/* Site 3 */}
                    <circle cx="270" cy="75" r="10" fill="#ea580c" className="drop-shadow-md" />
                    <text x="270" y="79" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      3
                    </text>

                    {/* Site 1 */}
                    <circle cx="295" cy="90" r="10" fill="#ea580c" className="drop-shadow-md" />
                    <text x="295" y="94" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      1
                    </text>

                    {/* Site 2 */}
                    <circle cx="325" cy="115" r="10" fill="#ea580c" className="drop-shadow-md" />
                    <text x="325" y="119" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      2
                    </text>

                    {/* Site 4 in Hot, Lower Need Quadrant */}
                    <circle
                      cx="345"
                      cy="185"
                      r="9.5"
                      fill="#162032"
                      stroke="#94a3b8"
                      strokeWidth="1.8"
                      strokeDasharray="3 2"
                    />
                    <text x="345" y="189" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="bold">
                      4
                    </text>
                  </g>
                )}
              </svg>

              {/* X-axis label */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-400">
                Predicted heat offset →
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-3 border-t border-slate-800/60 leading-relaxed">
            Site 4 is hot but lower-need, one reason it was passed over. [Confirm with real tract values.]
          </p>
        </div>

        {/* Right Column: Comparative Horizontal Bars vs. Atlanta */}
        <div className="lg:col-span-6 bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/60">
              <h3 className="text-sm font-bold text-slate-100">
                Recommended tracts vs. Atlanta
              </h3>
              <div className="flex items-center gap-5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#ea580c]"></span>
                  <span className="text-slate-300 font-medium">Our sites</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
                  <span className="text-slate-400">Atlanta average</span>
                </div>
              </div>
            </div>

            {/* 4 Comparative Metric Bars with ample gap-6 */}
            <div className="flex flex-col gap-6">
              {/* Measure 1: Median household income */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Median household income</span>
                  <span className="text-[11px] text-slate-400">Lower = more need</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#ea580c] rounded" style={{ width: "51%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-orange-400 font-bold">[value]</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-500 rounded" style={{ width: "80%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-slate-400 font-bold">[value]</span>
                </div>
              </div>

              {/* Measure 2: Poverty rate */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Poverty rate</span>
                  <span className="text-[11px] text-slate-400">Higher = more need</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#ea580c] rounded" style={{ width: "70%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-orange-400 font-bold">[value]</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-500 rounded" style={{ width: "34%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-slate-400 font-bold">[value]</span>
                </div>
              </div>

              {/* Measure 3: Households without a car */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Households without a car</span>
                  <span className="text-[11px] text-slate-400">Higher = harder to reach relief</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#ea580c] rounded" style={{ width: "76%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-orange-400 font-bold">[value]</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-500 rounded" style={{ width: "25%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-slate-400 font-bold">[value]</span>
                </div>
              </div>

              {/* Measure 4: Residents 65 and older */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Residents 65 and older</span>
                  <span className="text-[11px] text-slate-400">Higher = more heat risk</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#ea580c] rounded" style={{ width: "60%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-orange-400 font-bold">[value]</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3.5 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-500 rounded" style={{ width: "42%" }} />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-slate-400 font-bold">[value]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-6 mt-4">
            <span className="text-xs text-slate-500">
              Bar lengths are placeholders until the audit query runs.
            </span>
            <button
              onClick={() => setShowRacialAudit(!showRacialAudit)}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              {showRacialAudit ? "Hide racial composition" : "Show racial composition (audit only)"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Controls matching PDF Screen */}
      <div className="flex items-center gap-6 pt-4">
        <button
          onClick={() => onNavigateTab("proposal")}
          className="px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-semibold text-xs tracking-wide transition-all shadow-md active:scale-[0.99]"
        >
          Add audit to council proposal →
        </button>
        <button
          onClick={() => onNavigateTab("sites")}
          className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors shadow-sm"
        >
          Back to sites
        </button>
      </div>
    </div>
  );
};
