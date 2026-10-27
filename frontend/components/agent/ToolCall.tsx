"use client";

import React, { useState } from "react";
import {
  Database,
  Globe,
  Compass,
  Scale,
  FileCode2,
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { ToolCallItem, ToolCategory } from "@/src/lib/mock-agent-data";
import { Badge, Button, cn } from "@/components/ui/primitives";

export interface ToolCallProps {
  toolCall: ToolCallItem;
  onInspectInPanel?: (toolCall: ToolCallItem) => void;
  isSelectedInPanel?: boolean;
  defaultExpanded?: boolean;
}

function getToolMeta(toolName: ToolCategory) {
  switch (toolName) {
    case "execute_sql":
      return {
        icon: Database,
        label: "execute_sql",
        category: "BigQuery ML Engine",
        accent: "text-sky-400 bg-sky-500/10 border-sky-500/30",
      };
    case "fetch_webpage":
      return {
        icon: Globe,
        label: "fetch_webpage",
        category: "Spatial GIS & TIGER Scraper",
        accent: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      };
    case "explain_heat_offset":
      return {
        icon: Cpu,
        label: "explain_heat_offset",
        category: "ML.EXPLAIN_PREDICT Attribution",
        accent: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      };
    case "select_cooling_center_sites":
      return {
        icon: Compass,
        label: "select_cooling_center_sites",
        category: "1.5km Spatial Optimizer",
        accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      };
    case "run_equity_audit":
      return {
        icon: Scale,
        label: "run_equity_audit",
        category: "Justice40 & SVI Verifier",
        accent: "text-amber-300 bg-amber-500/10 border-amber-500/30",
      };
    case "compile_council_memo":
    default:
      return {
        icon: FileCode2,
        label: toolName,
        category: "Policy Artifact Compiler",
        accent: "text-zinc-300 bg-zinc-800 border-zinc-700",
      };
  }
}

export function ToolCall({
  toolCall,
  onInspectInPanel,
  isSelectedInPanel = false,
  defaultExpanded = false,
}: ToolCallProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<"params" | "output" | "code">("params");
  const [copied, setCopied] = useState(false);

  const meta = getToolMeta(toolCall.toolName);
  const IconComponent = meta.icon;

  const renderStatusBadge = () => {
    switch (toolCall.status) {
      case "success":
        return (
          <Badge variant="emerald" className="text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            200 OK · {toolCall.durationMs}ms
          </Badge>
        );
      case "running":
        return (
          <Badge variant="amber" className="text-[10px]">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            Executing...
          </Badge>
        );
      case "waiting_approval":
        return (
          <Badge variant="amber" className="text-[10px]">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            HITL Gate Pending
          </Badge>
        );
      case "error":
      default:
        return (
          <Badge variant="red" className="text-[10px]">
            <XCircle className="w-3 h-3 text-red-400" />
            Execution Failed
          </Badge>
        );
    }
  };

  const payloadString =
    activeTab === "params"
      ? JSON.stringify(toolCall.parameters, null, 2)
      : activeTab === "output"
      ? JSON.stringify(toolCall.output, null, 2)
      : toolCall.sqlOrCodeSnippet;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        isSelectedInPanel
          ? "border-sky-500/60 bg-zinc-900/90 shadow-[0_0_20px_-6px_rgba(56,189,248,0.3)]"
          : "border-zinc-800/90 bg-zinc-950/75 hover:border-zinc-700/80"
      )}
    >
      {/* Tool Pill Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 flex-wrap">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer select-none"
        >
          <div
            className={cn(
              "w-6 h-6 rounded-md border flex items-center justify-center shrink-0",
              meta.accent
            )}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono text-xs font-semibold text-zinc-100">
              {meta.label}()
            </span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              · {meta.category}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {toolCall.agentCodename}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {renderStatusBadge()}

          {onInspectInPanel && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onInspectInPanel(toolCall)}
              className="text-[10px] text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 px-2 h-6"
              title="Inspect live output in right panel"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden md:inline">Sandbox</span>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            aria-label="Toggle tool payload viewer"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Micro-Viewer Body */}
      {expanded && (
        <div className="border-t border-zinc-800/80 bg-zinc-950/95">
          {/* Viewer Sub-navigation */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800/60">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("params")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer",
                  activeTab === "params"
                    ? "bg-zinc-800 text-amber-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Input JSON Params
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("output")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer",
                  activeTab === "output"
                    ? "bg-zinc-800 text-emerald-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Output Payload
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer",
                  activeTab === "code"
                    ? "bg-zinc-800 text-sky-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                SQL / Trace
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Code-Highlighted JSON / SQL Micro-Viewer */}
          <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-56 text-zinc-200">
            <code>
              {payloadString.split("\n").map((line, i) => {
                // Lightweight syntax tinting for JSON keys/values and SQL keywords
                const isJsonKey = /^\s*"[^"]+":/.test(line);
                const isDiffAdd = line.startsWith("+");
                const isDiffDel = line.startsWith("-");
                return (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre",
                      isDiffAdd
                        ? "text-emerald-300 bg-emerald-950/25 px-1 rounded"
                        : isDiffDel
                        ? "text-red-300 bg-red-950/25 px-1 rounded"
                        : isJsonKey
                        ? "text-sky-300"
                        : "text-zinc-300"
                    )}
                  >
                    {line}
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
