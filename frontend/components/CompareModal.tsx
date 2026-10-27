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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0d1422] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#f97316] text-[#090d16] flex items-center justify-center text-xs font-extrabold">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
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
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Site Selector Row if allSites provided */}
        {allSites.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Left Comparison Site
              </label>
              <select
                value={leftId}
                onChange={(e) => setLeftId(Number(e.target.value))}
                className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-[#f97316]"
              >
                {allSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    Site {s.id} · {s.name} (+{s.offsetF.toFixed(1)}°F)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Right Comparison Site
              </label>
              <select
                value={rightId}
                onChange={(e) => setRightId(Number(e.target.value))}
                className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-[#f97316]"
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

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Left Site */}
          <div className="bg-[#111a2c] border-2 border-[#f97316]/70 rounded-xl p-5 space-y-4">
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
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-100 text-sm">
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
        <div className="bg-[#221715] border border-[#f97316]/40 rounded-xl p-5 flex items-start gap-3.5 text-xs text-slate-200">
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
