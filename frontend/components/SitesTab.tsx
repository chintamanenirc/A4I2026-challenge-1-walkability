"use client";

import React from "react";
import { SiteData, CityBaseline } from "./types";
import {
  Search,
  ExternalLink,
  Navigation,
  Sparkles,
  GitCompare,
  ArrowRight,
} from "lucide-react";

interface SitesTabProps {
  sites: SiteData[];
  selectedSiteId: number;
  setSelectedSiteId: (id: number) => void;
  centersToFund?: number;
  cityBaseline: CityBaseline;
  onOpenCompareModal: () => void;
  onNavigateTab?: (tab: "ask" | "sites" | "equity" | "proposal") => void;
  onAskSiteQuestion?: (site: SiteData) => void;
}

export const SitesTab: React.FC<SitesTabProps> = ({
  sites,
  selectedSiteId,
  setSelectedSiteId,
  centersToFund = 3,
  cityBaseline,
  onOpenCompareModal,
  onNavigateTab,
  onAskSiteQuestion,
}) => {
  const activeSite =
    sites.find((s) => s.id === selectedSiteId) || sites[0];
  const site4 = sites.find((s) => s.id === 4) || sites[3] || sites[0];
  const isFunded = activeSite.id <= centersToFund;
  const activeLon = activeSite.lon ?? activeSite.lng;

  // Compute cumulative floating waterfall positions
  const drivers = activeSite.drivers;
  let runningTotal = 0;
  const waterfallBars = drivers.map((d) => {
    const start = runningTotal;
    const end = runningTotal + d.attributionF;
    runningTotal = end;
    const bottomVal = Math.min(start, end);
    const topVal = Math.max(start, end);
    const displayLabel =
      d.label ||
      d.feature
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      key: d.feature,
      label: displayLabel,
      attributionF: d.attributionF,
      bottomVal: Math.max(0, bottomVal),
      heightVal: Math.max(0.18, topVal - bottomVal),
      topVal,
      type: d.attributionF >= 0 ? ("adds" as const) : ("reduces" as const),
    };
  });

  const netOffset = activeSite.offsetF;
  const maxChartVal =
    Math.max(...waterfallBars.map((b) => b.topVal), netOffset, 3.5) * 1.22;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header Row & All 5 Site Selector Cards */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-50 tracking-tight">
            Why each site runs hot
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            Each bar is one feature’s contribution from the model’s
            attributions, stacked from Atlanta’s average up to the site’s
            offset. Select any candidate site (1–5) to inspect its physical
            drivers and neighborhood vulnerability.
          </p>
        </div>

        {/* 5 Candidate Site Selector Cards on Top Right */}
        <div
          role="group"
          aria-label="Candidate cooling center sites"
          className="flex flex-wrap items-center gap-2 bg-[#090e1a]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-inner"
        >
          {sites.map((site) => {
            const isActive = activeSite.id === site.id;
            const siteFunded = site.id <= centersToFund;
            return (
              <button
                key={site.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedSiteId(site.id)}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? "bg-gradient-to-br from-[#2a1c17] to-[#1f1614] border border-[#f97316]/80 ring-1 ring-[#f97316]/30 text-slate-50 shadow-lg"
                    : siteFunded
                    ? "bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 hover:ring-1 hover:ring-white/15 text-slate-200"
                    : "bg-transparent border border-dashed border-white/10 hover:bg-white/[0.04] hover:border-white/20 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors duration-200 ${
                    isActive
                      ? "bg-[#f97316] text-[#090d16] shadow-sm shadow-orange-950/50"
                      : siteFunded
                      ? "bg-white text-[#090d16]"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {site.id}
                </span>
                <div className="text-left">
                  <div className="leading-tight">{site.name}</div>
                  <div className="text-[10px] font-mono font-normal flex items-center gap-1.5 mt-0.5">
                    <span className="text-[#f97316] font-semibold">
                      +{site.offsetF.toFixed(1)}°F
                    </span>
                    <span className="text-slate-500">·</span>
                    <span
                      className={
                        siteFunded ? "text-emerald-400" : "text-slate-500"
                      }
                    >
                      {siteFunded ? "Funded" : "Alt"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (8 cols): Waterfall Chart + Dominant Driver Diagnosis inside one card */}
        <div className="lg:col-span-8 bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)] blur-2xl"
          />
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-extrabold text-slate-50 tracking-tight">
                Site {activeSite.id} · {activeSite.name}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  isFunded
                    ? "bg-emerald-950/90 border border-emerald-500/50 text-emerald-400"
                    : "bg-amber-950/90 border border-amber-500/50 text-amber-400"
                }`}
              >
                {isFunded
                  ? `Funded Pick #${activeSite.id}`
                  : `Alternate #${activeSite.id}`}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#f97316] font-mono tracking-tight">
                +{activeSite.offsetF.toFixed(1)}°F
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs. city average
              </span>
            </div>
          </div>

          {/* Floating Stacked Waterfall Plot */}
          <div className="pt-4 pb-2 relative z-10">
            <div className="relative h-[240px] w-full border-b border-white/10 px-2 sm:px-6 flex items-end justify-between gap-3 sm:gap-6">
              {waterfallBars.map((bar) => {
                const bottomPct = (bar.bottomVal / maxChartVal) * 100;
                const heightPct = (bar.heightVal / maxChartVal) * 100;
                const isAdds = bar.type === "adds";

                return (
                  <div
                    key={bar.key}
                    className="relative flex-1 h-full flex flex-col items-center justify-end group"
                  >
                    {/* Floating Bar + Value Label */}
                    <div
                      className="absolute w-full max-w-[115px] flex flex-col items-center transition-all duration-300"
                      style={{
                        bottom: `${bottomPct}%`,
                        height: `${heightPct}%`,
                      }}
                    >
                      <span
                        className={`-mt-6 mb-1 text-xs font-mono font-bold whitespace-nowrap ${
                          isAdds ? "text-[#fdba74]" : "text-[#93c5fd]"
                        }`}
                      >
                        {isAdds ? "+" : "−"}
                        {Math.abs(bar.attributionF).toFixed(1)}°F
                      </span>
                      <div
                        className={`w-full flex-1 rounded-lg shadow-md transition-all duration-200 group-hover:scale-[1.03] group-hover:ring-1 group-hover:ring-white/30 ${
                          isAdds ? "bg-gradient-to-t from-[#ea580c] to-[#f97316]" : "bg-gradient-to-t from-[#3b82f6] to-[#60a5fa]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 5th Bar: Total Site Offset starting from 0 baseline */}
              <div className="relative flex-1 h-full flex flex-col items-center justify-end">
                <div
                  className="absolute w-full max-w-[115px] flex flex-col items-center transition-all duration-300"
                  style={{
                    bottom: "0%",
                    height: `${
                      (Math.min(runningTotal, netOffset) / maxChartVal) * 100
                    }%`,
                  }}
                >
                  <span className="-mt-6 mb-1 text-xs font-mono font-bold text-[#fed7aa] whitespace-nowrap">
                    +{netOffset.toFixed(1)}°F
                  </span>
                  <div className="w-full flex-1 rounded-lg bg-[#fed7aa] border-2 border-[#f97316] shadow-lg" />
                </div>
              </div>
            </div>

            {/* X-Axis Feature Labels below baseline */}
            <div className="px-2 sm:px-6 pt-3 flex items-start justify-between gap-3 sm:gap-6">
              {waterfallBars.map((bar) => (
                <div
                  key={bar.key}
                  className="flex-1 text-center text-xs text-slate-300 font-medium leading-snug"
                >
                  {bar.label}
                </div>
              ))}
              <div className="flex-1 text-center text-xs text-slate-100 font-bold leading-snug">
                Site offset
              </div>
            </div>

            {/* Waterfall Legend Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-white/10 mt-5 pt-4">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#f97316]" />
                  <span>Adds heat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#60a5fa]" />
                  <span>Reduces heat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#fed7aa] border border-[#f97316]" />
                  <span>Site offset</span>
                </div>
              </div>
              <span className="text-slate-500 text-xs font-mono">
                Attributions wired to BQML EXPLAIN_PREDICT
              </span>
            </div>
          </div>

          {/* Dominant Driver Diagnosis Callout Box (rounded-xl child inside rounded-2xl parent) */}
          <div className="bg-[#11192b]/90 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 shadow-inner">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fb923c] to-[#f97316] text-[#090d16] flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-1 ring-inset ring-white/25">
                <Search className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  DIAGNOSIS · DOMINANT DRIVER
                </div>
                <h4 className="text-base font-extrabold text-slate-50">
                  {activeSite.dominantDriver}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                  {activeSite.dominantDiagnosis}
                </p>
              </div>
            </div>

            {onAskSiteQuestion && (
              <button
                type="button"
                onClick={() => onAskSiteQuestion(activeSite)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-[#f97316]/50 hover:ring-1 hover:ring-[#f97316]/30 active:scale-[0.98] text-xs font-bold text-slate-50 flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Ask AI about Site {activeSite.id}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): 2x2 Stat Tiles + Who lives here vs. Atlanta */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          {/* 2x2 Grid of 4 Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="text-xs text-slate-400 font-medium">
                ≥95°F days / summer
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-50 font-mono mt-2">
                {activeSite.hotDaysPerSummer}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                7-yr GHCN-D station avg
              </div>
            </div>

            <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="text-xs text-slate-400 font-medium">
                Residents nearby
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-50 font-mono mt-2">
                {activeSite.residentsReached.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                0.5 mi straight-line
              </div>
            </div>

            <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="text-xs text-slate-400 font-medium">
                Est. annual cost
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-50 font-mono mt-2">
                {activeSite.estAnnualCost}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                FY26 operating est.
              </div>
            </div>

            <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Location
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${activeSite.lat},${activeLon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open site location in Google Maps"
                    title="Open in Google Maps"
                    className="text-slate-400 hover:text-[#f97316] transition-colors duration-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeSite.lat},${activeLon}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Get walking directions in Google Maps"
                    title="Walking Directions"
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-slate-50 font-mono mt-2 leading-snug">
                [{activeSite.lat.toFixed(3)}, {activeLon.toFixed(3)}]
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Tract {activeSite.shortTract}
              </div>
            </div>
          </div>

          {/* Who lives here vs. Atlanta Card */}
          <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1 flex flex-col justify-between gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-50">
                Who lives here vs. Atlanta
              </h4>
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10">
                ACS 5-yr
              </span>
            </div>

            {/* Metric 1: Households without a car */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Households without a car
                </span>
                <span className="text-[10px] font-mono text-[#fdba74]">
                  {(activeSite.noCarPct / cityBaseline.noCarPct).toFixed(1)}×
                  city avg
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-xs text-slate-400">Site</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f97316]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(activeSite.noCarPct * 2.4)
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-xs text-slate-300 font-semibold">
                  {activeSite.noCarPct}%
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-xs text-slate-400">City</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(cityBaseline.noCarPct * 2.4)
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-xs text-slate-400 font-semibold">
                  {cityBaseline.noCarPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Metric 2: Residents 65 and older */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Residents 65 and older
                </span>
                <span className="text-[10px] font-mono text-[#fdba74]">
                  {(activeSite.seniorsPct / cityBaseline.seniorsPct).toFixed(1)}
                  × city avg
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-xs text-slate-400">Site</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f97316]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(activeSite.seniorsPct * 2.8)
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-xs text-slate-300 font-semibold">
                  {activeSite.seniorsPct}%
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-xs text-slate-400">City</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(cityBaseline.seniorsPct * 2.8)
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-xs text-slate-400 font-semibold">
                  {cityBaseline.seniorsPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Metric 3: Poverty rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Poverty rate</span>
                <span className="text-[10px] font-mono text-[#fdba74]">
                  {(activeSite.povertyRate / cityBaseline.povertyRate).toFixed(
                    1
                  )}
                  × city avg
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-xs text-slate-400">Site</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f97316]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(activeSite.povertyRate * 2.0)
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-xs text-slate-300 font-semibold">
                  {activeSite.povertyRate}%
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-xs text-slate-400">City</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(cityBaseline.povertyRate * 2.0)
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-xs text-slate-400 font-semibold">
                  {cityBaseline.povertyRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Not Site 4 Banner */}
      <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="text-base font-extrabold text-slate-50">
            Why not site 4?
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {site4.name} ranked 4th (+{site4.offsetF.toFixed(1)}°F). Each pick
            must reach people the earlier picks missed, and Site 4 has lower
            car-free vulnerability ({site4.noCarPct}% vs. {activeSite.noCarPct}%
            at {activeSite.name}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenCompareModal}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 hover:ring-1 hover:ring-white/15 active:scale-[0.98] text-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shadow-sm"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#f97316]" />
            <span>Compare with site 4</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("equity")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#fb923c] to-[#f97316] hover:from-orange-400 hover:to-orange-500 active:scale-[0.98] text-[#090d16] text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-orange-950/40 ring-1 ring-inset ring-white/25"
            >
              <span>Proceed to Equity Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footnote Row */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-1">
        <span>Offsets: one campaign day</span>
        <span>Reach: straight-line</span>
        <span>Costs: est. annual operating</span>
        <span>Predicts exposure, not health outcomes</span>
      </div>
    </div>
  );
};
