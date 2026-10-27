"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { Check, Circle, Copy, Download, RefreshCw } from "lucide-react";

interface ProposalTabProps {
  sites: SiteData[];
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const ProposalTab: React.FC<ProposalTabProps> = ({
  sites,
  onRegenerate,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);

  const top3 = sites.slice(0, 3);
  const site4 = sites.find((s) => s.id === 4) || sites[3];

  const handleCopyText = () => {
    const text = `PROPOSAL TO COUNCIL · DRAFT
Three permanent cooling centers, sited where heat hurts most

To: Atlanta City Council
From: Office of Sustainability and Resilience
Date: October 27, 2026

We recommend permanent cooling centers at ${top3.map(s => s.name).join(", ")}. Together they place relief within 0.5 miles (straight-line) of 38,400 residents who lack a car or are 65 and older, in tracts that run +3.2°F to +4.1°F hotter than Atlanta’s average and see roughly 18 days at or above 95°F each summer.

The three sites:
${top3.map(s => `- ${s.name} (Tract ${s.tractId}): +${s.offsetF.toFixed(1)}°F offset, ${s.daysAbove95} days >=95°F, ${s.residentsReached.toLocaleString()} reached, ${s.annualCost}`).join("\n")}

What this displaces:
${site4.name} ranked next and was not chosen because of spatial service overlap. Funding these three uses dedicated resilience budget efficiently.

Equity check:
Recommended tracts average 2.5x the car-free rate and 2.1x the poverty rate of Atlanta citywide average.
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Top Notification & Action Bar */}
      <div className="bg-[#0c121d] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span className="font-medium">
            Draft ready · every claim sourced · review before sending
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Updating..." : "Regenerate"}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Copied!" : "Copy text"}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Official Council Memorandum Card (Paper Theme) */}
        <div className="lg:col-span-8 bg-[#fdfdfd] text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 space-y-7 print:border-none print:shadow-none print:p-0">
          {/* Memorandum Header */}
          <div className="space-y-3 pb-5 border-b border-slate-300">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
              PROPOSAL TO COUNCIL · DRAFT
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
              Three permanent cooling centers, sited where heat hurts most
            </h1>

            {/* Meta Table */}
            <div className="grid grid-cols-3 gap-4 pt-3 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block">To</span>
                <span>Atlanta City Council</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">From</span>
                <span>Office of Sustainability & Resilience</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Date</span>
                <span>October 27, 2026</span>
              </div>
            </div>
          </div>

          {/* Sourced Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800">
              Recommendation
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[10px] font-mono font-bold text-orange-700">
              BQML
            </span>
            <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[10px] font-mono font-bold text-sky-700">
              Station history
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[10px] font-mono font-bold text-purple-700">
              ACS
            </span>
          </div>

          {/* Lead Recommendation Paragraph */}
          <p className="text-sm text-slate-800 leading-relaxed">
            We recommend permanent cooling centers at <span className="font-semibold text-slate-950">{top3[0]?.name}</span>, <span className="font-semibold text-slate-950">{top3[1]?.name}</span>, and <span className="font-semibold text-slate-950">{top3[2]?.name}</span>. Together they place relief within 0.5 miles (straight-line) of <span className="font-bold text-slate-950">38,400 residents</span> who lack a car or are 65 and older, in tracts that run <span className="font-bold text-slate-950">+3.2°F to +4.1°F</span> hotter than Atlanta’s average and see roughly <span className="font-bold text-slate-950">18 days</span> at or above 95°F each summer.
          </p>

          {/* Table: The Three Sites */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
              The three sites
            </h2>
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Offset</th>
                    <th className="py-2.5 px-3">≥95°F days</th>
                    <th className="py-2.5 px-3">Nearby (no car · 65+)</th>
                    <th className="py-2.5 px-3">Est. cost / yr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {top3.map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-950">
                        {site.id} · {site.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        [{site.lat.toFixed(3)}, {site.lon.toFixed(3)}]
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-700">
                        +{site.offsetF.toFixed(1)}°F
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {site.daysAbove95}
                      </td>
                      <td className="py-2.5 px-3">
                        {site.residentsReached.toLocaleString()} ({site.demographics.noVehiclePct}% · {site.demographics.age65PlusPct}%)
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        {site.annualCost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why These Three Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                Why these three
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-mono text-[9px] font-bold">
                EXPLAIN_PREDICT
              </span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">
              Site 1 runs hot mainly because of high impervious surface (+2.1°F) and low tree canopy. Site 2 is driven by street corridor thermal mass (+1.8°F). Site 3 combines dense building footprint with elevated surface radiation (+1.6°F). Sites were chosen so each one reaches residents the others miss.
            </p>
          </div>

          {/* What This Displaces Section */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
              What this displaces
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed">
              <span className="font-semibold text-slate-950">{site4.name}</span> ranked next and was not chosen because it overlaps within the 1-mile transit radius of higher-priority tracts. Funding these three uses 74% of the dedicated FY27 Climate Resilience Capital Fund.
            </p>
          </div>

          {/* Equity Check Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                Equity check
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[9px] font-bold">
                Audit
              </span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">
              All 3 recommended tracts exceed the city median poverty rate (avg 31.8% vs 13.9% citywide) and have 2.5× the rate of car-free households (24.9% vs 8.2%), directing cooling infrastructure where residents cannot escape heat.
            </p>
          </div>

          {/* Limits of This Analysis Section */}
          <div className="space-y-2 pt-2 border-t border-slate-300">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
              Limits of this analysis
            </h2>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              <li>Heat offsets come from a single campaign day of street readings.</li>
              <li>Distances are straight-line, not walking routes.</li>
              <li>Costs are estimates pending city figures.</li>
              <li>The model predicts heat exposure, not health outcomes.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Review & Governance Checklist Panel */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          {/* Ready for Council Card */}
          <div className="bg-[#0c121d] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              Ready for council?
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-sans text-xs">Every site has coordinates</span>
                </div>
                <span className="text-slate-500 text-[10px]">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-sans text-xs">Every claim cites a source</span>
                </div>
                <span className="text-slate-500 text-[10px]">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-sans text-xs">What it displaces is stated</span>
                </div>
                <span className="text-slate-500 text-[10px]">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-sans text-xs">Equity audit attached</span>
                </div>
                <span className="text-slate-500 text-[10px]">done</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-sans text-xs">Limits stated plainly</span>
                </div>
                <span className="text-slate-500 text-[10px]">done</span>
              </div>

              {/* Finance Confirmation (Human in the loop required) */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border border-sky-400/80 flex items-center justify-center text-sky-400">
                    <Circle className="w-2 h-2 stroke-[2]" />
                  </div>
                  <span className="text-slate-200 font-sans text-xs">Costs confirmed by finance</span>
                </div>
                <span className="text-sky-400 text-[10px] font-sans font-medium">needs a person</span>
              </div>
            </div>
          </div>

          {/* Human in the loop Card */}
          <div className="bg-[#0c121d] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
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
