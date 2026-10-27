import { NextRequest, NextResponse } from "next/server";

const LOCAL_ADK_URL = process.env.LOCAL_ADK_URL || "http://127.0.0.1:8000";
const URBAN_HEAT_AGENT_URL = process.env.CLOUD_RUN_URL || "https://urban-heat-agent-1042443035046.us-central1.run.app";
const ATLANTA_HEAT_AGENT_URL = process.env.ATLANTA_AGENT_URL || "https://atlanta-heat-agent-1042443035046.us-central1.run.app";

export interface DriverAttribution {
  feature: string;
  label?: string;
  attributionF: number;
  interpretation?: string;
}

export interface TractDemographics {
  povertyRatePct?: number;
  noVehicleRatePct?: number;
  seniorsPct?: number;
  carFreeHouseholds?: number;
  medianIncome?: number;
  totalPop?: number;
  walkShedPop?: number;
  hotDaysPerYr?: number;
  medianAge?: number;
}

export interface StructuredSite {
  rank?: number;
  censusTractId?: string;
  neighborhood?: string;
  facilitySite?: string;
  lat: number;
  lon: number;
  predictedOffsetF?: number;
  mlPredOffsetF?: number;
  score?: number;
  drivers?: DriverAttribution[];
  demographics?: TractDemographics;
  why?: string;
  googleMapsLink?: string;
  walkingDirectionsLink?: string;
}

export interface StructuredData {
  sites: StructuredSite[];
  equityAudit?: any;
  heatFrequency?: any;
}

function parseKeyHeatDrivers(rawDrivers: any): DriverAttribution[] {
  if (!Array.isArray(rawDrivers)) return [];
  const drivers: DriverAttribution[] = [];
  for (const item of rawDrivers) {
    if (typeof item === "string") {
      const m = item.match(/^(.+?)\s*\(([+-]?\d+(?:\.\d+)?)°F\)/);
      if (m) {
        drivers.push({
          feature: m[1].trim(),
          label: m[1].trim(),
          attributionF: parseFloat(m[2]),
          interpretation: item,
        });
      } else {
        drivers.push({
          feature: item,
          label: item,
          attributionF: 0,
          interpretation: item,
        });
      }
    } else if (item && typeof item === "object") {
      drivers.push({
        feature: item.feature || item.label || "Driver",
        label: item.label || item.feature || "Driver",
        attributionF:
          typeof item.attributionF === "number"
            ? item.attributionF
            : typeof item.attribution_f === "number"
            ? item.attribution_f
            : typeof item.attribution === "number"
            ? item.attribution
            : 0,
        interpretation: item.interpretation,
      });
    }
  }
  return drivers;
}

