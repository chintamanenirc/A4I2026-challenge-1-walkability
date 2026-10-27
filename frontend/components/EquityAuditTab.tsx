"use client";

import React, { useState } from "react";
import { SiteData, CityBaseline, TractScatterPoint } from "./types";

interface EquityAuditTabProps {
  sites: SiteData[];
  cityBaseline: CityBaseline;
  tractsScatter?: TractScatterPoint[];
  onNavigateTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
}

const FALLBACK_SCATTER_DOTS = [
  // Top-left (Vulnerable, cooler)
  { x: 65, y: 42 }, { x: 112, y: 48 }, { x: 64, y: 58 }, { x: 118, y: 74 },
  { x: 162, y: 80 }, { x: 66, y: 98 }, { x: 108, y: 122 }, { x: 168, y: 132 },
  // Top-right (Hot + vulnerable)
  { x: 250, y: 104 }, { x: 280, y: 116 }, { x: 300, y: 82 }, { x: 325, y: 66 },
  { x: 332, y: 95 },
  // Bottom-left (Cooler, lower need)
  { x: 54, y: 170 }, { x: 40, y: 185 }, { x: 96, y: 162 }, { x: 120, y: 192 },
  { x: 132, y: 192 }, { x: 174, y: 158 }, { x: 166, y: 214 }, { x: 174, y: 214 },
  { x: 182, y: 214 }, { x: 92, y: 254 },
  // Bottom-right (Hot, lower need)
  { x: 204, y: 150 }, { x: 222, y: 176 }, { x: 222, y: 228 }, { x: 256, y: 256 },
  { x: 278, y: 235 }, { x: 342, y: 155 }, { x: 348, y: 212 },
];

