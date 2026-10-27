"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { SubTaskItem } from "@/src/lib/mock-agent-data";
import { Progress, cn } from "@/components/ui/primitives";

export interface MultiStepProgressProps {
  subTasks: SubTaskItem[];
  progressPct: number;
  activeAgentName?: string;
}

export function MultiStepProgress({
  subTasks,
  progressPct,
  activeAgentName,
}: MultiStepProgressProps) {
  if (!subTasks || subTasks.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/75 px-3.5 py-2.5 space-y-2 backdrop-blur-sm">
      {/* Top Progress Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Multi-Step Pipeline Execution
          </span>
          {activeAgentName && (
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 border border-sky-800/60 px-1.5 py-0.5 rounded">
              {activeAgentName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-300">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPct} />

      {/* Granular Sub-Task Pipeline: ✓ [Completed] -> ◌ [Current] -> ⏳ [Scheduled] */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
        {subTasks.map((task, idx) => {
          const isCompleted = task.status === "completed";
          const isCurrent = task.status === "current";
          const isLast = idx === subTasks.length - 1;

          return (
            <React.Fragment key={task.id}>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono shrink-0 transition-all",
                  isCompleted
                    ? "bg-emerald-950/35 border-emerald-800/60 text-emerald-300"
                    : isCurrent
                    ? "bg-amber-950/45 border-amber-500/60 text-amber-200 shadow-[0_0_12px_-3px_rgba(245,158,11,0.4)]"
                    : "bg-zinc-950/70 border-zinc-800 text-zinc-500"
                )}
              >
                {isCompleted && (
                  <span className="text-emerald-400 font-bold" aria-hidden="true">
                    ✓
                  </span>
                )}
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    ◌
                  </span>
                )}
                {!isCompleted && !isCurrent && (
                  <span className="text-zinc-500" aria-hidden="true">
                    ⏳
                  </span>
                )}

                <span>[{task.label}]</span>

                {task.durationMs && (
                  <span className="text-[9px] text-zinc-400 ml-0.5">
                    {task.durationMs}ms
                  </span>
                )}
              </div>

              {!isLast && (
                <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
