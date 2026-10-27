"use client";

import React from "react";
import { SiteData, CityBaseline } from "./types";
import { Search } from "lucide-react";

interface SitesTabProps {
  sites: SiteData[];
  selectedSiteId: number;
  setSelectedSiteId: (id: number) => void;
  cityBaseline: CityBaseline;
  onOpenCompareModal: () => void;
}

export const SitesTab: React.FC<SitesTabProps> = ({
  sites,
  selectedSiteId,
  setSelectedSiteId,
  cityBaseline,
  onOpenCompareModal,
}) => {
  const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const site4 = sites.find((s) => s.id === 4) || sites[3];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Title & Site Selector Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Why each site runs hot
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Each bar is one feature’s contribution from the model’s attributions, stacked from Atlanta’s average up to the site’s offset.
          </p>
        </div>

        {/* Site Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-full shadow-sm">
          {sites.slice(0, 3).map((site) => (
            <button
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSite.id === site.id
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span className="mr-1 font-bold">{site.id}</span>
              <span>{site.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-[#0c121d] border border-slate-800 rounded-2xl p-7 shadow-xl space-y-8">
        {/* Site Header & Stat Badges Grid */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          {/* Left: Site Title & Big Offset */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Site {activeSite.id} · {activeSite.name}
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-black text-orange-400 font-mono">
                +{activeSite.offsetF.toFixed(1)}°F
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs. city average
              </span>
            </div>
          </div>

          {/* Right: 4 Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 min-w-[120px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">≥95°F days / summer</div>
              <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{activeSite.daysAbove95}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 min-w-[120px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Residents nearby</div>
              <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{activeSite.residentsReached.toLocaleString()}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 min-w-[120px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. annual cost</div>
              <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{activeSite.annualCost}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 min-w-[130px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Location</div>
              <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                [{activeSite.lat.toFixed(3)}, {activeSite.lon.toFixed(3)}]
              </div>
              <div className="text-[10px] text-slate-400">Tract {activeSite.tractId}</div>
            </div>
          </div>
        </div>

        {/* Waterfall Attribution Chart */}
        <div className="space-y-4">
          <div className="h-56 flex items-end justify-between gap-4 px-6 pt-6 pb-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
            {/* Attribution Bars */}
            {activeSite.drivers.map((driver) => {
              const isWarming = driver.attributionF >= 0;
              const heightPx = Math.max(24, Math.abs(driver.attributionF) * 65);

              return (
                <div key={driver.feature} className="flex-1 flex flex-col items-center gap-2 max-w-[110px]">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isWarming ? "text-orange-400" : "text-sky-400"
                    }`}
                  >
                    {isWarming ? "+" : "−"}
                    {Math.abs(driver.attributionF).toFixed(1)}°F
                  </span>

                  <div
                    className={`w-full rounded-lg transition-all duration-300 shadow-md ${
                      isWarming
                        ? "bg-gradient-to-t from-orange-600 to-amber-500 border border-orange-400/40"
                        : "bg-gradient-to-t from-sky-700 to-cyan-500 border border-sky-400/40"
                    }`}
                    style={{ height: `${heightPx}px` }}
                  />

                  <span className="text-[11px] text-slate-300 text-center font-medium capitalize mt-1">
                    {driver.feature.replace("_", " ")}
                  </span>
                </div>
              );
            })}

            {/* Total Site Offset Bar */}
            <div className="flex-1 flex flex-col items-center gap-2 max-w-[110px]">
              <span className="text-xs font-mono font-black text-amber-300">
                +{activeSite.offsetF.toFixed(1)}°F
              </span>

              <div
                className="w-full rounded-lg bg-gradient-to-t from-amber-600 via-yellow-500 to-amber-400 border border-amber-300/50 shadow-lg"
                style={{ height: `${Math.max(60, activeSite.offsetF * 36)}px` }}
              />

              <span className="text-[11px] text-amber-200 text-center font-bold mt-1">
                Site offset
              </span>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 pt-1">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500"></span>
                <span>Adds heat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-500"></span>
                <span>Reduces heat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400"></span>
                <span>Site offset</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 italic">
              Bar heights illustrative until wired to attributions
            </span>
          </div>
        </div>

        {/* Diagnosis & Demographic Comparison Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Left: Dominant Driver Diagnosis */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Search className="w-3 h-3" />
              </div>
              <span>DIAGNOSIS · DOMINANT DRIVER</span>
            </div>

            <h4 className="text-base font-bold text-slate-100 capitalize">
              {activeSite.dominantDriver}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeSite.dominantDiagnosis}
            </p>
          </div>

          {/* Right: Demographic Bars vs Atlanta City Average */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Who lives here vs. Atlanta
            </h4>

            {/* Metric 1: Households without a car */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Households without a car</span>
              </div>

              {/* Site bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-[11px] text-slate-400">Site</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${activeSite.demographics.noVehiclePct * 2.5}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono font-semibold text-orange-400 text-xs">
                  {activeSite.demographics.noVehiclePct}%
                </span>
              </div>

              {/* City bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-[11px] text-slate-400">City</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${cityBaseline.noVehiclePct * 2.5}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-400 text-xs">
                  {cityBaseline.noVehiclePct}%
                </span>
              </div>
            </div>

            {/* Metric 2: Residents 65 and older */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Residents 65 and older</span>
              </div>

              {/* Site bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-[11px] text-slate-400">Site</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${activeSite.demographics.age65PlusPct * 3.5}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono font-semibold text-orange-400 text-xs">
                  {activeSite.demographics.age65PlusPct}%
                </span>
              </div>

              {/* City bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 text-[11px] text-slate-400">City</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${cityBaseline.age65PlusPct * 3.5}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-400 text-xs">
                  {cityBaseline.age65PlusPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Not Site 4 Banner */}
      <div className="bg-[#0c121d] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <h4 className="text-sm font-bold text-slate-100">
            Why not site 4?
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            <span className="text-slate-200 font-semibold">{site4.name}</span> ranked 4th. Each pick must reach people the earlier picks missed.
          </p>
        </div>

        <button
          onClick={onOpenCompareModal}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          Compare with site 4
        </button>
      </div>

      {/* Bottom Methodology Footnote */}
      <div className="text-[11px] text-slate-500 text-center border-t border-slate-800/60 pt-4">
        Offsets: one campaign day · Reach: straight-line · Costs: placeholders · Predicts exposure, not health outcomes
      </div>
    </div>
  );
};
