"use client";

import React, { useState, useRef, useEffect } from "react";
import MapViewer, { LocationPoint } from "@/components/MapViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  MapPin,
  Bot,
  User,
  Flame,
  Loader2,
  Trash2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Scale,
  Navigation,
  Info,
} from "lucide-react";

interface ComparisonResult {
  agent1: {
    id: string;
    name: string;
    response: string;
    coordinates?: LocationPoint[];
    latencyMs?: number;
    error?: string;
  };
  agent2: {
    id: string;
    name: string;
    response: string;
    coordinates?: LocationPoint[];
    latencyMs?: number;
    error?: string;
  };
}

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  coordinates?: LocationPoint[];
  comparison?: ComparisonResult;
}

const CATEGORIZED_PRESETS = [
  {
    category: "Side-by-Side Head-to-Head",
    icon: Sparkles,
    title: "Compare Top 3 Hot Tracts",
    mode: "compare",
    prompt:
      "Rank the top 3 high-heat risk census tracts in Atlanta, explain the primary drivers, and provide demographic and coordinates.",
  },
  {
    category: "Atlanta BQML Explainer (Agent 2)",
    icon: Scale,
    title: "Explain Tract 13121006200 Drivers",
    agentId: "atlanta_heat_agent",
    mode: "single",
    prompt:
      "Why is tract 13121006200 predicted to run hot? Break down all its BigQuery ML feature attributions.",
  },
  {
    category: "Cooling Center Siting (Agent 1)",
    icon: Flame,
    title: "Atlanta 3 Centers Multi-Factor",
    agentId: "urban_heat_agent",
    mode: "single",
    prompt:
      "We have funding for 3 cooling centers in Atlanta this summer. Where should they go to maximize equity and mitigate extreme heat?",
  },
  {
    category: "Geocoding & Walkability",
    icon: Navigation,
    title: "10th St NE Heat Risk & Walk Route",
    agentId: "urban_heat_agent",
    mode: "single",
    prompt:
      "What is the microclimate heat risk at 10th St NE, Atlanta? Provide Google Maps links for site inspection.",
  },
];

