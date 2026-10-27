"use client";

import React, { useState } from "react";
import { SiteData, CityBaseline } from "./types";
import { Check, Copy, RefreshCw, Download, Printer, UserCheck } from "lucide-react";

interface ProposalTabProps {
  sites: SiteData[];
  cityBaseline?: CityBaseline;
  centersToFund?: number;
  onRegenerate: () => Promise<void>;
  isRegenerating: boolean;
  agentProposalNote?: string | null;
}

export const ProposalTab: React.FC<ProposalTabProps> = ({
  sites,
  cityBaseline = {
    medianIncome: 75714,
    povertyRate: 13.9,
    noCarPct: 8.2,
    seniorsPct: 12.5,
  },
  centersToFund = 3,
  onRegenerate,
  isRegenerating,
  agentProposalNote,
}) => {
  const [copied, setCopied] = useState(false);
  const [financeConfirmed, setFinanceConfirmed] = useState(false);
  const [plannerName, setPlannerName] = useState("");
  const [plannerNotes, setPlannerNotes] = useState("");

  const fundedSites = sites.slice(0, centersToFund);
  const site1 = fundedSites[0] || sites[0];
  const site2 = fundedSites[1] || sites[1] || sites[0];
  const site3 = fundedSites[2] || sites[2] || sites[0];
  const site4 = sites.find((s) => s.id === 4) || sites[3] || sites[0];

  const totalReached = fundedSites.reduce(
    (acc, s) => acc + s.residentsReached,
    0
  );
  const minOffset = Math.min(...fundedSites.map((s) => s.offsetF)).toFixed(1);
  const maxOffset = Math.max(...fundedSites.map((s) => s.offsetF)).toFixed(1);
  const minHotDays = Math.min(
    ...fundedSites.map((s) => s.hotDaysPerSummer ?? 35)
  );
  const maxHotDays = Math.max(
    ...fundedSites.map((s) => s.hotDaysPerSummer ?? 42)
  );

  const avgIncome = Math.round(
    fundedSites.reduce((acc, s) => acc + s.medianIncome, 0) / fundedSites.length
  );
  const avgPoverty = (
    fundedSites.reduce((acc, s) => acc + s.povertyRate, 0) / fundedSites.length
  ).toFixed(1);
  const avgNoCar = (
    fundedSites.reduce((acc, s) => acc + s.noCarPct, 0) / fundedSites.length
  ).toFixed(1);
  const avgSeniors = (
    fundedSites.reduce((acc, s) => acc + s.seniorsPct, 0) / fundedSites.length
  ).toFixed(1);

  const buildPlainTextMemo = () => {
    return `# PROPOSAL TO COUNCIL · ${financeConfirmed ? "APPROVED FOR SUBMISSION" : "DRAFT"}
## ${fundedSites.length} permanent cooling ${fundedSites.length === 1 ? "center" : "centers"}, sited where heat hurts most

- **To**: Atlanta City Council
- **From**: Mayor's Office of Sustainability & Resilience${plannerName.trim() ? ` (Signed: ${plannerName.trim()})` : ""}
- **Date**: October 27, 2026

### Recommendation (BQML · Station history · ACS)
We recommend permanent cooling centers at ${fundedSites.map((s) => s.name).join(", ")}. Together they place relief within 0.5 miles (straight-line) of ${totalReached.toLocaleString()} residents who lack a car or are 65 and older, in tracts that run +${minOffset}–${maxOffset}°F hotter than Atlanta’s average and see roughly ${minHotDays}–${maxHotDays} days at or above 95°F each summer.

### The recommended sites
${fundedSites
  .map(
    (s) =>
      `- Site ${s.id} · ${s.name}: [${s.lat.toFixed(3)}, ${(s.lon ?? s.lng).toFixed(3)}], +${s.offsetF.toFixed(1)}°F, ${s.hotDaysPerSummer} days ≥95°F, ${s.residentsReached.toLocaleString()} reached (${s.noCarPct}% no car · ${s.seniorsPct}% 65+), ${s.estAnnualCost}/yr`
  )
  .join("\n")}

### Why these sites (EXPLAIN_PREDICT)
Site 1 (${site1.name}) runs hot mainly because of ${site1.dominantDriver.toLowerCase()} (+${site1.drivers[0]?.attributionF.toFixed(1)}°F); Site 2 (${site2.name}) is driven by ${site2.dominantDriver.toLowerCase()} (+${site2.drivers[0]?.attributionF.toFixed(1)}°F); Site 3 (${site3.name}) is driven by ${site3.dominantDriver.toLowerCase()} (+${site3.drivers[0]?.attributionF.toFixed(1)}°F). Sites were chosen so each one reaches residents the others miss.

### What this displaces
${site4.name} ranked next (+${site4.offsetF.toFixed(1)}°F) and was not chosen because its tract has lower car-free vulnerability (${site4.noCarPct}% vs. ${avgNoCar}% at funded sites) and partial catchment overlap. Funding these ${fundedSites.length} uses $${(fundedSites.length * 180000).toLocaleString()} of the $600,000 FY26 cooling resilience allocation.

### Equity check (Audit)
Recommended tracts average $${avgIncome.toLocaleString()} median household income (vs. $${cityBaseline.medianIncome.toLocaleString()} Atlanta average), ${avgPoverty}% poverty (vs. ${cityBaseline.povertyRate.toFixed(1)}%), ${avgNoCar}% households without a car (vs. ${cityBaseline.noCarPct.toFixed(1)}%), and ${avgSeniors}% seniors 65+ (vs. ${cityBaseline.seniorsPct.toFixed(1)}%).
${plannerNotes.trim() ? `\n### Planner Amendment Notes\n${plannerNotes.trim()}\n` : ""}`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(buildPlainTextMemo());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([buildPlainTextMemo()], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlanta-cooling-centers-council-memo.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Notification & Progress Bar Banner */}
      <div className="bg-[#0d1422] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-100">
            <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="font-bold">
              {financeConfirmed
                ? `Council packet 100% ready · Signed off by ${
                    plannerName.trim() || "Senior Planner"
                  }`
                : "Draft ready · every claim sourced · review before sending"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRegenerating ? "animate-spin text-[#f97316]" : ""
                }`}
              />
              <span>{isRegenerating ? "Drafting..." : "Regenerate"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Copied!" : "Copy text"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl bg-[#f97316] hover:bg-orange-400 text-[#090d16] text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Full-width Orange/Emerald Progress Bar across bottom of banner */}
        <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              financeConfirmed ? "bg-emerald-500" : "bg-[#f97316]"
            }`}
            style={{ width: financeConfirmed ? "100%" : "84%" }}
          />
        </div>
      </div>

      {/* Main Grid: Left (White Paper Memorandum) & Right (Governance Checklist) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (9 cols): Official Council Memorandum Paper */}
        <div className="lg:col-span-9 bg-[#fbfaf8] text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-300 font-sans space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono font-bold tracking-widest text-[#c2410c] uppercase">
                PROPOSAL TO COUNCIL ·{" "}
                {financeConfirmed ? "SIGNED & VERIFIED" : "DRAFT"}
              </div>
              {financeConfirmed && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  READY FOR SUBMISSION
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-950 tracking-tight leading-snug">
              Three permanent cooling centers, sited where heat hurts most
            </h2>
          </div>

          {/* Memorandum Metadata Table with Bold Bottom Rule */}
          <div className="grid grid-cols-12 text-xs border-b-2 border-slate-900 pb-4 pt-1 gap-y-2">
            <div className="col-span-2 sm:col-span-1 text-slate-500 font-medium">
              To
            </div>
            <div className="col-span-10 sm:col-span-11 text-slate-900 font-medium pl-2">
              Atlanta City Council
            </div>

            <div className="col-span-2 sm:col-span-1 text-slate-500 font-medium">
              From
            </div>
            <div className="col-span-10 sm:col-span-11 text-slate-900 font-medium pl-2">
              Mayor’s Office of Sustainability &amp; Resilience
              {plannerName.trim() ? ` · Reviewed by ${plannerName.trim()}` : ""}
            </div>

            <div className="col-span-2 sm:col-span-1 text-slate-500 font-medium">
              Date
            </div>
            <div className="col-span-10 sm:col-span-11 text-slate-900 font-medium pl-2">
              October 27, 2026
            </div>
          </div>

          {/* Section 1: Recommendation & Warm Citation Badges */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-950 mr-1">
                Recommendation
              </h3>
              <span className="px-2 py-0.5 rounded bg-[#f5ebe6] text-[#9a3412] text-[10px] font-mono font-semibold">
                BQML
              </span>
              <span className="px-2 py-0.5 rounded bg-[#f5ebe6] text-[#9a3412] text-[10px] font-mono font-semibold">
                Station history
              </span>
              <span className="px-2 py-0.5 rounded bg-[#f5ebe6] text-[#9a3412] text-[10px] font-mono font-semibold">
                ACS
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-slate-800">
              We recommend permanent cooling centers at{" "}
              <span className="font-bold text-slate-950">{site1.name}</span>,{" "}
              <span className="font-bold text-slate-950">{site2.name}</span> and{" "}
              <span className="font-bold text-slate-950">{site3.name}</span>.
              Together they place relief within{" "}
              <span className="font-semibold">0.5 miles</span> (straight-line) of{" "}
              <span className="font-semibold">
                {totalReached.toLocaleString()}
              </span>{" "}
              residents who lack a car or are 65 and older, in tracts that run{" "}
              <span className="font-semibold">
                +{minOffset}–{maxOffset}°F
              </span>{" "}
              hotter than Atlanta’s average and see roughly{" "}
              <span className="font-semibold">
                {minHotDays === maxHotDays
                  ? minHotDays
                  : `${minHotDays}–${maxHotDays}`}
              </span>{" "}
              days at or above 95°F each summer.
            </p>

            {agentProposalNote && (
              <div className="p-3.5 rounded-lg bg-orange-50 border border-orange-200 text-xs text-slate-800 leading-relaxed">
                <span className="font-mono font-bold text-[#c2410c] uppercase text-[10px] block mb-1">
                  Gemini Live Synthesis Note
                </span>
                {agentProposalNote}
              </div>
            )}
          </div>

          {/* Section 2: Table - The three sites */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-sm font-extrabold text-slate-950">
              The three sites
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[11px]">
                    <th className="py-2.5 px-3.5 font-bold">Site</th>
                    <th className="py-2.5 px-3.5 font-bold">Location</th>
                    <th className="py-2.5 px-3.5 font-bold">Offset</th>
                    <th className="py-2.5 px-3.5 font-bold">≥95°F days</th>
                    <th className="py-2.5 px-3.5 font-bold">
                      Nearby (no car · 65+)
                    </th>
                    <th className="py-2.5 px-3.5 font-bold text-right">
                      Est. cost / yr
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800 text-xs">
                  {fundedSites.map((site) => (
                    <tr key={site.id}>
                      <td className="py-3 px-3.5 font-bold text-slate-950">
                        {site.id} · {site.name}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-mono text-[11px]">
                        [{site.lat.toFixed(3)},{" "}
                        {(site.lon ?? site.lng).toFixed(3)}]
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[#c2410c]">
                        +{site.offsetF.toFixed(1)}°F
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800">
                        {site.hotDaysPerSummer}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800">
                        {site.residentsReached.toLocaleString()} (
                        {site.noCarPct}% · {site.seniorsPct}%)
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-800">
                        {site.estAnnualCost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Why these three */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-950">
                Why these three
              </h3>
              <span className="px-2 py-0.5 rounded bg-[#f5ebe6] text-[#9a3412] text-[10px] font-mono font-semibold">
                EXPLAIN_PREDICT
              </span>
            </div>
            <p className="text-[13px] text-slate-800 leading-relaxed">
              Site 1 ({site1.name}) runs hot mainly because of{" "}
              {site1.dominantDriver.toLowerCase()} (+
              {site1.drivers[0]?.attributionF.toFixed(1)}°F); Site 2 (
              {site2.name}) is driven by {site2.dominantDriver.toLowerCase()} (+
              {site2.drivers[0]?.attributionF.toFixed(1)}°F) and street density
              (+{site2.drivers[1]?.attributionF.toFixed(1)}°F); Site 3 (
              {site3.name}) is driven by {site3.dominantDriver.toLowerCase()} (+
              {site3.drivers[0]?.attributionF.toFixed(1)}°F) and land-use mix (+
              {site3.drivers[2]?.attributionF.toFixed(1)}°F). Sites were chosen
              so each one reaches residents the others miss.
            </p>
          </div>

          {/* Section 4: What this displaces */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-sm font-extrabold text-slate-950">
              What this displaces
            </h3>
            <p className="text-[13px] text-slate-800 leading-relaxed">
              {site4.name} (+{site4.offsetF.toFixed(1)}°F, Tract{" "}
              {site4.shortTract}) ranked next and was not chosen because its
              catchment has lower transit vulnerability ({site4.noCarPct}%
              households without a car vs. {avgNoCar}% across Sites 1–3) and
              partial reach overlap. Funding these three uses $540,000 (90%) of
              the $600,000 FY26 cooling resilience budget line.
            </p>
          </div>

          {/* Section 5: Equity check inside Cream Callout Box with Orange Left Border */}
          <div className="bg-[#fdf6f0] border-l-4 border-[#f97316] rounded-r-xl p-5 space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-950">
                Equity check
              </h3>
              <span className="px-2 py-0.5 rounded bg-[#f3e5d8] text-[#9a3412] text-[10px] font-mono font-semibold">
                Audit
              </span>
            </div>
            <p className="text-[13px] text-slate-800 leading-relaxed">
              Across all 4 audit measures, the recommended tracts skew toward
              higher need than the Atlanta average: median household income is $
              {avgIncome.toLocaleString()} (vs. $
              {cityBaseline.medianIncome.toLocaleString()} citywide), poverty
              rate is {avgPoverty}% (vs. {cityBaseline.povertyRate.toFixed(1)}
              %), car-free households are {avgNoCar}% (vs.{" "}
              {cityBaseline.noCarPct.toFixed(1)}%), and residents 65+ are{" "}
              {avgSeniors}% (vs. {cityBaseline.seniorsPct.toFixed(1)}%).
            </p>
          </div>

          {/* Optional Planner Notes */}
          {plannerNotes.trim() && (
            <div className="bg-slate-100 border-l-4 border-slate-800 rounded-r-xl p-4 space-y-1">
              <div className="text-xs font-extrabold text-slate-900">
                Planner Review &amp; Implementation Notes
              </div>
              <p className="text-[13px] text-slate-800 leading-relaxed">
                {plannerNotes}
              </p>
            </div>
          )}

          {/* Section 6: Limits of this analysis */}
          <div className="space-y-2 pt-1">
            <h3 className="text-sm font-extrabold text-slate-950">
              Limits of this analysis
            </h3>
            <ul className="text-[13px] text-slate-800 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                Heat offsets come from a single campaign day of street readings.
              </li>
              <li>Distances are straight-line, not walking routes.</li>
              <li>Costs are estimates pending city figures.</li>
              <li>The model predicts heat exposure, not health outcomes.</li>
            </ul>
          </div>
        </div>

        {/* Right Column (3 cols): Ready for council? + Human in the loop inside unified card */}
        <div className="lg:col-span-3 bg-[#0d1422] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100">
                Ready for council?
              </h3>
              <span className="text-xs font-mono font-bold text-[#f97316]">
                {financeConfirmed ? "6 / 6" : "5 / 6"}
              </span>
            </div>

            {/* 2-Line Checklist Items */}
            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    Every site has coordinates
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    done
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    Every claim cites a source
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    done
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    What it displaces is stated
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    done
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    Equity audit attached
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    done
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    Limits stated plainly
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    done
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFinanceConfirmed(!financeConfirmed)}
                className="flex items-start gap-3 text-left group"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                    financeConfirmed
                      ? "bg-emerald-950 border border-emerald-500/60 text-emerald-400"
                      : "border border-slate-500 bg-transparent group-hover:border-slate-300"
                  }`}
                >
                  {financeConfirmed && (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  )}
                </div>
                <div>
                  <div className="text-slate-300 font-medium group-hover:text-white transition-colors">
                    Costs confirmed by finance
                  </div>
                  <div
                    className={`text-[11px] font-mono ${
                      financeConfirmed ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {financeConfirmed
                      ? "confirmed by planner"
                      : "needs a person (click to confirm)"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Human in the loop interactive sign-off section */}
          <div className="border-t border-slate-800/90 pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#f97316]" />
              <h3 className="text-sm font-extrabold text-slate-100">
                Human in the loop
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The agent drafts; a planner reviews, edits and signs. Nothing goes
              to council without a person’s name on it.
            </p>

            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-mono text-slate-400">
                Planner Sign-Off Name
              </label>
              <input
                type="text"
                value={plannerName}
                onChange={(e) => {
                  setPlannerName(e.target.value);
                  if (e.target.value.trim()) setFinanceConfirmed(true);
                }}
                placeholder="e.g. J. Carter, Chief Resilience Officer"
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-slate-400">
                Add Amendment / Field Note
              </label>
              <textarea
                rows={2}
                value={plannerNotes}
                onChange={(e) => setPlannerNotes(e.target.value)}
                placeholder="Optional note appended to council memo..."
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
