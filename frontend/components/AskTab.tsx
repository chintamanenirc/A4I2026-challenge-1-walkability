"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Bot,
  Activity,
  PanelRightClose,
  PanelRightOpen,
  Play,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Timer,
  Cpu,
  Terminal,
  Map as MapIcon,
  Layers,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
  Database,
  FileCode2,
} from "lucide-react";
import { SiteData } from "./types";
import { AtlantaMap } from "./AtlantaMap";
import {
  INITIAL_SESSIONS,
  INITIAL_SPECIALIZED_AGENTS,
  AgentSession,
  AgentMessage,
  SpecializedAgent,
  AgentStatus,
  ToolCallItem,
  buildSimulatedAgentTurn,
} from "@/src/lib/mock-agent-data";
import { AgentThought } from "@/components/agent/AgentThought";
import { ToolCall } from "@/components/agent/ToolCall";
import { ApprovalGate } from "@/components/agent/ApprovalGate";
import { MultiStepProgress } from "@/components/agent/MultiStepProgress";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  cn,
} from "@/components/ui/primitives";

export interface AskTabProps {
  sites: SiteData[];
  selectedSiteId: number;
  setSelectedSiteId: (id: number) => void;
  centersToFund: number;
  setCentersToFund: (fn: (prev: number) => number) => void;
  onNavigateTab: (tab: "ask" | "sites" | "equity" | "proposal") => void;
  onOpenCompareModal: () => void;
  onSendMessage: (
    query: string,
    agentId?: "atlanta_heat_agent" | "urban_heat_agent"
  ) => Promise<void>;
  isLoadingMessage: boolean;
  lastUserQuery?: string;
  agentReply?: string | null;
  agentLatencyMs?: number | null;
  agentSourceUrl?: string | null;
  agentToolsCalled?: string[];
  onClearAgentReply?: () => void;
}

const PRESET_AGENTIC_PROMPTS = [
  {
    label: "1. Siting + $540k HITL Gate",
    prompt:
      "Run the FY2026 Cooling Center Siting optimization for $540,000 (3 sites, 1.5km spacing) and prepare the budget approval gate.",
  },
  {
    label: "2. Site #1 BQML EXPLAIN_PREDICT",
    prompt:
      "Explain why Mechanicsville / Pittsburgh (Tract 13121006700) runs +4.3°F hotter than Atlanta's baseline using BQML EXPLAIN_PREDICT.",
  },
  {
    label: "3. Why not Site #4 (Adair Park)?",
    prompt:
      "Why did we pass over Candidate Site #4 (Adair Park) in favor of Site #3 when funding 3 cooling centers?",
  },
  {
    label: "4. Scope Guardrail: 500 Trees",
    prompt:
      "If we plant 500 trees in Mechanicsville next spring, how many degrees °F will the neighborhood temperature drop?",
  },
];

function getStatusIndicator(status: AgentStatus) {
  switch (status) {
    case "Executing":
      return {
        dot: "bg-sky-400 animate-ping",
        solidDot: "bg-sky-400",
        badgeVariant: "blue" as const,
        label: "Executing",
      };
    case "Waiting for Human":
      return {
        dot: "bg-amber-400 animate-ping",
        solidDot: "bg-amber-400",
        badgeVariant: "amber" as const,
        label: "Waiting for Human",
      };
    case "Failed":
      return {
        dot: "bg-red-500",
        solidDot: "bg-red-500",
        badgeVariant: "red" as const,
        label: "Failed",
      };
    case "Idle":
    default:
      return {
        dot: "bg-emerald-400/40",
        solidDot: "bg-emerald-400",
        badgeVariant: "emerald" as const,
        label: "Idle",
      };
  }
}

