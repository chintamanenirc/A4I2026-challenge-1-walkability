"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { AskTab } from "../components/AskTab";
import { SitesTab } from "../components/SitesTab";
import { EquityAuditTab } from "../components/EquityAuditTab";
import { ProposalTab } from "../components/ProposalTab";
import { CompareModal } from "../components/CompareModal";
import { SiteData, CityBaseline, TractScatterPoint } from "../components/types";

// Atlanta candidate sites calibrated to PR #2 BigQuery semantic layer (a4i_semantic.*) & BQML (a4i_ml.grid_predictions)
const INITIAL_SITES: SiteData[] = [
  {
    id: 1,
    name: "Mechanicsville / Pittsburgh",
    tractId: "13121004400",
    shortTract: "44.00",
    lat: 33.7408,
    lng: -84.4018,
    offsetF: 4.3,
    hotDaysPerSummer: 67,
    residentsReached: 10866,
    estAnnualCost: "$180,000",
    dominantDriver: "Homes within 1.5 km",
    dominantDiagnosis:
      "Dense surrounding housing and impervious rail/commercial corridors trap afternoon radiant heat. Shade structures and cool-pavement retrofits target the primary driver. We can diagnose the cause; we can’t simulate the fix.",
    drivers: [
      {
        feature: "housing_within_1500m",
        label: "Homes within 1.5 km",
        attributionF: 1.42,
      },
      {
        feature: "median_year_built",
        label: "Building age",
        attributionF: 0.18,
      },
      {
        feature: "housing_density_km2",
        label: "Block housing density",
        attributionF: 0.13,
      },
      {
        feature: "pop_density_km2",
        label: "Population density",
        attributionF: -0.39,
      },
    ],
    noCarPct: 47.2,
    seniorsPct: 9.0,
    povertyRate: 33.4,
    medianIncome: 24297,
    blackPct: 81.4,
    hispanicPct: 5.2,
    whitePct: 9.8,
    mapX: 39,
    mapY: 36,
    isFunded: true,
  },
  {
    id: 2,
    name: "West End / Ashview Heights",
    tractId: "13121004200",
    shortTract: "42.00",
    lat: 33.739,
    lng: -84.4182,
    offsetF: 4.3,
    hotDaysPerSummer: 67,
    residentsReached: 8949,
    estAnnualCost: "$180,000",
    dominantDriver: "Homes within 1.5 km",
    dominantDiagnosis:
      "High surrounding housing density and older building stock along the West End transit corridor with 46.7% car-free households and 18.4% seniors 65+.",
    drivers: [
      {
        feature: "housing_within_1500m",
        label: "Homes within 1.5 km",
        attributionF: 1.45,
      },
      {
        feature: "water_share",
        label: "Nearby water / canopy",
        attributionF: 0.11,
      },
      {
        feature: "median_year_built",
        label: "Building age",
        attributionF: 0.11,
      },
      {
        feature: "pop_within_1500m",
        label: "Surrounding population",
        attributionF: -0.1,
      },
    ],
    noCarPct: 46.7,
    seniorsPct: 18.4,
    povertyRate: 36.3,
    medianIncome: 23906,
    blackPct: 82.5,
    hispanicPct: 4.9,
    whitePct: 9.3,
    mapX: 62,
    mapY: 57,
    isFunded: true,
  },
  {
    id: 3,
    name: "Oakland City / Campbellton",
    tractId: "13121007603",
    shortTract: "76.03",
    lat: 33.7065,
    lng: -84.4404,
    offsetF: 3.3,
    hotDaysPerSummer: 56,
    residentsReached: 3943,
    estAnnualCost: "$180,000",
    dominantDriver: "Homes within 1.5 km",
    dominantDiagnosis:
      "Severe transit-dependent vulnerability (56.4% no-vehicle households, 18.8% seniors 65+, 48.6% poverty) paired with +3.3°F peak cell heat offset along Campbellton Rd.",
    drivers: [
      {
        feature: "housing_within_1500m",
        label: "Homes within 1.5 km",
        attributionF: 1.12,
      },
      {
        feature: "water_share",
        label: "Nearby water / canopy",
        attributionF: 0.11,
      },
      {
        feature: "pop_density_km2",
        label: "Population density",
        attributionF: 0.08,
      },
      {
        feature: "median_year_built",
        label: "Building age",
        attributionF: -0.07,
      },
    ],
    noCarPct: 56.4,
    seniorsPct: 18.8,
    povertyRate: 48.6,
    medianIncome: 14630,
    blackPct: 84.1,
    hispanicPct: 4.6,
    whitePct: 8.2,
    mapX: 48,
    mapY: 75,
    isFunded: true,
  },
  {
    id: 4,
    name: "Adair Park / Mechanicsville S.",
    tractId: "13121005800",
    shortTract: "58.00",
    lat: 33.7319,
    lng: -84.4106,
    offsetF: 4.7,
    hotDaysPerSummer: 67,
    residentsReached: 7353,
    estAnnualCost: "$165,000",
    dominantDriver: "Homes within 1.5 km",
    dominantDiagnosis:
      "Ranked 4th. Hot rail/industrial edge (+4.7°F peak cell), but its tract has much lower car-free household share (17.0% vs 47.2% in #1) and lower poverty (14.1%), and overlaps #1’s walk shed.",
    drivers: [
      {
        feature: "housing_within_1500m",
        label: "Homes within 1.5 km",
        attributionF: 1.53,
      },
      {
        feature: "pop_density_km2",
        label: "Population density",
        attributionF: 0.13,
      },
      {
        feature: "water_share",
        label: "Nearby water / canopy",
        attributionF: 0.11,
      },
      {
        feature: "pop_within_1500m",
        label: "Surrounding population",
        attributionF: -0.08,
      },
    ],
    noCarPct: 17.0,
    seniorsPct: 12.3,
    povertyRate: 14.1,
    medianIncome: 48235,
    blackPct: 68.0,
    hispanicPct: 7.2,
    whitePct: 21.1,
    mapX: 88,
    mapY: 42,
    isFunded: false,
  },
  {
    id: 5,
    name: "Lakewood / Sylvan Hills",
    tractId: "13121006500",
    shortTract: "65.00",
    lat: 33.7141,
    lng: -84.4101,
    offsetF: 3.5,
    hotDaysPerSummer: 56,
    residentsReached: 5529,
    estAnnualCost: "$160,000",
    dominantDriver: "Homes within 1.5 km",
    dominantDiagnosis:
      "Southern residential tract with +3.5°F peak cell offset and 14.8% seniors, but significantly lower car-free household rate (11.5%) than top 3 picks.",
    drivers: [
      {
        feature: "housing_within_1500m",
        label: "Homes within 1.5 km",
        attributionF: 0.9,
      },
      {
        feature: "water_share",
        label: "Nearby water / canopy",
        attributionF: 0.11,
      },
      {
        feature: "pop_density_km2",
        label: "Population density",
        attributionF: 0.09,
      },
      {
        feature: "median_year_built",
        label: "Building age",
        attributionF: -0.18,
      },
    ],
    noCarPct: 11.5,
    seniorsPct: 14.8,
    povertyRate: 32.3,
    medianIncome: 53409,
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
    povertyRate: 14.0,
    noCarPct: 8.2,
    seniorsPct: 12.5,
    blackPct: 47.2,
    hispanicPct: 6.0,
    whitePct: 40.4,
    asianPct: 4.8,
  });

  // Load real city baseline, candidate site metrics, and census tract scatter points from PR #2 BigQuery semantic layer
  useEffect(() => {
    async function loadSemanticData() {
      try {
        const [baselineRes, scatterRes, sitesRes] = await Promise.all([
          fetch("/api/semantic?type=baseline"),
          fetch("/api/semantic?type=tracts_scatter"),
          fetch("/api/semantic?type=sites"),
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

        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          if (Array.isArray(sitesData?.sites) && sitesData.sites.length > 0) {
            const byGeoId = new Map<string, any>();
            for (const row of sitesData.sites) {
              if (row?.geo_id) {
                byGeoId.set(String(row.geo_id), row);
              }
            }
            setSites((prev) =>
              prev.map((site) => {
                const row = byGeoId.get(site.tractId);
                if (!row) return site;
                const liveDrivers =
                  Array.isArray(row.drivers) && row.drivers.length >= 3
                    ? row.drivers
                    : site.drivers;
                return {
                  ...site,
                  lat: typeof row.lat === "number" ? row.lat : site.lat,
                  lng: typeof row.lon === "number" ? row.lon : site.lng,
                  offsetF:
                    typeof row.max_cell_offset_f === "number"
                      ? +row.max_cell_offset_f.toFixed(1)
                      : site.offsetF,
                  hotDaysPerSummer:
                    typeof row.hot_days_ge_95_per_yr === "number"
                      ? row.hot_days_ge_95_per_yr
                      : site.hotDaysPerSummer,
                  residentsReached:
                    typeof row.walk_pop === "number" && row.walk_pop > 0
                      ? row.walk_pop
                      : typeof row.population === "number"
                        ? row.population
                        : site.residentsReached,
                  noCarPct:
                    typeof row.no_car_pct === "number"
                      ? row.no_car_pct
                      : site.noCarPct,
                  seniorsPct:
                    typeof row.seniors_pct === "number"
                      ? row.seniors_pct
                      : site.seniorsPct,
                  povertyRate:
                    typeof row.poverty_pct === "number"
                      ? row.poverty_pct
                      : site.povertyRate,
                  medianIncome:
                    typeof row.median_income === "number"
                      ? Math.round(row.median_income)
                      : site.medianIncome,
                  drivers: liveDrivers,
                  dominantDriver:
                    liveDrivers[0]?.label || site.dominantDriver,
                };
              })
            );
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

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans selection:bg-[#f97316] selection:text-[#090d16] flex flex-col">
      {/* Top Navbar + Scenario Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
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
