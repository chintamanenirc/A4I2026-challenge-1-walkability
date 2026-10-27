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
    <div className="max-w-7xl mx-auto w-full p-6 flex flex-col gap-6">
      {/* Title & Site Selector Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Why each site runs hot
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Each bar is one feature’s contribution from the model’s attributions, stacked from Atlanta’s average up to the site’s offset.
          </p>
        </div>

        {/* Top Right Site Selector Pills */}
        <div className="flex items-center gap-2 bg-[#090d16] border border-slate-800 p-1.5 rounded-full shadow-sm">
          {sites.slice(0, 3).map((site) => (
            <button
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSite.id === site.id
                  ? "bg-[#ea580c] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span className="mr-1 font-bold">{site.id}</span>
              <span>[{site.name}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Top Header of the Site */}
        <div className="flex items-baseline justify-between border-b border-slate-800/60 pb-4">
          <div className="flex items-baseline gap-4">
            <h3 className="text-lg font-bold text-slate-100">
              Site {activeSite.id} · [{activeSite.name}]
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-400 font-mono">
                +[X.X]°F
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs. city average
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Grid with gap-6 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (65% width): Waterfall Attribution Chart + Diagnosis */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Waterfall Chart */}
            <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-6 space-y-5">
              <div className="h-56 flex items-end justify-between gap-4 px-4 pt-4 pb-2">
                {/* 1. Impervious surface */}
                <div className="flex-1 flex flex-col items-center gap-2 max-w-[110px]">
                  <span className="text-xs font-mono font-bold text-orange-400">+[X.X]°F</span>
                  <div className="w-full h-32 rounded-t-md bg-[#ea580c] shadow-md" />
                  <span className="text-xs text-slate-300 text-center font-medium capitalize mt-1">
                    Impervious surface
                  </span>
                </div>

                {/* 2. Street density */}
                <div className="flex-1 flex flex-col items-center gap-2 max-w-[110px]">
                  <span className="text-xs font-mono font-bold text-orange-400">+[X.X]°F</span>
                  <div className="w-full h-24 rounded-t-md bg-[#ea580c] shadow-md" />
                  <span className="text-xs text-slate-300 text-center font-medium capitalize mt-1">
                    Street density
                  </span>
                </div>

                {/* 3. Land-use mix */}
                <div className="flex-1 flex flex-col items-center gap-2 max-w-[110px]">
                  <span className="text-xs font-mono font-bold text-orange-400">+[X.X]°F</span>
                  <div className="w-full h-20 rounded-t-md bg-[#ea580c] shadow-md" />
                  <span className="text-xs text-slate-300 text-center font-medium capitalize mt-1">
                    Land-use mix
                  </span>
                </div>

                {/* 4. Park proximity */}
                <div className="flex-1 flex flex-col items-center gap-2 max-w-[110px]">
                  <span className="text-xs font-mono font-bold text-sky-400">−[X.X]°F</span>
                  <div className="w-full h-12 rounded-t-md bg-sky-500 shadow-md" />
                  <span className="text-xs text-slate-300 text-center font-medium capitalize mt-1">
                    Park proximity
                  </span>
                </div>

                {/* 5. Site offset */}
                <div className="flex-1 flex flex-col items-center gap-2 max-w-[120px]">
                  <span className="text-xs font-mono font-black text-amber-300">+[X.X]°F</span>
                  <div className="w-full h-44 rounded-t-md bg-[#fed7aa] shadow-lg border border-amber-300/40" />
                  <span className="text-xs text-amber-200 text-center font-bold mt-1">
                    Site offset
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3.5 px-2">
                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#ea580c]"></span>
                    <span>Adds heat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                    <span>Reduces heat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#fed7aa]"></span>
                    <span>Site offset</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">
                  Bar heights illustrative until wired to attributions
                </span>
              </div>
            </div>

            {/* Dominant Driver Diagnosis Card matching PDF */}
            <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Search className="w-3 h-3" />
                </div>
                <span className="text-xs">DIAGNOSIS · DOMINANT DRIVER</span>
              </div>

              <h4 className="text-base font-bold text-slate-100">
                {activeSite.dominantDriver}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeSite.dominantDiagnosis}
              </p>
            </div>
          </div>

          {/* Right Column (35% width): Stat Tiles Grid + Demographics */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* 4 Stat Tiles in 2x2 Grid matching PDF Screen */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tile 1 */}
              <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">≥95°F days / summer</div>
                <div className="text-xl font-bold text-slate-100 font-mono">[Z]</div>
              </div>

              {/* Tile 2 */}
              <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Residents nearby</div>
                <div className="text-xl font-bold text-slate-100 font-mono">[N]</div>
              </div>

              {/* Tile 3 */}
              <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. annual cost</div>
                <div className="text-xl font-bold text-slate-100 font-mono">[COST]</div>
              </div>

              {/* Tile 4 */}
              <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Location</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">
                  [33.7xxx, −84.4xxx]
                </div>
                <div className="text-[10px] text-slate-400">Tract [ID]</div>
              </div>
            </div>

            {/* Demographic Bars Card: Who lives here vs. Atlanta */}
            <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-6 space-y-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Who lives here vs. Atlanta
              </h4>

              {/* Metric 1: Households without a car */}
              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-medium">
                  Households without a car
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-xs text-slate-400">Site</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-[#ea580c]" style={{ width: "60%" }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-orange-400 font-semibold">[%]</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-xs text-slate-400">City</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-500" style={{ width: "28%" }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-slate-400 font-semibold">[%]</span>
                </div>
              </div>

              {/* Metric 2: Residents 65 and older */}
              <div className="space-y-2 pt-1">
                <div className="text-xs text-slate-300 font-medium">
                  Residents 65 and older
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-xs text-slate-400">Site</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-[#ea580c]" style={{ width: "50%" }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-orange-400 font-semibold">[%]</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-xs text-slate-400">City</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-500" style={{ width: "35%" }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-slate-400 font-semibold">[%]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Not Site 4 Banner matching PDF Screen */}
      <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
        <div>
          <h4 className="text-sm font-bold text-slate-100">
            Why not site 4?
          </h4>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            [Neighborhood D] ranked 4th. Each pick must reach people the earlier picks missed.
          </p>
        </div>

        <button
          onClick={onOpenCompareModal}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          Compare with site 4
        </button>
      </div>

      {/* Bottom Footnote matching PDF Screen */}
      <div className="text-xs text-slate-500 text-center border-t border-slate-800/60 pt-4">
        Offsets: one campaign day · Reach: straight-line · Costs: placeholders · Predicts exposure, not health outcomes
      </div>
    </div>
  );
};
