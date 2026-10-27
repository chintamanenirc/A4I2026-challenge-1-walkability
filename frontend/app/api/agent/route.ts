import { NextRequest, NextResponse } from "next/server";

const URBAN_HEAT_AGENT_URL = process.env.CLOUD_RUN_URL || "https://urban-heat-agent-1042443035046.us-central1.run.app";
const ATLANTA_HEAT_AGENT_URL = process.env.ATLANTA_AGENT_URL || "https://atlanta-heat-agent-1042443035046.us-central1.run.app";

export interface DriverAttribution {
  feature: string;
  attributionF: number;
  interpretation?: string;
}

export interface TractDemographics {
  povertyRatePct?: number;
  noVehicleRatePct?: number;
  medianIncome?: number;
  totalPop?: number;
  medianAge?: number;
}

export interface StructuredSite {
  rank?: number;
  censusTractId?: string;
  lat: number;
  lon: number;
  predictedOffsetF?: number;
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

function parseStructuredAgentEvents(events: any[]): { fullResponse: string; structuredData: StructuredData } {
  let fullResponse = "";
  const sites: StructuredSite[] = [];
  let equityAudit: any = null;
  let heatFrequency: any = null;

  for (const ev of events) {
    if (!ev?.content?.parts) continue;

    for (const p of ev.content.parts) {
      if (p.text) {
        fullResponse += p.text;
      }

      if (p.functionResponse) {
        const toolName = p.functionResponse.name;
        const res = p.functionResponse.response;
        if (!res) continue;

        // 1. explain_tract_heat_factors (single tract breakdown)
        if (toolName === "explain_tract_heat_factors") {
          const raw = res.error ? null : res;
          if (raw) {
            const drivers: DriverAttribution[] = (raw.feature_attributions || []).map((fa: any) => ({
              feature: fa.feature || "",
              attributionF: typeof fa.attribution_f === "number" ? fa.attribution_f : 0,
            }));

            sites.push({
              censusTractId: raw.census_tract_id,
              lat: 33.7285, // Default fallback centroid if not in response
              lon: -84.4217,
              predictedOffsetF: raw.predicted_offset_f,
              drivers,
              demographics: {
                povertyRatePct: raw.poverty_rate_pct,
                noVehicleRatePct: raw.no_vehicle_rate_pct,
                medianAge: raw.median_age,
                totalPop: raw.total_population,
              },
              why: `Tract ${raw.census_tract_id} running ${raw.predicted_offset_f > 0 ? "+" : ""}${raw.predicted_offset_f}°F vs city mean`,
            });
          }
        }

        // 2. explain_atlanta_heat_model_tracts or rank_atlanta_heat_model_tracts (list of tracts)
        else if (
          toolName === "explain_atlanta_heat_model_tracts" ||
          toolName === "rank_atlanta_heat_model_tracts"
        ) {
          const list = Array.isArray(res) ? res : [res];
          list.forEach((item: any, idx: number) => {
            if (item.error) return;
            const drivers: DriverAttribution[] = [];
            if (item.primary_attribution) {
              drivers.push({
                feature: item.primary_attribution.feature || "Primary Driver",
                attributionF: typeof item.primary_attribution.attribution === "number" ? item.primary_attribution.attribution : 0,
                interpretation: item.primary_attribution.interpretation,
              });
            }
            if (Array.isArray(item.feature_attributions)) {
              item.feature_attributions.forEach((fa: any) => {
                if (!drivers.some((d) => d.feature === fa.feature)) {
                  drivers.push({
                    feature: fa.feature,
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
                medianAge: item.median_age,
                totalPop: item.total_population,
              },
              why: item.primary_attribution?.interpretation || `Ranked #${item.rank || idx + 1} with ${item.avg_predicted_offset_f}°F offset`,
              googleMapsLink: item.google_maps_link,
              walkingDirectionsLink: item.walking_directions_link,
            });
          });
        }

        // 3. rank_candidate_sites
        else if (toolName === "rank_candidate_sites") {
          const list = Array.isArray(res) ? res : [res];
          list.forEach((item: any, idx: number) => {
            if (item.error) return;
            sites.push({
              rank: item.rank || idx + 1,
              censusTractId: item.census_tract_id,
              lat: item.coordinates?.latitude || 33.749,
              lon: item.coordinates?.longitude || -84.388,
              predictedOffsetF: item.heat_offset_f,
              score: item.composite_score,
              demographics: {
                povertyRatePct: item.poverty_rate_pct,
              },
              why: item.rationale || `Selected for priority cooling center siting (Composite Score: ${item.composite_score})`,
              googleMapsLink: item.google_maps_link,
              walkingDirectionsLink: item.walking_directions_link,
            });
          });
        }

        // 4. audit_equity
        else if (toolName === "audit_equity") {
          equityAudit = res;
        }

        // 5. get_heat_frequency
        else if (toolName === "get_heat_frequency") {
          heatFrequency = res;
        }
      }
    }
  }

  return {
    fullResponse,
    structuredData: {
      sites,
      equityAudit,
      heatFrequency,
    },
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

    const queryAgent = async (targetUrl: string, appName: string) => {
      const startTime = Date.now();
      try {
        await fetch(`${targetUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Session endpoint optional/idempotent
      }

      const agentRes = await fetch(`${targetUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appName,
          userId: userId,
          sessionId: sessionId,
          newMessage: {
            role: "user",
            parts: [{ text: prompt }],
          },
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!agentRes.ok) {
        const errText = await agentRes.text();
        return {
          error: `Agent error (${agentRes.status}): ${errText}`,
          latencyMs,
          response: "",
          coordinates: [],
          structuredData: { sites: [] },
        };
      }

      const events = await agentRes.json();
      const { fullResponse, structuredData } = parseStructuredAgentEvents(events);

      // Extract coordinates from structured data first
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
        // Fallback: extract coordinates from text via regex if tools did not return structured site points
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
        latencyMs,
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
    const appName = isAtlantaAgent ? "atlanta_heat_agent" : "urban_heat_agent";

    const singleResult = await queryAgent(targetUrl, appName);
    return NextResponse.json({
      response: singleResult.response,
      coordinates: singleResult.coordinates,
      structuredData: singleResult.structuredData,
      latencyMs: singleResult.latencyMs,
      agentId,
      sessionId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