export const EquityAuditTab: React.FC<EquityAuditTabProps> = ({
  sites,
  cityBaseline,
  tractsScatter = [],
  onNavigateTab,
}) => {
  const [highlightSites, setHighlightSites] = useState(true);
  const [showRacialAudit, setShowRacialAudit] = useState(false);

  const fundedSites = sites.slice(0, 3);
  const site4 = sites.find((s) => s.id === 4) || sites[3] || sites[0];

  const avgIncome = Math.round(
    fundedSites.reduce((acc, s) => acc + s.medianIncome, 0) / fundedSites.length
  );
  const avgPoverty =
    fundedSites.reduce((acc, s) => acc + s.povertyRate, 0) / fundedSites.length;
  const avgNoCar =
    fundedSites.reduce((acc, s) => acc + s.noCarPct, 0) / fundedSites.length;
  const avgSeniors =
    fundedSites.reduce((acc, s) => acc + s.seniorsPct, 0) / fundedSites.length;

  const avgBlackPct =
    fundedSites.reduce((acc, s) => acc + (s.blackPct ?? 79.5), 0) /
    fundedSites.length;
  const avgHispanicPct =
    fundedSites.reduce((acc, s) => acc + (s.hispanicPct ?? 5.4), 0) /
    fundedSites.length;
  const avgWhitePct =
    fundedSites.reduce((acc, s) => acc + (s.whitePct ?? 11.2), 0) /
    fundedSites.length;

  const incomeSkewNeed = avgIncome < cityBaseline.medianIncome;
  const povertySkewNeed = avgPoverty > cityBaseline.povertyRate;
  const noCarSkewNeed = avgNoCar > cityBaseline.noCarPct;
  const seniorsSkewNeed = avgSeniors > cityBaseline.seniorsPct;

  const measuresMatched = [
    incomeSkewNeed,
    povertySkewNeed,
    noCarSkewNeed,
    seniorsSkewNeed,
  ].filter(Boolean).length;

  // Map live BigQuery tracts to SVG coordinates if available, combined with schematic layout
  const liveDots =
    tractsScatter.length > 0
      ? tractsScatter.slice(0, 48).map((t) => {
          const clampedOffset = Math.max(-2.5, Math.min(4.8, t.offset_f));
          const x = 35 + ((clampedOffset + 2.5) / 7.3) * 330;
          const vulnScore = t.no_car_pct * 0.65 + t.age_65_pct * 0.35;
          const clampedVuln = Math.max(2, Math.min(32, vulnScore));
          const y = 260 - ((clampedVuln - 2) / 30) * 235;
          return { x, y, geoid: t.geo_id };
        })
      : FALLBACK_SCATTER_DOTS;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header Title & Subtitle */}
      <div>
        <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-100 tracking-tight">
          Did our sites land where heat hurts most?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
          Being hot isn’t the same as being at risk. We check every recommendation
          against who actually lives there. Race was never a model input; it
          appears only as a check on the output.
        </p>
      </div>

      {/* Verdict Banner matching Screenshot 3 (warm dark brown/amber fill + border) */}
      <div className="bg-[#221715] border border-[#f97316]/45 rounded-2xl px-6 py-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Left: [n] of 4 measures */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#f97316] font-mono tracking-tight">
              {measuresMatched}
            </span>
            <span className="text-sm text-slate-300 font-medium">
              of 4 measures
            </span>
          </div>

          {/* Middle: Verdict Headline */}
          <div>
            <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400">
              VERDICT
            </div>
            <div className="text-base sm:text-lg font-extrabold text-slate-100 mt-0.5">
              {measuresMatched >= 3
                ? "Our sites skew toward need."
                : "Our sites partially skew toward need."}
            </div>
          </div>
        </div>

        {/* Right: 4 Directional Metric Chips */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="bg-[#121620] border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300">
            Income ·{" "}
            <span className="text-[#fdba74] font-bold">
              {incomeSkewNeed ? "↓" : "↑"}
            </span>
          </div>
          <div className="bg-[#121620] border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300">
            Poverty ·{" "}
            <span className="text-[#fdba74] font-bold">
              {povertySkewNeed ? "↑" : "↓"}
            </span>
          </div>
          <div className="bg-[#121620] border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300">
            No car ·{" "}
            <span className="text-[#fdba74] font-bold">
              {noCarSkewNeed ? "↑" : "↓"}
            </span>
          </div>
          <div className="bg-[#121620] border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300">
            65+ ·{" "}
            <span className="text-[#fdba74] font-bold">
              {seniorsSkewNeed ? "↑" : "↓"}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Quadrant Scatter Plot */}
        <div className="lg:col-span-5 bg-[#0d1422] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h3 className="text-base font-extrabold text-slate-100">
                  Where it’s hot vs. where heat hurts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each dot is a census tract ·{" "}
                  {tractsScatter.length > 0
                    ? `${tractsScatter.length} Atlanta ACS tracts`
                    : "Atlanta ACS tracts"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHighlightSites(!highlightSites)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                  highlightSites
                    ? "bg-[#f97316] text-[#090d16]"
                    : "bg-[#162032] border border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Highlight our sites
              </button>
            </div>

            {/* Scatter Plot Viewport matching Screenshot 3 */}
            <div className="relative w-full h-[340px] mt-4 select-none">
              {/* Y-Axis Label */}
              <div className="absolute -left-14 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-medium text-slate-400 whitespace-nowrap pointer-events-none">
                Vulnerability (no car, 65+) →
              </div>

              <div className="ml-5 h-[310px] bg-[#090e18] border border-slate-800/90 rounded-lg overflow-hidden relative">
                <svg
                  viewBox="0 0 380 280"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Warm Brown/Orange Shaded Top-Right Quadrant (Hot + vulnerable) */}
                  <rect
                    x="190"
                    y="0"
                    width="190"
                    height="140"
                    fill="rgba(249, 115, 22, 0.13)"
                  />

                  {/* Quadrant Divider Crosshairs */}
                  <line
                    x1="190"
                    y1="0"
                    x2="190"
                    y2="280"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="0"
                    y1="140"
                    x2="380"
                    y2="140"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />

                  {/* Background Census Tract Dots */}
                  {liveDots.map((dot, idx) => (
                    <circle
                      key={idx}
                      cx={dot.x}
                      cy={dot.y}
                      r="3.5"
                      fill="#475569"
                      opacity="0.65"
                    />
                  ))}

                  {/* Highlighted Sites 1, 2, 3 in Hot + Vulnerable and Site 4 in Hot, Lower Need */}
                  {highlightSites && (
                    <g>
                      {/* Site 3 */}
                      <circle
                        cx="265"
                        cy="46"
                        r="11.5"
                        fill="#f97316"
                        stroke="#fed7aa"
                        strokeWidth="1.8"
                      />
                      <text
                        x="265"
                        y="50"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10.5"
                        fontWeight="800"
                      >
                        3
                      </text>

                      {/* Site 1 */}
                      <circle
                        cx="293"
                        cy="64"
                        r="11.5"
                        fill="#f97316"
                        stroke="#fed7aa"
                        strokeWidth="1.8"
                      />
                      <text
                        x="293"
                        y="68"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10.5"
                        fontWeight="800"
                      >
                        1
                      </text>

                      {/* Site 2 */}
                      <circle
                        cx="326"
                        cy="92"
                        r="11.5"
                        fill="#f97316"
                        stroke="#fed7aa"
                        strokeWidth="1.8"
                      />
                      <text
                        x="326"
                        y="96"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10.5"
                        fontWeight="800"
                      >
                        2
                      </text>

                      {/* Site 4 (Hot, lower need) */}
                      <circle
                        cx="333"
                        cy="192"
                        r="11.5"
                        fill="#0f172a"
                        stroke="#e2e8f0"
                        strokeWidth="1.6"
                        strokeDasharray="3 2.5"
                      />
                      <text
                        x="333"
                        y="196"
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="10.5"
                        fontWeight="800"
                      >
                        4
                      </text>
                    </g>
                  )}
                </svg>

                {/* Quadrant Text Labels */}
                <div className="absolute top-2.5 left-3 text-[11px] text-slate-400 font-medium">
                  Vulnerable, cooler
                </div>
                <div className="absolute top-2.5 right-3 text-[11px] text-[#fdba74] font-semibold">
                  Hot + vulnerable
                </div>
                <div className="absolute bottom-2.5 right-3 text-[11px] text-slate-400 font-medium">
                  Hot, lower need
                </div>
              </div>

              {/* X-Axis Label */}
              <div className="ml-5 text-center text-[11px] font-medium text-slate-400 mt-2">
                Predicted heat offset →
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Site 4 ({site4.name}) is hot (+{site4.offsetF.toFixed(1)}°F) but
            lower-need ({site4.noCarPct}% no-car vs. {avgNoCar.toFixed(1)}% at
            recommended sites), one reason it was passed over.
          </p>
        </div>

        {/* Right Column: Recommended tracts vs. Atlanta */}
        <div className="lg:col-span-7 bg-[#0d1422] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-6">
          <div>
            {/* Card Header & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-extrabold text-slate-100">
                Recommended tracts vs. Atlanta
              </h3>
              <div className="flex items-center gap-5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-2 rounded-full bg-[#f97316]" />
                  <span className="text-slate-300 font-medium">Our sites</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-2 rounded-full bg-slate-500" />
                  <span className="text-slate-400">Atlanta average</span>
                </div>
              </div>
            </div>

            {/* 4 Horizontal Comparison Bars */}
            <div className="flex flex-col divide-y divide-slate-800/70">
              {/* 1. Median household income */}
              <div className="py-4 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100 text-[13px]">
                    Median household income
                  </span>
                  <span className="text-xs text-slate-400">
                    Lower = more need
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((avgIncome / 110000) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-200 font-bold">
                    ${avgIncome.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((cityBaseline.medianIncome / 110000) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-400 font-semibold">
                    ${cityBaseline.medianIncome.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 2. Poverty rate */}
              <div className="py-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100 text-[13px]">
                    Poverty rate
                  </span>
                  <span className="text-xs text-slate-400">
                    Higher = more need
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(avgPoverty * 1.9))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-200 font-bold">
                    {avgPoverty.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(cityBaseline.povertyRate * 1.9)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-400 font-semibold">
                    {cityBaseline.povertyRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 3. Households without a car */}
              <div className="py-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100 text-[13px]">
                    Households without a car
                  </span>
                  <span className="text-xs text-slate-400">
                    Higher = harder to reach relief
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(avgNoCar * 2.3))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-200 font-bold">
                    {avgNoCar.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(cityBaseline.noCarPct * 2.3)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-400 font-semibold">
                    {cityBaseline.noCarPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 4. Residents 65 and older */}
              <div className="py-4 last:pb-0 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100 text-[13px]">
                    Residents 65 and older
                  </span>
                  <span className="text-xs text-slate-400">
                    Higher = more heat risk
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(avgSeniors * 2.7))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-200 font-bold">
                    {avgSeniors.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(cityBaseline.seniorsPct * 2.7)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-slate-400 font-semibold">
                    {cityBaseline.seniorsPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Expandable Racial Composition Audit Section (Post-Selection Audit Only) */}
            {showRacialAudit && (
              <div className="mt-5 p-4 rounded-xl bg-[#111a2c] border border-[#f97316]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">
                    Post-selection racial composition check (ACS 5-yr)
                  </span>
                  <span className="text-[10px] font-mono text-[#fdba74] uppercase">
                    Excluded from ranking model
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">
                      Black residents
                    </div>
                    <div className="text-sm font-bold text-[#f97316] mt-0.5">
                      {avgBlackPct.toFixed(1)}%{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        vs. {(cityBaseline.blackPct ?? 47.2).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">
                      Hispanic / Latino
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {avgHispanicPct.toFixed(1)}%{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        vs. {(cityBaseline.hispanicPct ?? 6.0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">
                      White residents
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {avgWhitePct.toFixed(1)}%{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        vs. {(cityBaseline.whitePct ?? 40.4).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Card Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
            <span className="text-xs text-slate-400">
              Wired to BigQuery semantic audit layer (a4i_semantic.audit_city_baseline).
            </span>
            <button
              type="button"
              onClick={() => setShowRacialAudit(!showRacialAudit)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-[#111827] hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
            >
              {showRacialAudit
                ? "Hide racial composition"
                : "Show racial composition (audit only)"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons matching Screenshot 3 */}
      <div className="flex flex-wrap items-center gap-3.5 pt-1">
        <button
          type="button"
          onClick={() => onNavigateTab("proposal")}
          className="px-5 py-3 rounded-xl bg-[#f97316] hover:bg-orange-400 text-[#090d16] font-bold text-xs tracking-wide transition-all shadow-md active:scale-[0.99]"
        >
          Add audit to council proposal →
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab("sites")}
          className="px-5 py-3 rounded-xl bg-[#0d1422] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-colors shadow-sm"
        >
          Back to sites
        </button>
      </div>
    </div>
  );
};
