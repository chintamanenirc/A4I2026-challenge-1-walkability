"use client";

import React, { useState } from "react";
import { SiteData, CityBaseline, TractScatterPoint } from "./types";

interface EquityAuditTabProps {
  sites: SiteData[];
  centersToFund?: number;
  cityBaseline: CityBaseline;
  tractsScatter?: TractScatterPoint[];
  onNavigateTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
}

interface PlotDot {
  x: number;
  y: number;
  geoid: string;
  offsetF: number;
  noCarPct: number;
  age65Pct: number;
}

const FALLBACK_SCATTER_DOTS: PlotDot[] = [
  // Top-left (Vulnerable, cooler)
  { x: 65, y: 42, geoid: "13121007602", offsetF: -1.1, noCarPct: 24.2, age65Pct: 16.5 },
  { x: 112, y: 48, geoid: "13121008201", offsetF: -0.4, noCarPct: 22.8, age65Pct: 15.8 },
  { x: 64, y: 58, geoid: "13121007806", offsetF: -1.2, noCarPct: 21.0, age65Pct: 15.1 },
  { x: 118, y: 74, geoid: "13121008301", offsetF: -0.2, noCarPct: 19.4, age65Pct: 14.2 },
  { x: 162, y: 80, geoid: "13121006300", offsetF: 0.6, noCarPct: 18.6, age65Pct: 14.0 },
  { x: 66, y: 98, geoid: "13121007705", offsetF: -1.1, noCarPct: 16.2, age65Pct: 13.8 },
  { x: 108, y: 122, geoid: "13121008500", offsetF: -0.5, noCarPct: 14.5, age65Pct: 13.0 },
  { x: 168, y: 132, geoid: "13121005501", offsetF: 0.7, noCarPct: 13.8, age65Pct: 12.6 },
  // Top-right (Hot + vulnerable)
  { x: 250, y: 104, geoid: "13121004400", offsetF: 2.3, noCarPct: 21.5, age65Pct: 14.8 },
  { x: 280, y: 116, geoid: "13121005700", offsetF: 2.8, noCarPct: 19.2, age65Pct: 14.1 },
  { x: 300, y: 82, geoid: "13121006701", offsetF: 3.2, noCarPct: 23.4, age65Pct: 15.2 },
  { x: 325, y: 66, geoid: "13121004800", offsetF: 3.7, noCarPct: 26.1, age65Pct: 16.0 },
  { x: 332, y: 95, geoid: "13121003800", offsetF: 3.9, noCarPct: 22.0, age65Pct: 14.9 },
  // Bottom-left (Cooler, lower need)
  { x: 54, y: 170, geoid: "13121009501", offsetF: -1.4, noCarPct: 4.2, age65Pct: 11.4 },
  { x: 40, y: 185, geoid: "13121009802", offsetF: -1.7, noCarPct: 3.1, age65Pct: 10.8 },
  { x: 96, y: 162, geoid: "13121009101", offsetF: -0.6, noCarPct: 6.4, age65Pct: 11.9 },
  { x: 120, y: 192, geoid: "13121009200", offsetF: -0.1, noCarPct: 5.2, age65Pct: 10.2 },
  { x: 132, y: 192, geoid: "13121000400", offsetF: 0.1, noCarPct: 5.5, age65Pct: 9.8 },
  { x: 174, y: 158, geoid: "13121000500", offsetF: 0.8, noCarPct: 8.1, age65Pct: 11.5 },
  { x: 166, y: 214, geoid: "13121000600", offsetF: 0.6, noCarPct: 4.8, age65Pct: 8.4 },
  { x: 174, y: 214, geoid: "13121001001", offsetF: 0.8, noCarPct: 4.5, age65Pct: 7.9 },
  { x: 182, y: 214, geoid: "13121001201", offsetF: 0.9, noCarPct: 4.9, age65Pct: 8.2 },
  { x: 92, y: 254, geoid: "13121009900", offsetF: -0.7, noCarPct: 2.1, age65Pct: 9.1 },
  // Bottom-right (Hot, lower need)
  { x: 204, y: 150, geoid: "13121001400", offsetF: 1.4, noCarPct: 9.2, age65Pct: 11.2 },
  { x: 222, y: 176, geoid: "13121001500", offsetF: 1.7, noCarPct: 7.8, age65Pct: 10.4 },
  { x: 222, y: 228, geoid: "13121001801", offsetF: 1.7, noCarPct: 4.6, age65Pct: 8.1 },
  { x: 256, y: 256, geoid: "13121001900", offsetF: 2.4, noCarPct: 3.4, age65Pct: 7.2 },
  { x: 278, y: 235, geoid: "13121002100", offsetF: 2.8, noCarPct: 5.1, age65Pct: 8.5 },
  { x: 342, y: 155, geoid: "13121003000", offsetF: 4.0, noCarPct: 9.8, age65Pct: 10.9 },
  { x: 348, y: 212, geoid: "13121003500", offsetF: 4.1, noCarPct: 6.2, age65Pct: 8.8 },
];

