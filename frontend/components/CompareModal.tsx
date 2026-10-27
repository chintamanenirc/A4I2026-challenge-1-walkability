"use client";

import React from "react";
import { SiteData } from "./types";
import { X, AlertCircle } from "lucide-react";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteA: SiteData;
  siteB: SiteData;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  siteA,
  siteB,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0d1422] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#f97316] text-[#090d16] flex items-center justify-center text-xs font-extrabold">
              VS
            </div>
            <h3 className="text-base font-extrabold text-slate-100">
              Compare: Site {siteA.id} ({siteA.name}) vs. Site 4 ({siteB.name})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Site A (Funded) */}
          <div className="bg-[#111a2c] border-2 border-[#f97316]/70 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-100 text-sm">
                {siteA.id} · {siteA.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-[10px]">
                FUNDED #{siteA.id}
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Heat offset:</span>
                <span className="font-bold text-[#f97316]">
                  +{siteA.offsetF.toFixed(1)}°F
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Residents nearby:
                </span>
                <span>{siteA.residentsReached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Poverty rate:</span>
                <span className="text-[#fdba74] font-bold">
                  {siteA.povertyRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Households without car:
                </span>
                <span className="text-[#fdba74] font-bold">
                  {siteA.noCarPct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Seniors (65+):
                </span>
                <span>{siteA.seniorsPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Dominant driver:
                </span>
                <span className="text-slate-200 font-sans font-semibold">
                  {siteA.dominantDriver}
                </span>
              </div>
            </div>
          </div>

          {/* Site B (Site 4) */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-100 text-sm">
                4 · {siteB.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold text-[10px]">
                DISPLACED #4
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Heat offset:</span>
                <span className="font-bold text-[#f97316]">
                  +{siteB.offsetF.toFixed(1)}°F
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Residents nearby:
                </span>
                <span>{siteB.residentsReached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Poverty rate:</span>
                <span>{siteB.povertyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Households without car:
                </span>
                <span>{siteB.noCarPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Seniors (65+):
                </span>
                <span>{siteB.seniorsPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Dominant driver:
                </span>
                <span className="text-slate-200 font-sans font-semibold">
                  {siteB.dominantDriver}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Displaced Callout */}
        <div className="bg-[#221715] border border-[#f97316]/40 rounded-xl p-5 flex items-start gap-3.5 text-xs text-slate-200">
          <AlertCircle className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-[#fdba74]">
              Why site 4 was passed over:
            </span>{" "}
            While {siteB.name} experiences elevated heat (+
            {siteB.offsetF.toFixed(1)}°F), its vulnerability is markedly lower (
            {siteB.povertyRate}% poverty and {siteB.noCarPct}% car-free
            households vs. {siteA.povertyRate}% poverty and {siteA.noCarPct}%
            car-free in {siteA.name}). Furthermore, each selected site must reach
            vulnerable residents that earlier picks missed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-orange-400 text-[#090d16] font-bold text-xs shadow-md transition-colors"
          >
            Understood · Close
          </button>
        </div>
      </div>
    </div>
  );
};
