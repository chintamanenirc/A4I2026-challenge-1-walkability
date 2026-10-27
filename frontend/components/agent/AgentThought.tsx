"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { ThoughtStep } from "@/src/lib/mock-agent-data";
import { Badge, cn } from "@/components/ui/primitives";

export interface AgentThoughtProps {
  steps: ThoughtStep[];
  isProcessing?: boolean;
  defaultOpen?: boolean;
}

export function AgentThought({
  steps,
  isProcessing = false,
  defaultOpen = true,
}: AgentThoughtProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!steps || steps.length === 0) return null;

  const hasActiveStep =
    isProcessing || steps.some((step) => step.status === "processing");
  const totalDurationMs = steps.reduce((acc, s) => acc + (s.durationMs || 0), 0);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 overflow-hidden",
        hasActiveStep
          ? "border-amber-500/45 bg-gradient-to-r from-amber-950/25 via-zinc-900/90 to-sky-950/25 shadow-[0_0_24px_-6px_rgba(245,158,11,0.3)]"
          : "border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700/80"
      )}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left select-none cursor-pointer hover:bg-zinc-800/35 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border",
              hasActiveStep
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-zinc-800/90 border-zinc-700/80 text-sky-400"
            )}
          >
            {hasActiveStep ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-semibold text-zinc-100 tracking-tight">
              Chain of Thought Reasoning
            </span>
            <Badge
              variant={hasActiveStep ? "amber" : "blue"}
              className="text-[10px] font-mono"
            >
              {hasActiveStep ? (
                <>
                  <Sparkles className="w-2.5 h-2.5" />
                  Reasoning Active
                </>
              ) : (
                `${steps.length} steps verified`
              )}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
            <Clock className="w-3 h-3 text-zinc-500" />
            {totalDurationMs}ms
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-800/70 space-y-2.5">
          {steps.map((step, idx) => {
            const isStepActive = step.status === "processing";
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.id} className="relative pl-5">
                {/* Vertical connector line */}
                {!isLast && (
                  <div className="absolute left-[7px] top-5 bottom-[-10px] w-[1px] bg-zinc-800" />
                )}

                {/* Step status node */}
                <div className="absolute left-0 top-1">
                  {isStepActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                <div
                  className={cn(
                    "rounded-lg border p-2.5 transition-colors",
                    isStepActive
                      ? "border-amber-500/35 bg-amber-950/15"
                      : "border-zinc-800/70 bg-zinc-950/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        Step {step.index}
                      </span>
                      <span className="text-xs font-medium text-zinc-200">
                        {step.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-sky-300">
                        {step.agentCodename}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {step.durationMs}ms
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
