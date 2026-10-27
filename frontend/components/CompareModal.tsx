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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0c121d] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
              VS
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Compare: {siteA.name} (Funded) vs. {siteB.name} (Site 4)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid with gap-6 and consistent p-6 */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          {/* Site A (Funded) */}
          <div className="bg-slate-900/80 border border-orange-500/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">{siteA.name}</span>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                FUNDED #1
              </span>
            </div>
            <div className="space-y-2 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Offset:</span>
                <span className="font-bold text-orange-400">+{siteA.offsetF.toFixed(1)}°F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Residents reached:</span>
                <span>{siteA.residentsReached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Poverty rate:</span>
                <span className="text-rose-400 font-bold">{siteA.demographics.povertyRatePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">No vehicle rate:</span>
                <span className="text-rose-400 font-bold">{siteA.demographics.noVehiclePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Primary driver:</span>
                <span className="capitalize text-slate-200">{siteA.dominantDriver}</span>
              </div>
            </div>
          </div>

          {/* Site B (Site 4 - Bankhead) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">{siteB.name}</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">
                DISPLACED #4
              </span>
            </div>
            <div className="space-y-2 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Offset:</span>
                <span className="font-bold text-orange-400">+{siteB.offsetF.toFixed(1)}°F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Residents reached:</span>
                <span>{siteB.residentsReached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Poverty rate:</span>
                <span>{siteB.demographics.povertyRatePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">No vehicle rate:</span>
                <span>{siteB.demographics.noVehiclePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Primary driver:</span>
                <span className="capitalize text-slate-200">{siteB.dominantDriver}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Displaced Callout */}
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-6 flex items-start gap-4 text-xs text-amber-200/90">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-amber-300">Why site 4 was passed over:</span> While {siteB.name} experiences elevated temperatures (+{siteB.offsetF.toFixed(1)}°F), its demographic vulnerability is markedly lower (19.2% poverty vs. 32.1% in {siteA.name}). Furthermore, placing a center here would overlap within the 1-mile transit radius of existing higher-need cooling corridors.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Understood · Close
          </button>
        </div>
      </div>
    </div>
  );
};