export default function UrbanHeatPlannerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "agent",
      text: `### 👋 Welcome to Urban Heat Resilience Studio
Compare **Agent 1 (Urban Heat Planner)** and **Agent 2 (Atlanta BQML Explainer)** side-by-side or query either individually.

* ⚖️ **Side-by-Side Mode**: Ask a question to both agents simultaneously and evaluate their recommendations in parallel.
* 📍 **Agent 1 (Planner)**: Multi-criteria prioritization (heat offset + poverty + transit access + population).
* 🔬 **Agent 2 (Explainer)**: Direct BigQuery \`ML.EXPLAIN_PREDICT\` feature attributions and microclimate variance.
* 🗺️ **Google Maps Spatial Inspector**: Live synchronization with coordinate badges and walking routes!`,
      timestamp: "Ready",
      coordinates: [{ lat: 33.7043, lon: -84.361, label: "Atlanta High-Need Tract (Thomasville)" }],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(true);
  const [activeAgent, setActiveAgent] = useState<"urban_heat_agent" | "atlanta_heat_agent">("urban_heat_agent");
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint>({
    lat: 33.7043,
    lon: -84.361,
    label: "Thomasville, Atlanta (Tract 13121006802)",
  });
  const [allLocations, setAllLocations] = useState<LocationPoint[]>([
    { lat: 33.7285, lon: -84.4217, label: "Agent 2: Tract 13121006200 (+3.17°F)", agentId: "atlanta_heat_agent", agentLabel: "Agent 2" },
    { lat: 33.7043, lon: -84.3610, label: "Agent 1: Tract 13121006802 (+0.87°F)", agentId: "urban_heat_agent", agentLabel: "Agent 1" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (
    textToSend?: string,
    forcedMode?: "single" | "compare",
    forcedAgentId?: "urban_heat_agent" | "atlanta_heat_agent"
  ) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const useCompare = forcedMode ? forcedMode === "compare" : isCompareMode;
    const agentToUse = forcedAgentId || activeAgent;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setLoading(true);

    try {
      const endpoint = window.location.pathname.startsWith("/devmode")
        ? "/devmode/api/agent"
        : "/api/agent";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          agentId: agentToUse,
          compare: useCompare,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to query heat resilience agents");
      }

      if (data.compare) {
        // Collect coordinates from both agents
        const combinedCoords: LocationPoint[] = [];

        const agent1Coords: LocationPoint[] = (data.agent1?.coordinates || []).map((c: any) => ({
          lat: Number(c.lat),
          lon: Number(c.lon),
          label: c.label || `Agent 1 Site (${c.lat.toFixed(4)}, ${c.lon.toFixed(4)})`,
          agentId: "urban_heat_agent" as const,
          agentLabel: "Agent 1",
        }));

        const agent2Coords: LocationPoint[] = (data.agent2?.coordinates || []).map((c: any) => ({
          lat: Number(c.lat),
          lon: Number(c.lon),
          label: c.label || `Agent 2 Site (${c.lat.toFixed(4)}, ${c.lon.toFixed(4)})`,
          agentId: "atlanta_heat_agent" as const,
          agentLabel: "Agent 2",
        }));

        combinedCoords.push(...agent1Coords, ...agent2Coords);

        const agentMsg: Message = {
          id: `compare_${Date.now()}`,
          sender: "agent",
          text: "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          coordinates: combinedCoords,
          comparison: {
            agent1: {
              ...data.agent1,
              coordinates: agent1Coords,
            },
            agent2: {
              ...data.agent2,
              coordinates: agent2Coords,
            },
          },
        };

        setMessages((prev) => [...prev, agentMsg]);

        if (combinedCoords.length > 0) {
          setAllLocations(combinedCoords);
          setSelectedLocation(combinedCoords[0]);
        }
      } else {
        const coords: LocationPoint[] = (data.coordinates || []).map((c: any) => ({
          lat: Number(c.lat),
          lon: Number(c.lon),
          label: c.label || `Site (${c.lat.toFixed(4)}, ${c.lon.toFixed(4)})`,
          agentId: agentToUse,
          agentLabel: agentToUse === "atlanta_heat_agent" ? "Agent 2" : "Agent 1",
        }));

        const agentMsg: Message = {
          id: `agent_${Date.now()}`,
          sender: "agent",
          text: data.response || "No response received.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          coordinates: coords,
        };

        setMessages((prev) => [...prev, agentMsg]);

        if (coords.length > 0) {
          setAllLocations(coords);
          setSelectedLocation(coords[0]);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "agent",
          text: `⚠️ **Unable to fetch agent response**: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome_reset",
        sender: "agent",
        text: "Conversation cleared. Ready for your next query!",
        timestamp: "Now",
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
                Urban Heat Resilience Studio
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live BigQuery ML + Multi-Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Side-by-side agent comparison, microclimate predictions, & Google Maps spatial sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode Selector: Compare Side-by-Side vs Single Agent */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setIsCompareMode(true)}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                isCompareMode
                  ? "bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Side-by-Side Compare</span>
            </button>
            <button
              onClick={() => setIsCompareMode(false)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                !isCompareMode
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Single Agent
            </button>
          </div>

          {/* If Single Agent, choose which agent */}
          {!isCompareMode && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveAgent("urban_heat_agent")}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  activeAgent === "urban_heat_agent"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Agent 1 (Planner)
              </button>
              <button
                onClick={() => setActiveAgent("atlanta_heat_agent")}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  activeAgent === "atlanta_heat_agent"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Agent 2 (Explainer)
              </button>
            </div>
          )}

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left Chat & Controls (55%) + Right Google Maps View (45%) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Agent Conversation & Input */}
        <div className="w-full lg:w-[55%] flex flex-col border-r border-slate-800/80 bg-slate-900/30">
          {/* Quick Scenario Recommendation Buttons */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 shrink-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommended Comparison & Planning Scenarios</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Mode:{" "}
                <span className="font-semibold text-slate-300">
                  {isCompareMode ? "Side-by-Side (Both Agents)" : activeAgent}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIZED_PRESETS.map((preset, idx) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (preset.mode === "compare") {
                        setIsCompareMode(true);
                        handleSubmit(preset.prompt, "compare");
                      } else {
                        if (preset.agentId) setActiveAgent(preset.agentId as any);
                        handleSubmit(preset.prompt, preset.mode as any, preset.agentId as any);
                      }
                    }}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 text-left transition flex items-start gap-2 group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-700/50 text-amber-400 group-hover:text-amber-300 shrink-0 mt-0.5">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {preset.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "agent" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* If user message */}
                {msg.sender === "user" ? (
                  <div className="max-w-[85%] rounded-2xl p-3.5 shadow-sm leading-relaxed bg-blue-600 text-white rounded-br-xs">
                    <p className="text-sm">{msg.text}</p>
                    <div className="mt-1.5 text-[10px] text-blue-200 text-right">
                      {msg.timestamp}
                    </div>
                  </div>
                ) : msg.comparison ? (
                  /* SIDE-BY-SIDE COMPARISON CARD */
                  <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                          Side-by-Side Model Comparison
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Agent 1 */}
                      <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                              <span className="font-bold text-xs text-amber-300">
                                Agent 1: Urban Heat Planner
                              </span>
                            </div>
                            {msg.comparison.agent1.latencyMs && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {(msg.comparison.agent1.latencyMs / 1000).toFixed(2)}s
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mb-2 italic">
                            Composite Optimization (Heat Offset + Poverty + Transit + Population)
                          </div>
                          <div className="prose-dark text-xs max-h-[360px] overflow-y-auto pr-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.comparison.agent1.response || msg.comparison.agent1.error || "No response"}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Agent 1 Map Pins */}
                        {msg.comparison.agent1.coordinates && msg.comparison.agent1.coordinates.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] text-amber-400 font-medium">Map Pins:</span>
                            {msg.comparison.agent1.coordinates.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedLocation(c)}
                                className="px-2 py-0.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800 text-amber-300 text-[10px] rounded font-mono transition"
                              >
                                #{i + 1} ({c.lat.toFixed(4)}, {c.lon.toFixed(4)})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Agent 2 */}
                      <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                              <span className="font-bold text-xs text-emerald-300">
                                Agent 2: Atlanta BQML Explainer
                              </span>
                            </div>
                            {msg.comparison.agent2.latencyMs && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {(msg.comparison.agent2.latencyMs / 1000).toFixed(2)}s
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mb-2 italic">
                            Direct BigQuery ML.EXPLAIN_PREDICT on atlanta_heat_model
                          </div>
                          <div className="prose-dark text-xs max-h-[360px] overflow-y-auto pr-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.comparison.agent2.response || msg.comparison.agent2.error || "No response"}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Agent 2 Map Pins */}
                        {msg.comparison.agent2.coordinates && msg.comparison.agent2.coordinates.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] text-emerald-400 font-medium">Map Pins:</span>
                            {msg.comparison.agent2.coordinates.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedLocation(c)}
                                className="px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-[10px] rounded font-mono transition"
                              >
                                #{i + 1} ({c.lat.toFixed(4)}, {c.lon.toFixed(4)})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SINGLE AGENT REGULAR MESSAGE */
                  <div className="max-w-[88%] rounded-2xl p-4 shadow-sm leading-relaxed bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-xs">
                    <div className="prose-dark text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {msg.coordinates && msg.coordinates.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" /> View in Google Maps:
                        </span>
                        {msg.coordinates.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedLocation(c)}
                            className="px-2.5 py-1 bg-slate-900/90 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 text-emerald-300 text-[11px] rounded-lg font-mono transition flex items-center gap-1"
                          >
                            <span>#{i + 1}:</span>
                            <span>{c.lat.toFixed(4)}, {c.lon.toFixed(4)}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-[10px] text-slate-400/80 text-right">
                      {msg.timestamp}
                    </div>
                  </div>
                )}

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center text-white shrink-0 shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-sm items-center text-slate-400 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <div className="font-medium text-slate-300 text-xs">
                    {isCompareMode
                      ? "Querying Agent 1 & Agent 2 concurrently in BigQuery ML..."
                      : "Consulting BigQuery ML & Google Maps..."}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Executing model inference, calculating attributions, and geocoding candidate coordinates
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input Form */}
          <div className="p-3 bg-slate-950 border-t border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={
                    isCompareMode
                      ? "Ask a question to compare both agents side-by-side (e.g. Which tracts are hottest and why?)..."
                      : "Ask a question or street address (e.g. 10th St NE, Atlanta)..."
                  }
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className={`px-5 py-3 text-white rounded-xl font-medium text-sm transition flex items-center gap-2 shadow-lg shrink-0 disabled:opacity-40 ${
                  isCompareMode
                    ? "bg-gradient-to-r from-amber-600 to-emerald-600 hover:opacity-90 shadow-emerald-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isCompareMode ? "Compare" : "Send"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Google Maps Spatial Inspector */}
        <div className="w-full lg:w-[45%] p-3 sm:p-4 flex flex-col bg-slate-950 min-h-[420px]">
          <MapViewer
            selectedLocation={selectedLocation}
            locations={allLocations}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
          />
        </div>
      </main>
    </div>
  );
}
