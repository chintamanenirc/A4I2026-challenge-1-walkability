"use client";

import React, { useState, useEffect } from "react";
import { SiteData } from "./types";
import { X, AlertCircle, GitCompare } from "lucide-react";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteA: SiteData;
  siteB: SiteData;
  allSites?: SiteData[];
  centersToFund?: number;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  siteA,
  siteB,
  allSites = [],
  centersToFund = 3,
}) => {
  const [leftId, setLeftId] = useState<number>(siteA.id);
  const [rightId, setRightId] = useState<number>(siteB.id);

  useEffect(() => {
    setLeftId(siteA.id);
    setRightId(siteB.id === siteA.id ? (siteA.id === 4 ? 1 : 4) : siteB.id);
  }, [siteA.id, siteB.id, isOpen]);

  if (!isOpen) return null;

  const leftSite =
    allSites.find((s) => s.id === leftId) || siteA;
  const rightSite =
    allSites.find((s) => s.id === rightId) || siteB;

  const isLeftFunded = leftSite.id <= centersToFund;
  const isRightFunded = rightSite.id <= centersToFund;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
    >
      <div className="bg-[#0d1322]/95 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-10 w-64 h-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12),transparent_70%)] blur-2xl"
        />
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#fb923c] to-[#f97316] text-[#090d16] flex items-center justify-center text-xs font-extrabold shadow-sm ring-1 ring-inset ring-white/25">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="compare-modal-title"
                className="text-base font-extrabold text-slate-50"
              >
                Compare Candidate Sites: Site {leftSite.id} vs. Site{" "}
                {rightSite.id}
              </h3>
              <p className="text-[11px] text-slate-400">
                Select any two candidate sites below to compare heat drivers and
                neighborhood need
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close comparison dialog"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/[0.08] active:scale-[0.95] transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Site Selector Row if allSites provided */}
        {allSites.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs relative z-10">
            <div>
              <label
                htmlFor="compare-left-site"
                className="block text-[10px] font-mono uppercase text-slate-400 mb-1"
              >
                Left Comparison Site
              </label>
              <select
                id="compare-left-site"
                value={leftId}
                onChange={(e) => setLeftId(Number(e.target.value))}
                className="w-full bg-[#080d17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-[#f97316]/70 focus:ring-2 focus:ring-[#f97316]/25 transition-all duration-200"
              >
                {allSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    Site {s.id} · {s.name} (+{s.offsetF.toFixed(1)}°F)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="compare-right-site"
                className="block text-[10px] font-mono uppercase text-slate-400 mb-1"
              >
                Right Comparison Site
              </label>
              <select
                id="compare-right-site"
                value={rightId}
                onChange={(e) => setRightId(Number(e.target.value))}
                className="w-full bg-[#080d17] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-[#f97316]/70 focus:ring-2 focus:ring-[#f97316]/25 transition-all duration-200"
              >
                {allSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    Site {s.id} · {s.name} (+{s.offsetF.toFixed(1)}°F)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Comparison Grid (rounded-xl children inside rounded-2xl parent) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs relative z-10">
          {/* Left Site */}
          <div className="bg-[#11192b]/90 backdrop-blur-md border border-[#f97316]/60 ring-1 ring-[#f97316]/20 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-100 text-sm">
                {leftSite.id} · {leftSite.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  isLeftFunded
                    ? "bg-emerald-950 border border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isLeftFunded
                  ? `FUNDED #${leftSite.id}`
                  : `ALTERNATE #${leftSite.id}`}
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Heat offset:</span>
                <span className="font-bold text-[#f97316]">
                  +{leftSite.offsetF.toFixed(1)}°F
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  ≥95°F days / summer:
                </span>
                <span>{leftSite.hotDaysPerSummer} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Residents nearby:
                </span>
                <span>{leftSite.residentsReached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Poverty rate:</span>
                <span className="text-[#fdba74] font-bold">
                  {leftSite.povertyRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Households without car:
                </span>
                <span className="text-[#fdba74] font-bold">
                  {leftSite.noCarPct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Seniors (65+):</span>
                <span>{leftSite.seniorsPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Median income:</span>
                <span>${leftSite.medianIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Dominant driver:
                </span>
                <span className="text-slate-200 font-sans font-semibold">
                  {leftSite.dominantDriver}
                </span>
              </div>
            </div>
          </div>

          {/* Right Site */}
          <div className="bg-[#090e1a]/90 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-50 text-sm">
                {rightSite.id} · {rightSite.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  isRightFunded
                    ? "bg-emerald-950 border border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isRightFunded
                  ? `FUNDED #${rightSite.id}`
                  : `DISPLACED #${rightSite.id}`}
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Heat offset:</span>
                <span className="font-bold text-[#f97316]">
                  +{rightSite.offsetF.toFixed(1)}°F
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  ≥95°F days / summer:
                </span>
                <span>{rightSite.hotDaysPerSummer} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Residents nearby:
                </span>
                <span>{rightSite.residentsReached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Poverty rate:</span>
                <span>{rightSite.povertyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Households without car:
                </span>
                <span>{rightSite.noCarPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Seniors (65+):</span>
                <span>{rightSite.seniorsPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Median income:</span>
                <span>${rightSite.medianIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  Dominant driver:
                </span>
                <span className="text-slate-200 font-sans font-semibold">
                  {rightSite.dominantDriver}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Displaced Callout */}
        <div className="bg-gradient-to-r from-[#241614]/90 to-[#1a141b]/90 backdrop-blur-md border border-[#f97316]/40 rounded-xl p-5 flex items-start gap-3.5 text-xs text-slate-200 relative z-10 shadow-inner">
          <AlertCircle className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-[#fdba74]">
              Ranking Trade-off Summary:
            </span>{" "}
            {leftSite.name} (+{leftSite.offsetF.toFixed(1)}°F) reaches{" "}
            {leftSite.residentsReached.toLocaleString()} nearby residents with{" "}
            {leftSite.noCarPct}% car-free households and {leftSite.povertyRate}%
            poverty, compared to {rightSite.name} (+
            {rightSite.offsetF.toFixed(1)}°F,{" "}
            {rightSite.residentsReached.toLocaleString()} reached,{" "}
            {rightSite.noCarPct}% car-free, {rightSite.povertyRate}% poverty).
            Each selected site must maximize non-overlapping coverage of
            vulnerable residents.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#fb923c] to-[#f97316] hover:from-orange-400 hover:to-orange-500 active:scale-[0.98] text-[#090d16] font-extrabold text-xs shadow-md shadow-orange-950/40 ring-1 ring-inset ring-white/25 transition-all duration-200"
          >
            Understood · Close
          </button>
        </div>
      </div>
    </div>
  );
};