function parseStructuredAgentEvents(events: any[]): {
  fullResponse: string;
  structuredData: StructuredData;
  toolsCalled: string[];
} {
  const textBlocks: string[] = [];
  const sites: StructuredSite[] = [];
  const toolsCalled: string[] = [];
  let equityAudit: any = null;
  let heatFrequency: any = null;

  for (const ev of events) {
    if (!ev?.content?.parts) continue;

    for (const p of ev.content.parts) {
      if (p.text && !p.thought && typeof p.text === "string" && p.text.trim()) {
        const trimmed = p.text.trim();
        if (!textBlocks.includes(trimmed)) {
          textBlocks.push(trimmed);
        }
      }

      if (p.functionCall?.name && !toolsCalled.includes(p.functionCall.name)) {
        toolsCalled.push(p.functionCall.name);
      }

      if (p.functionResponse) {
        const toolName = p.functionResponse.name;
        if (toolName && !toolsCalled.includes(toolName)) {
          toolsCalled.push(toolName);
        }
        const res = p.functionResponse.response;
        if (!res) continue;

        // 1. explain_tract_heat_factors or predict_heat_offset (single location/tract breakdown)
        if (toolName === "explain_tract_heat_factors" || toolName === "predict_heat_offset") {
          const raw = res.error ? null : res.result || res;
          if (raw && !raw.error) {
            const drivers: DriverAttribution[] = parseKeyHeatDrivers(raw.drivers || raw.feature_attributions);
            const offsetVal = raw.predicted_offset_f ?? raw.predicted_temp_offset_f;

            sites.push({
              censusTractId: raw.census_tract_id || raw.census_tract || raw.neighborhood || "Point Query",
              neighborhood: raw.neighborhood,
              lat: typeof raw.latitude === "number" ? raw.latitude : 33.7285,
              lon: typeof raw.longitude === "number" ? raw.longitude : -84.4217,
              predictedOffsetF: offsetVal,
              mlPredOffsetF: raw.ml_predicted_offset_f,
              drivers,
              demographics: {
                povertyRatePct: raw.poverty_rate_pct,
                noVehicleRatePct: raw.no_vehicle_rate_pct,
                medianAge: raw.median_age,
                totalPop: raw.total_population,
              },
              why:
                raw.interpretation ||
                `Location running ${offsetVal > 0 ? "+" : ""}${offsetVal}°F vs city baseline`,
              googleMapsLink: raw.google_maps_url || raw.google_maps_link,
              walkingDirectionsLink: raw.walking_route_url || raw.walking_directions_link,
            });
          }
        }

        // 2. explain_atlanta_heat_model_tracts or rank_atlanta_heat_model_tracts (list of tracts)
        else if (
          toolName === "explain_atlanta_heat_model_tracts" ||
          toolName === "rank_atlanta_heat_model_tracts"
        ) {
          const list = Array.isArray(res)
            ? res
            : Array.isArray(res?.result)
            ? res.result
            : [res];
          list.forEach((item: any, idx: number) => {
            if (!item || item.error) return;
            const drivers: DriverAttribution[] = [];
            if (item.primary_attribution) {
              drivers.push({
                feature: item.primary_attribution.feature || "Primary Driver",
                label: item.primary_attribution.feature || "Primary Driver",
                attributionF: typeof item.primary_attribution.attribution === "number" ? item.primary_attribution.attribution : 0,
                interpretation: item.primary_attribution.interpretation,
              });
            }
            if (Array.isArray(item.feature_attributions)) {
              item.feature_attributions.forEach((fa: any) => {
                if (!drivers.some((d) => d.feature === fa.feature)) {
                  drivers.push({
                    feature: fa.feature,
                    label: fa.label || fa.feature,
                    attributionF: fa.attribution_f || fa.attribution || 0,
                  });
                }
              });
            }

            sites.push({
              rank: item.rank || idx + 1,
              censusTractId: item.census_tract_id,
              lat: item.coordinates?.latitude || 33.749,
              lon: item.coordinates?.longitude || -84.388,
              predictedOffsetF: item.avg_predicted_offset_f ?? item.predicted_offset_f,
              drivers,
              demographics: {
                povertyRatePct: item.poverty_rate_pct,
                noVehicleRatePct: item.no_vehicle_rate_pct,
                medianIncome: item.median_income,
                medianAge: item.median_age,
                totalPop: item.total_population,
              },
              why: item.primary_attribution?.interpretation || `Ranked #${item.rank || idx + 1} with ${item.avg_predicted_offset_f}°F offset`,
              googleMapsLink: item.google_maps_link,
              walkingDirectionsLink: item.walking_directions_link,
            });
          });
        }

        // 3. select_cooling_center_sites or rank_candidate_sites (repo agent siting tools)
        else if (toolName === "select_cooling_center_sites" || toolName === "rank_candidate_sites") {
          const rawObj = res?.result || res;
          const combinedList: any[] = [];
          if (Array.isArray(rawObj)) {
            combinedList.push(...rawObj);
          } else if (Array.isArray(rawObj?.selected_sites)) {
            combinedList.push(...rawObj.selected_sites);
            if (Array.isArray(rawObj?.passed_over)) {
              combinedList.push(...rawObj.passed_over);
            }
          } else if (Array.isArray(rawObj?.result)) {
            combinedList.push(...rawObj.result);
          } else if (rawObj && typeof rawObj === "object") {
            combinedList.push(rawObj);
          }

          combinedList.forEach((item: any, idx: number) => {
            if (!item || item.error) return;
            const drivers = parseKeyHeatDrivers(item.drivers || item.key_heat_drivers || item.feature_attributions);
            sites.push({
              rank: item.site_number || item.rank || idx + 1,
              censusTractId: item.census_tract_id || item.census_tract,
              neighborhood: item.neighborhood,
              facilitySite: item.facility_site,
              lat: item.coordinates?.latitude || 33.749,
              lon: item.coordinates?.longitude || -84.388,
              predictedOffsetF: item.heat_offset_f ?? item.predicted_temp_offset_f,
              mlPredOffsetF: item.ml_predicted_offset_f,
              score: item.composite_score ?? item.composite_vulnerability_score,
              drivers,
              demographics: {
                povertyRatePct: item.poverty_rate_pct,
                noVehicleRatePct: item.no_vehicle_rate_pct,
                seniorsPct: item.seniors_65_plus_pct,
                carFreeHouseholds: item.car_free_households,
                medianIncome: item.median_income,
                totalPop: item.population,
                walkShedPop: item.walk_shed_population_1200m,
                hotDaysPerYr: item.hot_days_ge_95_per_yr,
                medianAge: item.median_age,
              },
              why:
                item.why_passed_over ||
                item.rationale ||
                `Selected for priority cooling center siting (Composite Score: ${
                  item.composite_score ?? item.composite_vulnerability_score
                })`,
              googleMapsLink: item.google_maps_link,
              walkingDirectionsLink: item.walking_directions_link,
            });
          });
        }

        // 4. audit_equity
        else if (toolName === "audit_equity") {
          equityAudit = res?.result || res;
        }

        // 5. analyze_heat_frequency or get_heat_frequency
        else if (toolName === "analyze_heat_frequency" || toolName === "get_heat_frequency") {
          heatFrequency = res?.result || res;
        }
      }
    }
  }

  const fullResponse = textBlocks.join("\n\n");

  return {
    fullResponse,
    structuredData: {
      sites,
      equityAudit,
      heatFrequency,
    },
    toolsCalled,
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      agentId = "urban_heat_agent",
      compare = false,
      sessionId = `web_${Date.now()}`,
      userId = "urban_planner",
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const executeAgainstAdk = async (baseUrl: string, appName: string) => {
      try {
        await fetch(`${baseUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Session creation optional/idempotent
      }

      return fetch(`${baseUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName,
          userId,
          sessionId,
          newMessage: {
            role: "user",
            parts: [{ text: prompt }],
          },
        }),
      });
    };

    const queryAgent = async (remoteCloudUrl: string, appName: string) => {
      const startTime = Date.now();
      let agentRes: Response | null = null;
      const preferLocal = process.env.PREFER_LOCAL_ADK === "true";
      const primaryUrl = preferLocal ? LOCAL_ADK_URL : remoteCloudUrl;
      const secondaryUrl = preferLocal ? remoteCloudUrl : LOCAL_ADK_URL;
      let usedUrl = primaryUrl;

      // Default to calling the Cloud Run agent first; fall back to local ADK only if unreachable
      try {
        agentRes = await executeAgainstAdk(primaryUrl, appName);
        if (!agentRes.ok && secondaryUrl !== primaryUrl) {
          agentRes = await executeAgainstAdk(secondaryUrl, appName);
          usedUrl = secondaryUrl;
        }
      } catch {
        try {
          agentRes = await executeAgainstAdk(secondaryUrl, appName);
          usedUrl = secondaryUrl;
        } catch {
          agentRes = null;
        }
      }

      const latencyMs = Date.now() - startTime;
      if (!agentRes || !agentRes.ok) {
        const errText = agentRes ? await agentRes.text() : "Unreachable";
        return {
          error: `Agent error (${agentRes?.status || 500} from ${usedUrl}): ${errText}`,
          latencyMs,
          response: "",
          coordinates: [],
          structuredData: { sites: [] },
          toolsCalled: [],
          sourceUrl: usedUrl,
        };
      }

      const events = await agentRes.json();
      let { fullResponse, structuredData, toolsCalled } = parseStructuredAgentEvents(events);

      if (!fullResponse.trim() && structuredData.sites.length > 0) {
        const rows = structuredData.sites
          .map(
            (s, i) =>
              `| ${s.rank || i + 1} | ${s.censusTractId || "N/A"} | +${(s.predictedOffsetF ?? 0).toFixed(2)}°F | ${
                s.why || "High urban heat anomaly"
              } | ${s.demographics?.povertyRatePct ?? "N/A"}% | ${s.demographics?.noVehicleRatePct ?? "N/A"}% |`
          )
          .join("\n");
        fullResponse = `### BigQuery ML & ACS Siting Analysis\n\n| Rank | Census Tract | Heat Offset | Primary Driver | Poverty | No Vehicle |\n|---|---|---|---|---|---|\n${rows}`;
      }

      const coordMatches: {
        lat: number;
        lon: number;
        label?: string;
        predictedOffsetF?: number;
        drivers?: DriverAttribution[];
        demographics?: TractDemographics;
        why?: string;
        tractId?: string;
      }[] = [];

      if (structuredData.sites.length > 0) {
        structuredData.sites.forEach((site) => {
          coordMatches.push({
            lat: site.lat,
            lon: site.lon,
            label: site.why || `Tract ${site.censusTractId || ""}`,
            predictedOffsetF: site.predictedOffsetF,
            drivers: site.drivers,
            demographics: site.demographics,
            why: site.why,
            tractId: site.censusTractId,
          });
        });
      } else {
        const coordRegex = /(?:Latitude|lat|latitude)[\s:]*([+-]?\d+\.\d+)[,\s]+(?:Longitude|lon|longitude)[\s:]*([+-]?\d+\.\d+)/gi;
        let match;
        while ((match = coordRegex.exec(fullResponse)) !== null) {
          coordMatches.push({
            lat: parseFloat(match[1]),
            lon: parseFloat(match[2]),
          });
        }
        const mapsRegex = /destination=([+-]?\d+\.\d+)%2C([+-]?\d+\.\d+)/g;
        while ((match = mapsRegex.exec(fullResponse)) !== null) {
          const lat = parseFloat(match[1]);
          const lon = parseFloat(match[2]);
          if (!coordMatches.some((c) => Math.abs(c.lat - lat) < 0.001 && Math.abs(c.lon - lon) < 0.001)) {
            coordMatches.push({ lat, lon });
          }
        }
      }

      return {
        response: fullResponse,
        coordinates: coordMatches,
        structuredData,
        toolsCalled,
        latencyMs,
        sourceUrl: usedUrl,
      };
    };

    if (compare) {
      const [res1, res2] = await Promise.all([
        queryAgent(URBAN_HEAT_AGENT_URL, "urban_heat_agent"),
        queryAgent(ATLANTA_HEAT_AGENT_URL, "atlanta_heat_agent"),
      ]);

      return NextResponse.json({
        compare: true,
        agent1: {
          id: "urban_heat_agent",
          name: "Agent 1: Planner (Multi-Factor Equity)",
          ...res1,
        },
        agent2: {
          id: "atlanta_heat_agent",
          name: "Agent 2: BQML Explainer (ML.EXPLAIN_PREDICT)",
          ...res2,
        },
        sessionId,
      });
    }

    const isAtlantaAgent = agentId === "atlanta_heat_agent";
    const targetUrl = isAtlantaAgent ? ATLANTA_HEAT_AGENT_URL : URBAN_HEAT_AGENT_URL;
    const appName = isAtlantaAgent ? "atlanta_heat_agent" : agentId === "agent" ? "agent" : "urban_heat_agent";

    const singleResult = await queryAgent(targetUrl, appName);
    return NextResponse.json({
      response: singleResult.response,
      coordinates: singleResult.coordinates,
      structuredData: singleResult.structuredData,
      toolsCalled: singleResult.toolsCalled,
      latencyMs: singleResult.latencyMs,
      sourceUrl: singleResult.sourceUrl,
      agentId,
      sessionId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
