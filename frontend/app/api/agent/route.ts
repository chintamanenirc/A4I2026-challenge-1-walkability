import { NextRequest, NextResponse } from "next/server";

const URBAN_HEAT_AGENT_URL = process.env.CLOUD_RUN_URL || "https://urban-heat-agent-1042443035046.us-central1.run.app";
const ATLANTA_HEAT_AGENT_URL = process.env.ATLANTA_AGENT_URL || "https://atlanta-heat-agent-1042443035046.us-central1.run.app";

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

    // Helper function to query a specific agent
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
        return { error: `Agent error (${agentRes.status}): ${errText}`, latencyMs, response: "", coordinates: [] };
      }

      const events = await agentRes.json();
      let fullResponse = "";
      for (const ev of events) {
        if (ev.content?.parts) {
          for (const p of ev.content.parts) {
            if (p.text) fullResponse += p.text;
          }
        }
      }

      // Extract coordinates
      const coordMatches: { lat: number; lon: number; label?: string }[] = [];
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
        coordMatches.push({
          lat: parseFloat(match[1]),
          lon: parseFloat(match[2]),
        });
      }

      return {
        response: fullResponse,
        coordinates: coordMatches,
        latencyMs,
      };
    };

    if (compare) {
      // Parallel execution of Agent 1 and Agent 2
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
      latencyMs: singleResult.latencyMs,
      agentId,
      sessionId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