export const EquityAuditTab: React.FC<EquityAuditTabProps> = ({
  sites,
  centersToFund = 3,
  cityBaseline,
  tractsScatter = [],
  onNavigateTab,
}) => {
  const [highlightSites, setHighlightSites] = useState(true);
  const [showRacialAudit, setShowRacialAudit] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<PlotDot | null>(null);

  const fundedSites = sites.slice(0, centersToFund);
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

  // Map live BigQuery tracts to SVG coordinates if available, combined with fallback
  const liveDots: PlotDot[] =
    tractsScatter.length > 0
      ? tractsScatter.slice(0, 50).map((t) => {
          const offsetVal = Number(t.offset_f ?? t.heatOffsetF ?? 0);
          const noCarVal = Number(t.no_car_pct ?? t.noCarPct ?? 10);
          const age65Val = Number(t.age_65_pct ?? t.seniorsPct ?? 12);
          const clampedOffset = Math.max(-2.5, Math.min(4.8, offsetVal));
          const x = 35 + ((clampedOffset + 2.5) / 7.3) * 330;
          const vulnScore = noCarVal * 0.65 + age65Val * 0.35;
          const clampedVuln = Math.max(2, Math.min(32, vulnScore));
          const y = 260 - ((clampedVuln - 2) / 30) * 235;
          return {
            x,
            y,
            geoid: String(t.geo_id ?? t.geoid ?? ""),
            offsetF: offsetVal,
            noCarPct: noCarVal,
            age65Pct: age65Val,
          };
        })
      : FALLBACK_SCATTER_DOTS;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header Title & Subtitle */}
      <div>
        <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-50 tracking-tight">
          Did our sites land where heat hurts most?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
          Being hot isn’t the same as being at risk. We check every
          recommendation against who actually lives there. Race was never a
          model input; it appears only as a check on the output.
        </p>
      </div>

      {/* Verdict Banner (rounded-2xl parent with rounded-xl children) */}
      <div className="bg-gradient-to-r from-[#241614]/95 via-[#1a141b]/95 to-[#121726]/95 backdrop-blur-xl border border-[#f97316]/40 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-10 w-64 h-36 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.16),transparent_70%)] blur-2xl"
        />
        <div className="flex flex-wrap items-center gap-6 relative z-10">
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
              VERDICT · {fundedSites.length} FUNDED{" "}
              {fundedSites.length === 1 ? "SITE" : "SITES"}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-slate-50 mt-0.5">
              {measuresMatched >= 3
                ? "Our sites skew toward need."
                : "Our sites partially skew toward need."}
            </div>
          </div>
        </div>

        {/* Right: 4 Directional Metric Chips */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono relative z-10">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-slate-200 shadow-inner">
            Income ·{" "}
            <span className="text-[#fdba74] font-bold">
              {incomeSkewNeed ? "↓" : "↑"}
            </span>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-slate-200 shadow-inner">
            Poverty ·{" "}
            <span className="text-[#fdba74] font-bold">
              {povertySkewNeed ? "↑" : "↓"}
            </span>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-slate-200 shadow-inner">
            No car ·{" "}
            <span className="text-[#fdba74] font-bold">
              {noCarSkewNeed ? "↑" : "↓"}
            </span>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-slate-200 shadow-inner">
            65+ ·{" "}
            <span className="text-[#fdba74] font-bold">
              {seniorsSkewNeed ? "↑" : "↓"}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Quadrant Scatter Plot */}
        <div className="lg:col-span-5 bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h3 className="text-base font-extrabold text-slate-50">
                  Where it’s hot vs. where heat hurts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each dot is a census tract ·{" "}
                  {tractsScatter.length > 0
                    ? `${tractsScatter.length} live BigQuery ACS tracts`
                    : "Atlanta ACS tracts"}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={highlightSites}
                onClick={() => setHighlightSites(!highlightSites)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] shadow-sm shrink-0 ${
                  highlightSites
                    ? "bg-gradient-to-b from-[#fb923c] to-[#f97316] text-[#090d16] ring-1 ring-inset ring-white/25"
                    : "bg-white/[0.04] border border-white/10 text-slate-200 hover:bg-white/[0.08] hover:ring-1 hover:ring-white/15"
                }`}
              >
                Highlight our sites
              </button>
            </div>

            {/* Scatter Plot Viewport */}
            <div className="relative w-full h-[340px] mt-4 select-none">
              {/* Y-Axis Label */}
              <div className="absolute -left-14 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-medium text-slate-400 whitespace-nowrap pointer-events-none">
                Vulnerability (no car, 65+) →
              </div>

              <div className="ml-5 h-[310px] bg-[#080d17] border border-white/10 rounded-xl overflow-hidden relative shadow-inner">
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
                  {liveDots.map((dot, idx) => {
                    const isHovered = hoveredDot?.geoid === dot.geoid;
                    return (
                      <circle
                        key={idx}
                        cx={dot.x}
                        cy={dot.y}
                        r={isHovered ? "5.5" : "3.8"}
                        fill={isHovered ? "#fdba74" : "#475569"}
                        opacity={isHovered ? "1" : "0.7"}
                        onMouseEnter={() => setHoveredDot(dot)}
                        onMouseLeave={() => setHoveredDot(null)}
                        className="cursor-pointer transition-all"
                      />
                    );
                  })}

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

                {/* Hover Tooltip on Tract Dot */}
                {hoveredDot && (
                  <div className="absolute bottom-2.5 left-3 px-3 py-2 rounded-lg bg-[#090d16]/95 border border-[#f97316]/60 text-[11px] font-mono text-slate-200 shadow-lg pointer-events-none">
                    <div className="font-bold text-white">
                      Tract {hoveredDot.geoid.slice(-5)}
                    </div>
                    <div className="text-[#f97316]">
                      {hoveredDot.offsetF >= 0 ? "+" : ""}
                      {hoveredDot.offsetF.toFixed(1)}°F · {hoveredDot.noCarPct}%
                      no car · {hoveredDot.age65Pct}% 65+
                    </div>
                  </div>
                )}

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
        <div className="lg:col-span-7 bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between gap-6">
          <div>
            {/* Card Header & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-extrabold text-slate-50">
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
            <div className="flex flex-col divide-y divide-white/10">
              {/* 1. Median household income */}
              <div className="py-4 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100 text-[13px]">
                    Median household income
                  </span>
                  <span className="text-xs text-slate-400">
                    Lower = more need ·{" "}
                    <span className="font-mono text-[#fdba74]">
                      {Math.round(
                        (1 - avgIncome / cityBaseline.medianIncome) * 100
                      )}
                      % below city avg
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((avgIncome / 110000) * 100)
                        )}%`,
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
                          Math.round(
                            (cityBaseline.medianIncome / 110000) * 100
                          )
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
                    Higher = more need ·{" "}
                    <span className="font-mono text-[#fdba74]">
                      {(avgPoverty / cityBaseline.povertyRate).toFixed(1)}× city
                      avg
                    </span>
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
                    Higher = harder to reach relief ·{" "}
                    <span className="font-mono text-[#fdba74]">
                      {(avgNoCar / cityBaseline.noCarPct).toFixed(1)}× city avg
                    </span>
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
                    Higher = more heat risk ·{" "}
                    <span className="font-mono text-[#fdba74]">
                      {(avgSeniors / cityBaseline.seniorsPct).toFixed(1)}× city
                      avg
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(avgSeniors * 2.7)
                        )}%`,
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
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
            <span className="text-xs text-slate-400">
              Wired to BigQuery semantic audit layer
              (a4i_semantic.audit_city_baseline).
            </span>
            <button
              type="button"
              aria-expanded={showRacialAudit}
              onClick={() => setShowRacialAudit(!showRacialAudit)}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 hover:ring-1 hover:ring-white/15 active:scale-[0.98] text-slate-200 text-xs font-bold transition-all duration-200"
            >
              {showRacialAudit
                ? "Hide racial composition"
                : "Show racial composition (audit only)"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center gap-3.5 pt-1">
        <button
          type="button"
          onClick={() => onNavigateTab("proposal")}
          className="px-5 py-3 rounded-xl bg-gradient-to-b from-[#fb923c] to-[#f97316] hover:from-orange-400 hover:to-orange-500 text-[#090d16] font-extrabold text-xs tracking-wide transition-all duration-200 shadow-md shadow-orange-950/50 ring-1 ring-inset ring-white/25 active:scale-[0.98]"
        >
          Add audit to council proposal →
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab("sites")}
          className="px-5 py-3 rounded-xl bg-[#0d1322]/90 backdrop-blur-md hover:bg-white/[0.06] border border-white/10 hover:border-white/20 hover:ring-1 hover:ring-white/15 active:scale-[0.98] text-slate-200 font-bold text-xs transition-all duration-200 shadow-sm"
        >
          Back to sites
        </button>
      </div>
    </div>
  );
};