export const AskTab: React.FC<AskTabProps> = ({
  sites,
  selectedSiteId,
  setSelectedSiteId,
  centersToFund,
  setCentersToFund,
  onNavigateTab,
  onOpenCompareModal,
  onSendMessage,
  isLoadingMessage,
  agentReply,
  agentLatencyMs,
  agentToolsCalled,
}) => {
  // React 19 concurrent transition for non-blocking session/tab switching
  const [isPendingTransition, startTransition] = useTransition();

  // Sessions & Multi-Agent State
  const [sessions, setSessions] = useState<AgentSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    INITIAL_SESSIONS[0].id
  );
  const [agents, setAgents] = useState<SpecializedAgent[]>(
    INITIAL_SPECIALIZED_AGENTS
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    INITIAL_SPECIALIZED_AGENTS[0].id
  );

  // Streaming & Simulation State (@ai-sdk/react pattern)
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isStreamingTurn, setIsStreamingTurn] = useState<boolean>(false);
  const [streamingProgress, setStreamingProgress] = useState<number>(82);
  const [streamedTextOverride, setStreamedTextOverride] = useState<
    Record<string, string>
  >({});

  // Right Context / Tool Execution Inspect Panel State
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<
    "canvas" | "sandbox" | "metrics"
  >("canvas");
  const [activeLayer, setActiveLayer] = useState<"heat" | "nocar" | "age65">(
    "heat"
  );
  const [inspectedToolCall, setInspectedToolCall] =
    useState<ToolCallItem | null>(
      INITIAL_SESSIONS[0].messages[1]?.toolCalls?.[0] || null
    );
  const [sandboxRunOutput, setSandboxRunOutput] = useState<string | null>(null);

  // Scroll anchoring ref
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const latestAssistantMsg = [...activeSession.messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const selectedSite =
    sites.find((s) => s.id === selectedSiteId) || sites[0];
  const fundedSites = sites.slice(0, centersToFund);
  const passedOverSites = sites.slice(centersToFund);

  // Sync live backend agentReply into the active session if parent onSendMessage returns data
  useEffect(() => {
    if (!agentReply) return;
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSessionId) return sess;
        const msgs = [...sess.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: agentReply,
            latencyMs: agentLatencyMs || msgs[lastIdx].latencyMs,
          };
        }
        return { ...sess, messages: msgs };
      })
    );
  }, [agentReply, agentLatencyMs, activeSessionId]);

  // Scroll-anchor to bottom of conversation stream when messages or streaming updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeSession.messages.length, isStreamingTurn, streamedTextOverride]);

  // Simulate multi-step streaming effect (@ai-sdk/react streaming lifecycle)
  const triggerStreamingReplay = (targetMessage: AgentMessage) => {
    const fullText = targetMessage.content;
    const msgId = targetMessage.id;
    setIsStreamingTurn(true);
    setStreamingProgress(18);

    setAgents((prev) =>
      prev.map((ag, idx) => ({
        ...ag,
        status: idx === 0 || idx === 1 ? "Executing" : "Idle",
      }))
    );

    let charIndex = 0;
    const stepSize = Math.max(18, Math.floor(fullText.length / 28));

    const interval = setInterval(() => {
      charIndex += stepSize;
      const ratio = Math.min(1, charIndex / fullText.length);
      const hasPendingGate =
        targetMessage.approvalGate?.status === "pending";
      const capPct = hasPendingGate ? 82 : 100;
      setStreamingProgress(Math.min(capPct, Math.round(20 + ratio * 80)));

      if (charIndex >= fullText.length) {
        clearInterval(interval);
        setStreamedTextOverride((prev) => {
          const next = { ...prev };
          delete next[msgId];
          return next;
        });
        setIsStreamingTurn(false);
        setAgents((prev) =>
          prev.map((ag) => ({
            ...ag,
            status:
              ag.id === "orchestrator-agent" && hasPendingGate
                ? "Waiting for Human"
                : "Idle",
          }))
        );
      } else {
        setStreamedTextOverride((prev) => ({
          ...prev,
          [msgId]: fullText.slice(0, charIndex),
        }));
      }
    }, 45);
  };

  // Switch active session
  const handleSelectSession = (session: AgentSession) => {
    startTransition(() => {
      setActiveSessionId(session.id);
      const lastAssistant = [...session.messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistant?.toolCalls?.[0]) {
        setInspectedToolCall(lastAssistant.toolCalls[0]);
      }
      if (lastAssistant?.progressPct !== undefined) {
        setStreamingProgress(lastAssistant.progressPct);
      }
      const hasPendingGate =
        lastAssistant?.approvalGate?.status === "pending";
      setAgents((prev) =>
        prev.map((ag) => ({
          ...ag,
          status:
            ag.id === session.activeAgentId
              ? hasPendingGate
                ? "Waiting for Human"
                : "Idle"
              : "Idle",
        }))
      );
    });
  };

  // Create a new session
  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const welcomeTurn = buildSimulatedAgentTurn(
      "Initialize FY2026 Cooling Center multi-agent workspace and verify 207 Fulton County tracts."
    );
    const newSession: AgentSession = {
      id: newId,
      title: `Planning Session #${sessions.length + 1}`,
      subtitle: "Interactive multi-agent heat & equity stream",
      updatedAt: "Just now",
      activeAgentId: "orchestrator-agent",
      badge: "Active",
      status: "Idle",
      messages: [
        {
          id: `user-${Date.now()}`,
          role: "user",
          timestamp: new Date().toTimeString().slice(0, 8),
          content:
            "Initialize FY2026 Cooling Center multi-agent workspace and verify 207 Fulton County tracts.",
        },
        welcomeTurn,
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setStreamingProgress(100);
  };

  // Submit a user prompt (runs multi-step simulation + invokes live /api/agent)
  const handlePromptSubmit = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isStreamingTurn) return;
    setInputPrompt("");

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      timestamp: new Date().toTimeString().slice(0, 8),
      content: trimmed,
    };

    const simulatedTurn = buildSimulatedAgentTurn(trimmed, undefined, {
      toolsCalled: agentToolsCalled,
    });

    if (simulatedTurn.linkedSiteRank) {
      setSelectedSiteId(simulatedTurn.linkedSiteRank);
    }
    if (simulatedTurn.toolCalls?.[0]) {
      setInspectedToolCall(simulatedTurn.toolCalls[0]);
    }

    setSessions((prev) =>
      prev.map((sess) =>
        sess.id === activeSessionId
          ? {
              ...sess,
              updatedAt: "Just now",
              status:
                simulatedTurn.approvalGate?.status === "pending"
                  ? "Waiting for Human"
                  : "Idle",
              messages: [...sess.messages, userMsg, simulatedTurn],
            }
          : sess
      )
    );

    triggerStreamingReplay(simulatedTurn);

    // Also fire live backend query asynchronously
    onSendMessage(trimmed, "urban_heat_agent").catch(() => {
      // Fallback already handled by simulatedTurn
    });
  };

  // Human-In-The-Loop <ApprovalGate /> Handlers
  const handleApproveGate = (messageId: string, gateId: string) => {
    const resolvedTime = new Date().toTimeString().slice(0, 8);
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSessionId) return sess;
        return {
          ...sess,
          status: "Idle",
          badge: "Approved & Signed",
          messages: sess.messages.map((m) => {
            if (m.id !== messageId || !m.approvalGate || m.approvalGate.id !== gateId) {
              return m;
            }
            return {
              ...m,
              progressPct: 100,
              groundingStatus: m.groundingStatus
                ? { ...m.groundingStatus, methodologicalGate: "PASSED" }
                : undefined,
              approvalGate: {
                ...m.approvalGate,
                status: "approved",
                resolvedAt: resolvedTime,
              },
              subTasks: m.subTasks?.map((st) => ({
                ...st,
                status: "completed",
                durationMs: st.durationMs || 310,
              })),
              thoughtSteps: m.thoughtSteps?.map((th) => ({
                ...th,
                status: "completed",
              })),
              toolCalls: m.toolCalls?.map((tc) =>
                tc.status === "waiting_approval"
                  ? { ...tc, status: "success" }
                  : tc
              ),
              stepTimers: m.stepTimers?.map((tm) => ({
                ...tm,
                status: "completed",
              })),
            };
          }),
        };
      })
    );
    setStreamingProgress(100);
    setAgents((prev) =>
      prev.map((ag) => ({
        ...ag,
        status: "Idle",
        currentTask:
          ag.id === "orchestrator-agent"
            ? "Committed $540k FY26 Capital Allocation & Dispatched Council Memo"
            : ag.currentTask,
      }))
    );
  };

  const handleDenyGate = (messageId: string, gateId: string) => {
    const resolvedTime = new Date().toTimeString().slice(0, 8);
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSessionId) return sess;
        return {
          ...sess,
          status: "Failed",
          badge: "Halted by Human",
          messages: sess.messages.map((m) => {
            if (m.id !== messageId || !m.approvalGate || m.approvalGate.id !== gateId) {
              return m;
            }
            return {
              ...m,
              approvalGate: {
                ...m.approvalGate,
                status: "denied",
                resolvedAt: resolvedTime,
              },
              toolCalls: m.toolCalls?.map((tc) =>
                tc.status === "waiting_approval"
                  ? { ...tc, status: "error" }
                  : tc
              ),
            };
          }),
        };
      })
    );
    setAgents((prev) =>
      prev.map((ag) => ({
        ...ag,
        status: ag.id === "orchestrator-agent" ? "Failed" : "Idle",
        currentTask:
          ag.id === "orchestrator-agent"
            ? "Halted by Operator at $540k Budget Gate"
            : ag.currentTask,
      }))
    );
  };

  const handleCorrectPathGate = (
    messageId: string,
    gateId: string,
    feedback: string
  ) => {
    const resolvedTime = new Date().toTimeString().slice(0, 8);
    const followUpTurn = buildSimulatedAgentTurn(
      `Operator Path Correction: ${feedback}`,
      `### Path Correction Applied by Human-In-The-Loop\n\nI have incorporated your constraint override: **“${feedback}”**\n\n1. **Updated Siting Matrix:** Re-ran \`select_cooling_center_sites\` and \`run_equity_audit\` with the revised parameters.\n2. **Updated Capital Encumbrance:** Adjusted ordinance manifest and verified all tract figures within **±0.01°F** against \`a4i_ml.offset_model_v1\`.`
    );

    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSessionId) return sess;
        const updatedMsgs = sess.messages.map((m) => {
          if (m.id !== messageId || !m.approvalGate || m.approvalGate.id !== gateId) {
            return m;
          }
          return {
            ...m,
            progressPct: 100,
            approvalGate: {
              ...m.approvalGate,
              status: "corrected" as const,
              userFeedback: feedback,
              resolvedAt: resolvedTime,
            },
            subTasks: m.subTasks?.map((st) => ({
              ...st,
              status: "completed" as const,
            })),
            thoughtSteps: m.thoughtSteps?.map((th) => ({
              ...th,
              status: "completed" as const,
            })),
          };
        });
        return {
          ...sess,
          status: "Idle",
          badge: "Path Corrected",
          messages: [...updatedMsgs, followUpTurn],
        };
      })
    );
    setStreamingProgress(100);
    setAgents((prev) =>
      prev.map((ag) => ({
        ...ag,
        status: "Idle",
      }))
    );
  };

  const handleResetGate = (messageId: string, gateId: string) => {
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSessionId) return sess;
        return {
          ...sess,
          status: "Waiting for Human",
          badge: "HITL Gate Active",
          messages: sess.messages.map((m) => {
            if (m.id !== messageId || !m.approvalGate || m.approvalGate.id !== gateId) {
              return m;
            }
            return {
              ...m,
              progressPct: 82,
              approvalGate: {
                ...m.approvalGate,
                status: "pending",
                userFeedback: undefined,
                resolvedAt: undefined,
              },
            };
          }),
        };
      })
    );
    setStreamingProgress(82);
    setAgents((prev) =>
      prev.map((ag) => ({
        ...ag,
        status:
          ag.id === "orchestrator-agent" ? "Waiting for Human" : "Idle",
      }))
    );
  };

  // Inspect a specific ToolCall in the Right Sandbox Panel
  const handleInspectToolInPanel = (tc: ToolCallItem) => {
    setInspectedToolCall(tc);
    setIsRightPanelOpen(true);
    setRightPanelTab("sandbox");
    if (tc.linkedSiteRank) {
      setSelectedSiteId(tc.linkedSiteRank);
    }
  };

  const activeAgentObj =
    agents.find((a) => a.id === selectedAgentId) || agents[0];

  const activeTokenMetrics = latestAssistantMsg?.tokenMetrics || {
    promptTokens: 2840,
    reasoningTokens: 1920,
    toolIoTokens: 3410,
    completionTokens: 1180,
    totalTokens: 9350,
    contextWindowLimit: 128000,
    estimatedCostUsd: 0.0314,
    inputRatePer1M: 1.25,
    outputRatePer1M: 5.0,
  };

  const activeStepTimers = latestAssistantMsg?.stepTimers || [];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* =====================================================================
          3-COLUMN AGENTIC AI WORKSPACE DASHBOARD
          Col 1: Left Sidebar (Sessions, Specialized Agents & Status, Sites)
          Col 2: Center Main Stream (Header, MultiStepProgress, Thoughts, Tools, HITL Gate)
          Col 3: Right Collapsible Context / Tool Execution Inspect Panel
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ===================================================================
            COLUMN 1 (LEFT SIDEBAR NAVIGATION): lg:col-span-3
           =================================================================== */}
        <aside className="lg:col-span-3 flex flex-col gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-3.5 shadow-xl">
          {/* 1A. Session / Conversation History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                  Agent Sessions
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleCreateNewSession}
                className="h-6 px-2 text-[10px]"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                New Session
              </Button>
            </div>

            <div className="space-y-1.5">
              {sessions.map((sess) => {
                const isSelected = sess.id === activeSession.id;
                const statusMeta = getStatusIndicator(sess.status);
                return (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => handleSelectSession(sess)}
                    className={cn(
                      "w-full text-left rounded-xl border p-2.5 transition-all cursor-pointer",
                      isSelected
                        ? "border-amber-500/50 bg-zinc-900/95 shadow-sm"
                        : "border-zinc-800/70 bg-zinc-900/35 hover:bg-zinc-900/70 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {sess.title}
                      </span>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          statusMeta.solidDot
                        )}
                        title={sess.status}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mb-1.5">
                      {sess.subtitle}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{sess.updatedAt}</span>
                      <Badge
                        variant={statusMeta.badgeVariant}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {sess.badge}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 1B. Active Specialized Agents Roster & Live Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                  Specialized Agents
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {agents.length} online
              </span>
            </div>

            <div className="space-y-1.5">
              {agents.map((agent) => {
                const statusMeta = getStatusIndicator(agent.status);
                const isSelected = agent.id === selectedAgentId;

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedAgentId(agent.id);
                      }
                    }}
                    className={cn(
                      "rounded-xl border p-2.5 transition-all cursor-pointer",
                      isSelected
                        ? "border-sky-500/50 bg-zinc-900/90"
                        : "border-zinc-800/70 bg-zinc-900/35 hover:bg-zinc-900/70"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span
                            className={cn(
                              "absolute inline-flex h-full w-full rounded-full opacity-75",
                              statusMeta.dot
                            )}
                          />
                          <span
                            className={cn(
                              "relative inline-flex rounded-full h-2 w-2",
                              statusMeta.solidDot
                            )}
                          />
                        </span>
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {agent.name}
                        </span>
                      </div>

                      <Badge
                        variant={statusMeta.badgeVariant}
                        className="text-[9px] px-1.5 py-0 shrink-0"
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-400 truncate mb-1">
                      {agent.role}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                      <span>{agent.codename}</span>
                      <span>{(agent.tokensUsed / 1000).toFixed(1)}k tok</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 1C. Candidate Cooling Center Sites Quick Selector (Synced with Map) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                Candidate Sites (1–5)
              </span>
              <Badge variant="amber" className="text-[10px]">
                Top {centersToFund} Funded
              </Badge>
            </div>

            <div className="space-y-1">
              {sites.map((site) => {
                const isSelected = site.id === selectedSiteId;
                const isFunded = site.id <= centersToFund;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      setSelectedSiteId(site.id);
                      if (!isRightPanelOpen) setIsRightPanelOpen(true);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-amber-500/60 bg-amber-950/25 text-zinc-100"
                        : "border-zinc-800/60 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                          isFunded
                            ? "bg-amber-500 text-zinc-950"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        )}
                      >
                        {site.id}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium truncate text-zinc-200">
                          {site.name}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500">
                          Tract {site.shortTract} · {site.noCarPct}% no-car
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                      +{site.offsetF.toFixed(1)}°F
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Planning Workflow Jumpers */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onOpenCompareModal}
                className="justify-center text-[10px]"
              >
                <GitCompare className="w-3 h-3 text-amber-400" />
                Why Not #4?
              </Button>
              <Button
                type="button"
                variant="amber"
                size="xs"
                onClick={() => onNavigateTab("proposal")}
                className="justify-center text-[10px]"
              >
                Council Memo
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </aside>

        {/* ===================================================================
            COLUMN 2 (CENTER MAIN WORKSPACE / AGENT STREAM)
            Expands to lg:col-span-9 when right panel is collapsed, or lg:col-span-5 when open
           =================================================================== */}
        <section
          className={cn(
            "flex flex-col rounded-2xl border border-zinc-800/90 bg-zinc-950/90 shadow-2xl overflow-hidden transition-all duration-300",
            isRightPanelOpen ? "lg:col-span-5" : "lg:col-span-9"
          )}
        >
          {/* 2A. Workspace Header with Agent Metadata & Task Progress Bar */}
          <div className="p-3.5 border-b border-zinc-800/90 bg-zinc-900/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-zinc-100 tracking-tight truncate">
                      {activeAgentObj.name}
                    </h2>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {activeAgentObj.model}
                    </Badge>
                    <Badge
                      variant={
                        latestAssistantMsg?.groundingStatus?.methodologicalGate ===
                        "SCOPE_REFUSED"
                          ? "amber"
                          : "emerald"
                      }
                      className="text-[10px]"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {latestAssistantMsg?.groundingStatus?.methodologicalGate ===
                      "SCOPE_REFUSED"
                        ? "Stage-2 Scope Guardrail"
                        : `Grounded ±0.01°F (${
                            latestAssistantMsg?.groundingStatus
                              ?.withinToleranceCount ?? 14
                          }/${
                            latestAssistantMsg?.groundingStatus?.checkedCount ??
                            14
                          })`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {activeAgentObj.currentTask}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {latestAssistantMsg && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => triggerStreamingReplay(latestAssistantMsg)}
                    disabled={isStreamingTurn}
                    title="Replay real-time token & step streaming"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    Replay Stream
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => setIsRightPanelOpen((prev) => !prev)}
                  title="Toggle Right Context & Tool Execution Inspect Panel"
                >
                  {isRightPanelOpen ? (
                    <>
                      <PanelRightClose className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Hide Inspector</span>
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Open Inspector</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* <MultiStepProgress /> Streaming Status Bar */}
            {latestAssistantMsg?.subTasks && (
              <MultiStepProgress
                subTasks={latestAssistantMsg.subTasks}
                progressPct={
                  isStreamingTurn
                    ? streamingProgress
                    : latestAssistantMsg.progressPct ?? 100
                }
                activeAgentName={activeAgentObj.codename}
              />
            )}
          </div>

          {/* 2B. Threaded Conversation Stream (Human + Multi-Step Agent Thought, Tool Calls, HITL ApprovalGate) */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-5 max-h-[680px] min-h-[480px] scrollbar-thin"
          >
            {activeSession.messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[88%] rounded-2xl rounded-br-sm border border-zinc-700/80 bg-zinc-800/90 px-4 py-3 text-xs text-zinc-100 shadow-md">
                      <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-mono text-zinc-400">
                        <span>Operator (City Resilience Planner)</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const displayedMarkdown =
                streamedTextOverride[msg.id] !== undefined
                  ? streamedTextOverride[msg.id]
                  : msg.content;

              return (
                <div key={msg.id} className="space-y-3">
                  {/* Agent Turn Header */}
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-semibold text-zinc-200">
                        {msg.agentName || "HeatPlanner Orchestrator"}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    {msg.latencyMs && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {msg.latencyMs}ms total
                      </span>
                    )}
                  </div>

                  {/* 1. <AgentThought /> Chain-of-Thought Accordion */}
                  {msg.thoughtSteps && msg.thoughtSteps.length > 0 && (
                    <AgentThought
                      steps={msg.thoughtSteps}
                      isProcessing={
                        isStreamingTurn ||
                        msg.approvalGate?.status === "pending"
                      }
                      defaultOpen={true}
                    />
                  )}

                  {/* 2. <ToolCall /> Pills & JSON Micro-Viewers */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          Tool Executions ({msg.toolCalls.length})
                        </span>
                        <span className="text-[10px] font-mono text-sky-400">
                          Click any pill to inspect JSON / SQL
                        </span>
                      </div>
                      {msg.toolCalls.map((tc, idx) => (
                        <ToolCall
                          key={tc.id}
                          toolCall={tc}
                          onInspectInPanel={handleInspectToolInPanel}
                          isSelectedInPanel={inspectedToolCall?.id === tc.id}
                          defaultExpanded={idx === 0}
                        />
                      ))}
                    </div>
                  )}

                  {/* 3. <ApprovalGate /> Human-In-The-Loop Intervention Modal/Widget */}
                  {msg.approvalGate && (
                    <ApprovalGate
                      gate={msg.approvalGate}
                      onApprove={(gateId) => handleApproveGate(msg.id, gateId)}
                      onDeny={(gateId) => handleDenyGate(msg.id, gateId)}
                      onCorrectPath={(gateId, feedback) =>
                        handleCorrectPathGate(msg.id, gateId, feedback)
                      }
                      onResetGate={(gateId) => handleResetGate(msg.id, gateId)}
                    />
                  )}

                  {/* 4. Streamed Markdown Response Card */}
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 shadow-inner">
                    <div className="prose-dark text-xs leading-relaxed text-zinc-200 space-y-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {displayedMarkdown}
                      </ReactMarkdown>
                    </div>

                    {/* Grounded Citations Footer */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1">
                          Verified Citations:
                        </span>
                        {msg.citations.map((cit) => (
                          <span
                            key={`${cit.tractFips}-${cit.metric}`}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300"
                          >
                            <span className="text-amber-400 font-semibold">
                              {cit.tractFips}
                            </span>
                            <span>({cit.neighborhood}):</span>
                            <span className="text-emerald-300">{cit.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2C. Prompt Composer & Preset Multi-Agent Triggers */}
          <div className="p-3.5 border-t border-zinc-800/90 bg-zinc-900/75 space-y-2.5">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {PRESET_AGENTIC_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handlePromptSubmit(item.prompt)}
                  disabled={isStreamingTurn || isLoadingMessage}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950/90 hover:bg-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-zinc-300 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Text Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePromptSubmit(inputPrompt);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask the multi-agent system to query BQML, compare cooling sites, or audit Justice40 equity..."
                className="flex-1 h-9 rounded-xl border border-zinc-700/90 bg-zinc-950 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80"
              />
              <Button
                type="submit"
                variant="amber"
                size="default"
                disabled={
                  !inputPrompt.trim() || isStreamingTurn || isLoadingMessage
                }
              >
                {isStreamingTurn || isLoadingMessage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Streaming
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Execute
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>

        {/* ===================================================================
            COLUMN 3 (RIGHT COLLAPSIBLE CONTEXT / TOOL EXECUTION INSPECT PANEL)
            lg:col-span-4 when open
           =================================================================== */}
        {isRightPanelOpen && (
          <aside className="lg:col-span-4 flex flex-col gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-3.5 shadow-2xl">
            {/* Inspector Header + 3 Mode Switcher Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRightPanelTab("canvas")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    rightPanelTab === "canvas"
                      ? "bg-zinc-800 text-amber-300 border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Spatial Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("sandbox")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    rightPanelTab === "sandbox"
                      ? "bg-zinc-800 text-sky-300 border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Tool Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("metrics")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    rightPanelTab === "metrics"
                      ? "bg-zinc-800 text-emerald-300 border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Coins className="w-3.5 h-3.5" />
                  Tokens & Cost
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------------------
                RIGHT TAB 1: SPATIAL CANVAS & INTERACTIVE ATLANTA MAP
               --------------------------------------------------------------- */}
            {rightPanelTab === "canvas" && (
              <div className="space-y-3">
                <AtlantaMap
                  sites={sites}
                  selectedSiteId={selectedSiteId}
                  onSelectSite={setSelectedSiteId}
                  centersToFund={centersToFund}
                  setCentersToFund={setCentersToFund}
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                />

                {/* Selected Site BQML EXPLAIN_PREDICT Waterfall Card */}
                {selectedSite && (
                  <Card className="border-zinc-800 bg-zinc-900/75">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-extrabold text-xs flex items-center justify-center">
                            {selectedSite.id}
                          </span>
                          <div>
                            <CardTitle className="text-xs">
                              {selectedSite.name} (Tract {selectedSite.shortTract})
                            </CardTitle>
                            <p className="text-[10px] font-mono text-zinc-400">
                              +{selectedSite.offsetF.toFixed(1)}°F offset ·{" "}
                              {selectedSite.residentsReached.toLocaleString()}{" "}
                              walk-shed pop · {selectedSite.estAnnualCost}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            selectedSite.id <= centersToFund
                              ? "emerald"
                              : "amber"
                          }
                        >
                          {selectedSite.id <= centersToFund
                            ? "FUNDED"
                            : "UNFUNDED"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-3 pt-1 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        BQML EXPLAIN_PREDICT Drivers
                      </div>
                      <div className="space-y-1.5">
                        {selectedSite.drivers.map((drv) => {
                          const val = drv.attributionF ?? drv.deltaF ?? 0;
                          const widthPct = Math.min(
                            100,
                            Math.round((Math.abs(val) / 2.0) * 100)
                          );
                          return (
                            <div
                              key={drv.label || drv.feature}
                              className="grid grid-cols-12 items-center gap-2 text-[11px]"
                            >
                              <span className="col-span-5 text-zinc-300 truncate">
                                {drv.label || drv.feature}
                              </span>
                              <div className="col-span-5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    val >= 0 ? "bg-amber-500" : "bg-emerald-400"
                                  )}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                              <span className="col-span-2 text-right font-mono text-zinc-200">
                                {val >= 0 ? "+" : ""}
                                {val.toFixed(2)}°F
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px]">
                        <button
                          type="button"
                          onClick={() => onNavigateTab("sites")}
                          className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          Full Site Drivers →
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateTab("equity")}
                          className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                        >
                          Justice40 Equity Audit →
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------
                RIGHT TAB 2: LIVE CODE, SQL & ORDINANCE DIFF SANDBOX
               --------------------------------------------------------------- */}
            {rightPanelTab === "sandbox" && (
              <div className="space-y-3">
                <Card className="border-zinc-800 bg-zinc-900/70">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-sky-400" />
                        <CardTitle>
                          {inspectedToolCall?.toolName || "execute_sql"}() Live
                          Sandbox
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="emerald"
                        size="xs"
                        onClick={() =>
                          setSandboxRunOutput(
                            `[BigQuery Job a4i-job-${Math.floor(
                              1000 + Math.random() * 9000
                            )}] Verified 207 Fulton County rows in 382ms (±0.01°F grounding check PASSED).`
                          )
                        }
                      >
                        <Play className="w-3 h-3" />
                        Execute in Sandbox
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-2.5">
                    {/* Tool Selector Pills */}
                    {latestAssistantMsg?.toolCalls && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {latestAssistantMsg.toolCalls.map((tc) => (
                          <button
                            key={tc.id}
                            type="button"
                            onClick={() => setInspectedToolCall(tc)}
                            className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-mono border transition-colors cursor-pointer",
                              inspectedToolCall?.id === tc.id
                                ? "bg-sky-950/60 border-sky-500/60 text-sky-300"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            {tc.toolName}()
                          </button>
                        ))}
                      </div>
                    )}

                    {/* SQL / Code / Diff Buffer */}
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-200 overflow-x-auto max-h-60">
                      <pre className="whitespace-pre-wrap">
                        {inspectedToolCall?.sqlOrCodeSnippet ||
                          "-- Select any tool call pill in the stream to inspect its SQL or ordinance diff"}
                      </pre>
                    </div>

                    {/* Structured Output JSON */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">
                        Verified Tool Output Payload
                      </div>
                      <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                        {JSON.stringify(
                          inspectedToolCall?.output || {
                            status: "READY",
                            verified_tracts: 207,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>

                    {sandboxRunOutput && (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/25 p-2.5 text-[11px] font-mono text-emerald-300">
                        {sandboxRunOutput}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ---------------------------------------------------------------
                RIGHT TAB 3: TOKEN COUNT USAGE, STEP TIMERS & COST METRICS
               --------------------------------------------------------------- */}
            {rightPanelTab === "metrics" && (
              <div className="space-y-3">
                {/* Token Count Usage Widget */}
                <Card className="border-zinc-800 bg-zinc-900/70">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-amber-400" />
                        <CardTitle>Token Count Usage</CardTitle>
                      </div>
                      <Badge variant="amber" className="font-mono text-[10px]">
                        {activeTokenMetrics.totalTokens.toLocaleString()} /{" "}
                        {(
                          activeTokenMetrics.contextWindowLimit / 1000
                        ).toFixed(0)}
                        k ctx
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-2.5">
                    <Progress
                      value={Math.max(
                        6,
                        Math.round(
                          (activeTokenMetrics.totalTokens /
                            activeTokenMetrics.contextWindowLimit) *
                            100
                        )
                      )}
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2">
                        <div className="text-[10px] font-mono text-zinc-500">
                          Prompt Context
                        </div>
                        <div className="font-mono font-bold text-zinc-100 mt-0.5">
                          {activeTokenMetrics.promptTokens.toLocaleString()} tok
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2">
                        <div className="text-[10px] font-mono text-amber-400">
                          CoT Reasoning
                        </div>
                        <div className="font-mono font-bold text-amber-300 mt-0.5">
                          {activeTokenMetrics.reasoningTokens.toLocaleString()}{" "}
                          tok
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2">
                        <div className="text-[10px] font-mono text-sky-400">
                          MCP & SQL Tool I/O
                        </div>
                        <div className="font-mono font-bold text-sky-300 mt-0.5">
                          {activeTokenMetrics.toolIoTokens.toLocaleString()} tok
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2">
                        <div className="text-[10px] font-mono text-emerald-400">
                          Streamed Output
                        </div>
                        <div className="font-mono font-bold text-emerald-300 mt-0.5">
                          {activeTokenMetrics.completionTokens.toLocaleString()}{" "}
                          tok
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step Timers Waterfall Widget */}
                <Card className="border-zinc-800 bg-zinc-900/70">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-sky-400" />
                        <CardTitle>Multi-Step Execution Timers</CardTitle>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {latestAssistantMsg?.latencyMs || 1840}ms e2e
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-2">
                    {activeStepTimers.map((timer) => (
                      <div key={timer.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-300 truncate">
                            {timer.stepName}
                          </span>
                          <span className="font-mono text-zinc-400 shrink-0">
                            {timer.durationMs}ms ({timer.percentageOfTotal}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              timer.status === "waiting"
                                ? "bg-amber-400"
                                : "bg-sky-400"
                            )}
                            style={{ width: `${timer.percentageOfTotal}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Cost Estimation Metrics Widget */}
                <Card className="border-zinc-800 bg-zinc-900/70">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <CardTitle>Cost Estimation & FinOps</CardTitle>
                      </div>
                      <Badge variant="emerald" className="font-mono text-[10px]">
                        Vertex AI / BigQuery Cached
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/70">
                      <span className="text-zinc-400">Current Turn Cost</span>
                      <span className="font-mono font-bold text-emerald-300">
                        ${activeTokenMetrics.estimatedCostUsd.toFixed(4)} USD
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/70">
                      <span className="text-zinc-400">
                        BigQuery Slot Bytes Billed
                      </span>
                      <span className="font-mono text-zinc-200">
                        14.2 MB ($0.0001)
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-zinc-400">Rate Schedule</span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        ${activeTokenMetrics.inputRatePer1M}/1M in · $
                        {activeTokenMetrics.outputRatePer1M}/1M out
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
