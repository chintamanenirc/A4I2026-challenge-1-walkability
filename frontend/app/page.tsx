"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { AskTab } from "../components/AskTab";
import { SitesTab } from "../components/SitesTab";
import { EquityAuditTab } from "../components/EquityAuditTab";
import { ProposalTab } from "../components/ProposalTab";
import { CompareModal } from "../components/CompareModal";
import { SiteData, CityBaseline, TractScatterPoint } from "../components/types";

// Atlanta candidate sites calibrated to the BigQuery semantic layer & BQML EXPLAIN_PREDICT
const INITIAL_SITES: SiteData[] = [
  {
    id: 1,
    name: "Mechanicsville",
    tractId: "13121005800",
    shortTract: "58.00",
    lat: 33.738,
    lng: -84.398,
    offsetF: 4.4,
    hotDaysPerSummer: 44,
    residentsReached: 4890,
    estAnnualCost: "$180,000",
    dominantDriver: "Impervious surface",
    dominantDiagnosis:
      "Mostly pavement. Shade structures and cool pavement around the site target the cause. We can diagnose the cause; we can’t simulate the fix.",
    drivers: [
      {
        feature: "impervious_surface",
        label: "Impervious surface",
        attributionF: 2.3,
      },
      {
        feature: "street_density",
        label: "Street density",
        attributionF: 1.4,
      },
      {
        feature: "land_use_mix",
        label: "Land-use mix",
        attributionF: 1.0,
      },
      {
        feature: "park_proximity",
        label: "Park proximity",
        attributionF: -0.3,
      },
    ],
    noCarPct: 28.4,
    seniorsPct: 16.2,
    povertyRate: 34.8,
    medianIncome: 33900,
    blackPct: 81.4,
    hispanicPct: 5.2,
    whitePct: 9.8,
    mapX: 39,
    mapY: 36,
    isFunded: true,
  },
  {
    id: 2,
    name: "Old Fourth Ward",
    tractId: "13121002900",
    shortTract: "29.00",
    lat: 33.755,
    lng: -84.372,
    offsetF: 3.9,
    hotDaysPerSummer: 42,
    residentsReached: 4120,
    estAnnualCost: "$180,000",
    dominantDriver: "Impervious surface",
    dominantDiagnosis:
      "Dense commercial corridors and dark asphalt parking lots trap afternoon radiant heat. Shade structures and cool-roof retrofits near Boulevard address the dominant driver.",
    drivers: [
      {
        feature: "impervious_surface",
        label: "Impervious surface",
        attributionF: 1.9,
      },
      {
        feature: "street_density",
        label: "Street density",
        attributionF: 1.4,
      },
      {
        feature: "land_use_mix",
        label: "Land-use mix",
        attributionF: 0.9,
      },
      {
        feature: "park_proximity",
        label: "Park proximity",
        attributionF: -0.3,
      },
    ],
    noCarPct: 24.1,
    seniorsPct: 17.8,
    povertyRate: 28.9,
    medianIncome: 41200,
    blackPct: 74.6,
    hispanicPct: 6.1,
    whitePct: 14.5,
    mapX: 62,
    mapY: 57,
    isFunded: true,
  },
  {
    id: 3,
    name: "West End",
    tractId: "13121006802",
    shortTract: "68.02",
    lat: 33.735,
    lng: -84.417,
    offsetF: 3.6,
    hotDaysPerSummer: 41,
    residentsReached: 3250,
    estAnnualCost: "$180,000",
    dominantDriver: "Impervious surface",
    dominantDiagnosis:
      "High impervious surface footprint along the Lee St transit corridor with limited tree canopy buffer adjacent to senior housing blocks.",
    drivers: [
      {
        feature: "impervious_surface",
        label: "Impervious surface",
        attributionF: 1.8,
      },
      {
        feature: "street_density",
        label: "Street density",
        attributionF: 1.1,
      },
      {
        feature: "land_use_mix",
        label: "Land-use mix",
        attributionF: 1.0,
      },
      {
        feature: "park_proximity",
        label: "Park proximity",
        attributionF: -0.3,
      },
    ],
    noCarPct: 22.5,
    seniorsPct: 14.6,
    povertyRate: 31.7,
    medianIncome: 39300,
    blackPct: 82.5,
    hispanicPct: 4.9,
    whitePct: 9.3,
    mapX: 48,
    mapY: 75,
    isFunded: true,
  },
  {
    id: 4,
    name: "Bankhead / Midtown Edge",
    tractId: "13121002400",
    shortTract: "24.00",
    lat: 33.768,
    lng: -84.428,
    offsetF: 3.1,
    hotDaysPerSummer: 39,
    residentsReached: 2480,
    estAnnualCost: "$165,000",
    dominantDriver: "Street density",
    dominantDiagnosis:
      "Ranked 4th. Hot industrial/arterial edge, but its tract has lower car-free household share (12.4%) and partially overlaps earlier picks.",
    drivers: [
      {
        feature: "impervious_surface",
        label: "Impervious surface",
        attributionF: 1.4,
      },
      {
        feature: "street_density",
        label: "Street density",
        attributionF: 1.2,
      },
      {
        feature: "land_use_mix",
        label: "Land-use mix",
        attributionF: 0.8,
      },
      {
        feature: "park_proximity",
        label: "Park proximity",
        attributionF: -0.3,
      },
    ],
    noCarPct: 12.4,
    seniorsPct: 11.2,
    povertyRate: 17.8,
    medianIncome: 58400,
    blackPct: 54.0,
    hispanicPct: 7.2,
    whitePct: 33.1,
    mapX: 88,
    mapY: 42,
    isFunded: false,
  },
  {
    id: 5,
    name: "Lakewood Heights",
    tractId: "13121006500",
    shortTract: "65.00",
    lat: 33.702,
    lng: -84.389,
    offsetF: 2.8,
    hotDaysPerSummer: 38,
    residentsReached: 2190,
    estAnnualCost: "$160,000",
    dominantDriver: "Street density",
    dominantDiagnosis:
      "Southern residential tract with moderate tree canopy cooling and lower senior density than top 3 picks.",
    drivers: [
      {
        feature: "impervious_surface",
        label: "Impervious surface",
        attributionF: 1.2,
      },
      {
        feature: "street_density",
        label: "Street density",
        attributionF: 1.1,
      },
      {
        feature: "land_use_mix",
        label: "Land-use mix",
        attributionF: 0.8,
      },
      {
        feature: "park_proximity",
        label: "Park proximity",
        attributionF: -0.3,
      },
    ],
    noCarPct: 16.8,
    seniorsPct: 12.1,
    povertyRate: 22.4,
    medianIncome: 48900,
    blackPct: 71.2,
    hispanicPct: 8.4,
    whitePct: 16.9,
    mapX: 16,
    mapY: 75,
    isFunded: false,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "ask" | "sites" | "equity" | "proposal"
  >("ask");
  const [sites, setSites] = useState<SiteData[]>(INITIAL_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<number>(1);
  const [centersToFund, setCentersToFund] = useState<number>(3);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState<string | undefined>(
    undefined
  );
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentProposalNote, setAgentProposalNote] = useState<string | null>(
    null
  );
  const [tractsScatter, setTractsScatter] = useState<TractScatterPoint[]>([]);

  const [cityBaseline, setCityBaseline] = useState<CityBaseline>({
    medianIncome: 75714,
    povertyRate: 13.9,
    noCarPct: 8.2,
    seniorsPct: 12.5,
    blackPct: 47.2,
    hispanicPct: 6.0,
    whitePct: 40.4,
    asianPct: 4.8,
  });

  // Load real city baseline and census tract scatter points from BigQuery semantic layer
  useEffect(() => {
    async function loadSemanticData() {
      try {
        const [baselineRes, scatterRes] = await Promise.all([
          fetch("/api/semantic?type=baseline"),
          fetch("/api/semantic?type=tracts_scatter"),
        ]);

        if (baselineRes.ok) {
          const data = await baselineRes.json();
          if (data?.baseline) {
            const b = data.baseline;
            setCityBaseline((prev) => ({
              ...prev,
              povertyRate:
                typeof b.city_poverty_rate === "number"
                  ? +(b.city_poverty_rate * 100).toFixed(1)
                  : prev.povertyRate,
              noCarPct:
                typeof b.city_no_vehicle_rate === "number"
                  ? +(b.city_no_vehicle_rate * 100).toFixed(1)
                  : prev.noCarPct,
              seniorsPct:
                typeof b.city_share_65_plus === "number"
                  ? +(b.city_share_65_plus * 100).toFixed(1)
                  : prev.seniorsPct,
              medianIncome:
                typeof b.city_median_income_usd === "number"
                  ? Math.round(b.city_median_income_usd)
                  : prev.medianIncome,
              blackPct:
                typeof b.city_share_black === "number"
                  ? +(b.city_share_black * 100).toFixed(1)
                  : prev.blackPct,
              hispanicPct:
                typeof b.city_share_hispanic === "number"
                  ? +(b.city_share_hispanic * 100).toFixed(1)
                  : prev.hispanicPct,
              whitePct:
                typeof b.city_share_white === "number"
                  ? +(b.city_share_white * 100).toFixed(1)
                  : prev.whitePct,
            }));
          }
        }

        if (scatterRes.ok) {
          const sData = await scatterRes.json();
          if (Array.isArray(sData?.tracts) && sData.tracts.length > 0) {
            setTractsScatter(sData.tracts);
          }
        }
      } catch (err) {
        console.error("Failed to load semantic API data:", err);
      }
    }
    loadSemanticData();
  }, []);

  const handleSendMessage = async (query: string) => {
    setIsLoadingMessage(true);
    setLastUserQuery(query);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          agentId: "atlanta_heat_agent",
          compare: false,
          sessionId: `session_${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText =
          data?.response ||
          data?.primary?.response ||
          data?.primary?.reply ||
          data?.reply ||
          (typeof data?.structuredData?.summary === "string"
            ? data.structuredData.summary
            : null);
        if (replyText) {
          setAgentReply(replyText);
        }

        const incomingSites =
          data?.primary?.structuredData?.sites || data?.structuredData?.sites;
        if (Array.isArray(incomingSites) && incomingSites.length > 0) {
          setSites((prevSites) => {
            const updated = [...prevSites];
            incomingSites.forEach((site: Record<string, any>, idx: number) => {
              if (idx < updated.length) {
                updated[idx] = {
                  ...updated[idx],
                  offsetF:
                    typeof site.predictedOffsetF === "number"
                      ? site.predictedOffsetF
                      : updated[idx].offsetF,
                  drivers:
                    Array.isArray(site.drivers) && site.drivers.length >= 3
                      ? site.drivers.slice(0, 4).map((d: any) => ({
                          feature: d.feature,
                          label: d.feature
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                          attributionF: d.attributionF,
                        }))
                      : updated[idx].drivers,
                  povertyRate:
                    typeof site.demographics?.povertyRatePct === "number"
                      ? site.demographics.povertyRatePct
                      : updated[idx].povertyRate,
                  noCarPct:
                    typeof site.demographics?.noVehicleRatePct === "number"
                      ? site.demographics.noVehicleRatePct
                      : updated[idx].noCarPct,
                  medianIncome:
                    typeof site.demographics?.medianIncome === "number"
                      ? site.demographics.medianIncome
                      : updated[idx].medianIncome,
                };
              }
            });
            return updated;
          });
        }
      }
    } catch (e) {
      console.error("Agent query error:", e);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleRegenerateProposal = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            "Draft a concise 2-sentence council briefing summary for our top 3 permanent cooling centers in Atlanta.",
          agentId: "atlanta_heat_agent",
          compare: false,
          sessionId: `proposal_${Date.now()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const note =
          data?.response ||
          data?.primary?.response ||
          data?.primary?.reply ||
          data?.reply;
        if (note) {
          setAgentProposalNote(note);
        }
      }
    } catch (err) {
      console.error("Failed to regenerate proposal note:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const site4 = sites.find((s) => s.id === 4) || sites[3] || sites[0];
  const fundedSites = sites.slice(0, centersToFund);
  const totalReached = fundedSites.reduce(
    (sum, s) => sum + s.residentsReached,
    0
  );
  const totalBudgetNum = fundedSites.reduce((sum, s) => {
    const num = parseInt((s.estAnnualCost || "$180,000").replace(/[^0-9]/g, ""), 10);
    return sum + (isNaN(num) ? 180000 : num);
  }, 0);
  const totalBudgetStr = `$${Math.round(totalBudgetNum / 1000)}k`;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-[#f97316]/30 selection:text-orange-200 flex flex-col relative isolate">
      {/* Ambient Radial Gradient Backdrop for Linear/Stripe Depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[960px] h-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.09),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.05),transparent_70%)] blur-3xl" />
      </div>

      {/* Top Navbar + Scenario Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        centersToFund={centersToFund}
        totalReached={totalReached}
        totalBudgetStr={totalBudgetStr}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 sm:p-8 flex flex-col gap-8">
        {activeTab === "ask" && (
          <AskTab
            sites={sites}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
            centersToFund={centersToFund}
            setCentersToFund={setCentersToFund}
            onNavigateTab={setActiveTab}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onSendMessage={handleSendMessage}
            isLoadingMessage={isLoadingMessage}
            lastUserQuery={lastUserQuery}
            agentReply={agentReply}
          />
        )}

        {activeTab === "sites" && (
          <SitesTab
            sites={sites}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
            cityBaseline={cityBaseline}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
          />
        )}

        {activeTab === "equity" && (
          <EquityAuditTab
            sites={sites}
            cityBaseline={cityBaseline}
            tractsScatter={tractsScatter}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "proposal" && (
          <ProposalTab
            sites={sites}
            cityBaseline={cityBaseline}
            centersToFund={centersToFund}
            onRegenerate={handleRegenerateProposal}
            isRegenerating={isRegenerating}
            agentProposalNote={agentProposalNote}
          />
        )}
      </main>

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        siteA={selectedSite}
        siteB={site4}
      />
    </div>
  );
}
