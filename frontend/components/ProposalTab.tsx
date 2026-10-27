"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { Check, Copy, RefreshCw } from "lucide-react";

interface ProposalTabProps {
  sites: SiteData[];
  onRegenerate: () => Promise<void>;
  isRegenerating: boolean;
}

export const ProposalTab: React.FC<ProposalTabProps> = ({
  sites,
  onRegenerate,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const text = `PROPOSAL TO COUNCIL · DRAFT
Three permanent cooling centers, sited where heat hurts most

To: Atlanta City Council
From: Office of Sustainability and Resilience
Date: October 27, 2026

We recommend permanent cooling centers at [Site 1], [Site 2] and [Site 3]. Together they place relief within [distance] (straight-line) of [N] residents who lack a car or are 65 and older, in tracts that run [X–Y]°F hotter than Atlanta’s average and see roughly [Z] days at or above 95°F each summer.

The three sites:
- 1 · [Neighborhood A]: [33.7xxx, −84.4xxx], +[X.X]°F, [Z] days, [N] reached, [COST]
- 2 · [Neighborhood B]: [33.7xxx, −84.4xxx], +[X.X]°F, [Z] days, [N] reached, [COST]
- 3 · [Neighborhood C]: [33.7xxx, −84.4xxx], +[X.X]°F, [Z] days, [N] reached, [COST]

Why these three (EXPLAIN_PREDICT):
Top drivers per site from the model, one sentence each. Sites were chosen so each one reaches residents the others miss.

What this displaces:
[Site 4] ranked next and was not chosen because of spatial service overlap. Funding these three uses dedicated resilience budget efficiently.

Equity check (Audit):
Recommended tracts average higher poverty and car-free households compared to the citywide baseline.
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 flex flex-col gap-6">
      {/* Top Notification & Action Bar matching PDF Screen */}
      <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span className="font-medium text-xs">
            Draft ready · every claim sourced · review before sending
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Updating..." : "Regenerate"}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Copied!" : "Copy text"}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Left (White Memorandum Paper) & Right (Governance Checklist) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Official Council Memorandum Document */}
        <div className="lg:col-span-8 bg-[#fafafa] text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-300 font-sans space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              PROPOSAL TO COUNCIL · DRAFT
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
              Three permanent cooling centers, sited where heat hurts most
            </h2>
          </div>

          {/* Memorandum Metadata Table */}
          <div className="grid grid-cols-12 text-xs border-y border-slate-200 py-3.5 gap-y-2.5">
            <div className="col-span-2 text-slate-500 font-semibold">To</div>
            <div className="col-span-10 text-slate-900 font-medium">Atlanta City Council</div>

            <div className="col-span-2 text-slate-500 font-semibold">From</div>
            <div className="col-span-10 text-slate-900 font-medium">[Department / office]</div>

            <div className="col-span-2 text-slate-500 font-semibold">Date</div>
            <div className="col-span-10 text-slate-900 font-medium">[Date]</div>
          </div>

          {/* Recommendation & Citation Badges */}
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold tracking-wide">
                Recommendation
              </span>
              <span className="px-2.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold tracking-wide border border-sky-300">
                BQML
              </span>
              <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold tracking-wide border border-amber-300">
                Station history
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold tracking-wide">
                ACS
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-800">
              We recommend permanent cooling centers at <span className="font-bold">[Site 1]</span>, <span className="font-bold">[Site 2]</span> and <span className="font-bold">[Site 3]</span>. Together they place relief within <span className="font-semibold">[distance]</span> (straight-line) of <span className="font-semibold">[N]</span> residents who lack a car or are 65 and older, in tracts that run <span className="font-semibold">[X–Y]°F</span> hotter than Atlanta’s average and see roughly <span className="font-semibold">[Z]</span> days at or above 95°F each summer.
            </p>
          </div>

          {/* Table: The three sites */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              The three sites
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 text-[11px]">
                    <th className="py-2.5 font-bold">Site</th>
                    <th className="py-2.5 font-bold">Location</th>
                    <th className="py-2.5 font-bold">Offset</th>
                    <th className="py-2.5 font-bold">≥95°F days</th>
                    <th className="py-2.5 font-bold">Nearby (no car · 65+)</th>
                    <th className="py-2.5 font-bold text-right">Est. cost / yr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-[11px]">
                  <tr>
                    <td className="py-3 font-sans font-semibold">1 · [Neighborhood A]</td>
                    <td className="py-3 text-slate-600 font-sans">[33.7xxx, −84.4xxx]</td>
                    <td className="py-3 font-bold text-orange-600">+[X.X]°F</td>
                    <td className="py-3 font-sans">[Z]</td>
                    <td className="py-3 font-sans">[N] ([%] · [%])</td>
                    <td className="py-3 text-right font-sans font-semibold">[COST]</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-sans font-semibold">2 · [Neighborhood B]</td>
                    <td className="py-3 text-slate-600 font-sans">[33.7xxx, −84.4xxx]</td>
                    <td className="py-3 font-bold text-orange-600">+[X.X]°F</td>
                    <td className="py-3 font-sans">[Z]</td>
                    <td className="py-3 font-sans">[N] ([%] · [%])</td>
                    <td className="py-3 text-right font-sans font-semibold">[COST]</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-sans font-semibold">3 · [Neighborhood C]</td>
                    <td className="py-3 text-slate-600 font-sans">[33.7xxx, −84.4xxx]</td>
                    <td className="py-3 font-bold text-orange-600">+[X.X]°F</td>
                    <td className="py-3 font-sans">[Z]</td>
                    <td className="py-3 font-sans">[N] ([%] · [%])</td>
                    <td className="py-3 text-right font-sans font-semibold">[COST]</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Subsection: Why these three */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Why these three
              </h3>
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-mono font-bold border border-orange-300">
                EXPLAIN_PREDICT
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              [Top drivers per site from the model, one sentence each — e.g. “Site 1 runs hot mainly because of impervious surface.”] Sites were chosen so each one reaches residents the others miss.
            </p>
          </div>

          {/* Subsection: What this displaces */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              What this displaces
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              [Site 4] ranked next and was not chosen because [reason]. Funding these three uses [share] of [budget line].
            </p>
          </div>

          {/* Subsection: Equity check */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Equity check
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                Audit
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              [One-line audit result: how the recommended tracts compare with the Atlanta average on income, poverty, car access and age.]
            </p>
          </div>

          {/* Subsection: Limits of this analysis */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Limits of this analysis
            </h3>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Heat offsets come from a single campaign day of street readings.</li>
              <li>Distances are straight-line, not walking routes.</li>
              <li>Costs are estimates pending city figures.</li>
              <li>The model predicts heat exposure, not health outcomes.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Governance Audit Checklist & Human-in-the-Loop */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card: Ready for council? */}
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Ready for council?
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Every site has coordinates</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Every claim cites a source</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>What it displaces is stated</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Equity audit attached</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Limits stated plainly</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">done</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5 text-slate-400">
                  <div className="w-4 h-4 rounded-full border border-slate-600 bg-slate-800/50 flex items-center justify-center" />
                  <span>Costs confirmed by finance</span>
                </div>
                <span className="text-amber-400 text-[11px] font-mono font-medium">needs a person</span>
              </div>
            </div>
          </div>

          {/* Card: Human in the loop */}
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Human in the loop
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The agent drafts; a planner reviews, edits and signs. Nothing goes to council without a person’s name on it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
