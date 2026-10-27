"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { AskTab } from "../components/AskTab";
import { SitesTab } from "../components/SitesTab";
import { EquityAuditTab } from "../components/EquityAuditTab";
import { ProposalTab } from "../components/ProposalTab";
import { CompareModal } from "../components/CompareModal";
import { SiteData, CityBaseline } from "../components/types";

// Default Atlanta sites matching BigQuery semantic layer & BQML model
const INITIAL_SITES: SiteData[] = [
  {
    id: 1,
    name: "Thomasville",
    tractId: "13121006802",
    lat: 33.7043,
    lon: -84.3610,
    offsetF: 4.1,
    daysAbove95: 18,
    residentsReached: 14200,
    annualCost: "$185,000",
    dominantDriver: "Impervious surface",
    dominantDiagnosis: "Mostly pavement. Shade structures and cool pavement around the site target the cause. We can diagnose the cause; we can’t simulate the fix.",
    drivers: [
      { feature: "impervious_surface", attributionF: 2.1 },
      { feature: "street_density", attributionF: 1.4 },
      { feature: "land_use_mix", attributionF: 0.9 },
      { feature: "park_proximity", attributionF: -0.3 },
    ],
    demographics: {
      noVehiclePct: 24.6,
      age65PlusPct: 17.8,
      povertyRatePct: 32.1,
      medianIncome: 38400,
      totalPop: 3410,
    },
    funded: true,
  },
  {
    id: 2,
    name: "Peoplestown",
    tractId: "13121006200",
    lat: 33.7285,
    lon: -84.3850,
    offsetF: 3.7,
    daysAbove95: 18,
    residentsReached: 12800,
    annualCost: "$175,000",
    dominantDriver: "Street density",
    dominantDiagnosis: "Commercial corridor with high street thermal mass and low reflectivity. Transit-connected hub recommended for shaded waiting structures.",
    drivers: [
      { feature: "street_density", attributionF: 1.8 },
      { feature: "impervious_surface", attributionF: 1.5 },
      { feature: "land_use_mix", attributionF: 0.7 },
      { feature: "park_proximity", attributionF: -0.3 },
    ],
    demographics: {
      noVehiclePct: 21.4,
      age65PlusPct: 16.2,
      povertyRatePct: 28.4,
      medianIncome: 42100,
      totalPop: 2025,
    },
    funded: true,
  },
  {
    id: 3,
    name: "Mechanicsville",
    tractId: "13121005800",
    lat: 33.7380,
    lon: -84.4020,
    offsetF: 3.2,
    daysAbove95: 17,
    residentsReached: 11400,
    annualCost: "$160,000",
    dominantDriver: "Land-use mix",
    dominantDiagnosis: "High industrial footprint and lack of vegetative buffer adjacent to residential blocks. High transit dependence among senior residents.",
    drivers: [
      { feature: "land_use_mix", attributionF: 1.6 },
      { feature: "impervious_surface", attributionF: 1.3 },
      { feature: "street_density", attributionF: 0.8 },
      { feature: "park_proximity", attributionF: -0.5 },
    ],
    demographics: {
      noVehiclePct: 28.9,
      age65PlusPct: 14.5,
      povertyRatePct: 34.8,
      medianIncome: 33900,
      totalPop: 2890,
    },
    funded: true,
  },
  {
    id: 4,
    name: "Bankhead",
    tractId: "13121002400",
    lat: 33.7540,
    lon: -84.4320,
    offsetF: 3.0,
    daysAbove95: 16,
    residentsReached: 9600,
    annualCost: "$155,000",
    dominantDriver: "Impervious surface",
    dominantDiagnosis: "Overlaps within the 1-mile transit radius of higher-priority Westside tracts with greater overall demographic vulnerability.",
    drivers: [
      { feature: "impervious_surface", attributionF: 1.4 },
      { feature: "street_density", attributionF: 1.1 },
      { feature: "land_use_mix", attributionF: 0.8 },
      { feature: "park_proximity", attributionF: -0.3 },
    ],
    demographics: {
      noVehiclePct: 16.2,
      age65PlusPct: 11.8,
      povertyRatePct: 19.2,
      medianIncome: 54200,
      totalPop: 2450,
    },
    whyNotChosen: "Bankhead ranked 4th. Each pick must reach people the earlier picks missed. Overlaps within the service buffer of higher-need priority tracts.",
    funded: false,
  },
  {
    id: 5,
    name: "Lakewood Heights",
    tractId: "13121006500",
    lat: 33.6980,
    lon: -84.3910,
    offsetF: 2.8,
    daysAbove95: 16,
    residentsReached: 8200,
    annualCost: "$150,000",
    dominantDriver: "Street density",
    dominantDiagnosis: "Southern fringe residential area with moderate tree canopy coverage.",
    drivers: [
      { feature: "street_density", attributionF: 1.2 },
      { feature: "impervious_surface", attributionF: 1.0 },
      { feature: "land_use_mix", attributionF: 0.9 },
      { feature: "park_proximity", attributionF: -0.3 },
    ],
    demographics: {
      noVehiclePct: 17.5,
      age65PlusPct: 12.1,
      povertyRatePct: 22.4,
      medianIncome: 49000,
      totalPop: 2100,
    },
    funded: false,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ask" | "sites" | "equity" | "proposal">("ask");
  const [sites, setSites] = useState<SiteData[]>(INITIAL_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<number>(1);
  const [centersToFund, setCentersToFund] = useState<number>(3);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [cityBaseline, setCityBaseline] = useState<CityBaseline>({
    totalPop: 1447970,
    povertyRatePct: 13.9,
    noVehiclePct: 8.2,
    age65PlusPct: 12.5,
    medianIncome: 75714,
  });

  // Fetch real city baseline from BigQuery semantic layer on mount
  useEffect(() => {
    async function loadBaseline() {
      try {
        const res = await fetch("/api/semantic?type=baseline");
        if (res.ok) {
          const data = await res.json();
          if (data?.baseline) {
            setCityBaseline({
              totalPop: data.baseline.total_population || 1447970,
              povertyRatePct: +(data.baseline.city_poverty_rate * 100).toFixed(1) || 13.9,
              noVehiclePct: +(data.baseline.city_no_vehicle_rate * 100).toFixed(1) || 8.2,
              age65PlusPct: +(data.baseline.city_share_65_plus * 100).toFixed(1) || 12.5,
              medianIncome: Math.round(data.baseline.city_median_income_usd) || 75714,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load city baseline from semantic API:", err);
      }
    }
    loadBaseline();
  }, []);

  // Handle agent queries
  const handleSendMessage = async (query: string) => {
    setIsLoadingMessage(true);
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
        if (data.structuredData?.sites && data.structuredData.sites.length > 0) {
          // Merge incoming structured sites with existing sites
          const updatedSites = [...sites];
          data.structuredData.sites.forEach((site: any, idx: number) => {
            if (idx < updatedSites.length) {
              updatedSites[idx] = {
                ...updatedSites[idx],
                offsetF: site.predictedOffsetF || updatedSites[idx].offsetF,
                drivers: site.drivers || updatedSites[idx].drivers,
                demographics: {
                  ...updatedSites[idx].demographics,
                  povertyRatePct: site.demographics?.povertyRatePct ?? updatedSites[idx].demographics.povertyRatePct,
                  noVehiclePct: site.demographics?.noVehicleRatePct ?? updatedSites[idx].demographics.noVehiclePct,
                  medianIncome: site.demographics?.medianIncome ?? updatedSites[idx].demographics.medianIncome,
                },
              };
            }
          });
          setSites(updatedSites);
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
    await handleSendMessage("Regenerate proposal draft for top sites in Atlanta");
    setIsRegenerating(false);
  };

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const site4 = sites.find((s) => s.id === 4) || sites[3];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col">
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
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "proposal" && (
          <ProposalTab
            sites={sites}
            onRegenerate={handleRegenerateProposal}
            isRegenerating={isRegenerating}
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
