"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XOctagon,
  MessageSquareWarning,
  Lock,
  DollarSign,
  MapPin,
  Send,
  RotateCcw,
} from "lucide-react";
import { ApprovalGateState } from "@/src/lib/mock-agent-data";
import { Badge, Button, cn } from "@/components/ui/primitives";

export interface ApprovalGateProps {
  gate: ApprovalGateState;
  onApprove: (gateId: string) => void;
  onDeny: (gateId: string) => void;
  onCorrectPath: (gateId: string, feedback: string) => void;
  onResetGate?: (gateId: string) => void;
}

export function ApprovalGate({
  gate,
  onApprove,
  onDeny,
  onCorrectPath,
  onResetGate,
}: ApprovalGateProps) {
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState(
    "Re-allocate Site #3 to Adair Park (Tract 13121006802) and cap unit cost at $165,000."
  );

  const isPending = gate.status === "pending";

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    onCorrectPath(gate.id, feedbackText.trim());
    setShowCorrectionInput(false);
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        isPending
          ? "border-amber-500/60 bg-gradient-to-br from-amber-950/35 via-zinc-900/95 to-red-950/25 shadow-[0_0_30px_-8px_rgba(245,158,11,0.35)]"
          : gate.status === "approved"
          ? "border-emerald-500/45 bg-emerald-950/20"
          : gate.status === "corrected"
          ? "border-sky-500/45 bg-sky-950/20"
          : "border-red-500/45 bg-red-950/20"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
              isPending
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse"
                : gate.status === "approved"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : gate.status === "corrected"
                ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                : "bg-red-500/20 border-red-500/50 text-red-300"
            )}
          >
            {isPending ? (
              <ShieldAlert className="w-4 h-4" />
            ) : gate.status === "approved" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : gate.status === "corrected" ? (
              <MessageSquareWarning className="w-4 h-4" />
            ) : (
              <XOctagon className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                {gate.title}
              </span>
              <Badge
                variant={
                  isPending
                    ? "amber"
                    : gate.status === "approved"
                    ? "emerald"
                    : gate.status === "corrected"
                    ? "blue"
                    : "red"
                }
              >
                {isPending
                  ? "STREAM BLOCKED · AWAITING HUMAN"
                  : gate.status === "approved"
                  ? "APPROVED BY OPERATOR"
                  : gate.status === "corrected"
                  ? "PATH CORRECTED"
                  : "DENIED & HALTED"}
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Action: {gate.actionType} · Agent: {gate.agentName}
            </p>
          </div>
        </div>

        {!isPending && onResetGate && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onResetGate(gate.id)}
            className="text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Gate
          </Button>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-300 leading-relaxed mb-3">
        {gate.summary}
      </p>

      {/* Metadata Grid: Budget + Tracts + Scopes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3.5">
        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 mb-1">
            <DollarSign className="w-3 h-3 text-amber-400" />
            Capital Encumbrance
          </div>
          <div className="text-xs font-bold font-mono text-amber-300">
            {gate.budgetImpact}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 mb-1">
            <MapPin className="w-3 h-3 text-sky-400" />
            Target Census Tracts
          </div>
          <div className="flex flex-wrap gap-1">
            {gate.affectedTracts.map((tract) => (
              <span
                key={tract}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
              >
                {tract}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-zinc-400 mb-1">
            <Lock className="w-3 h-3 text-purple-400" />
            Privileged Scopes
          </div>
          <div className="space-y-0.5">
            {gate.permissionsRequested.map((perm) => (
              <div
                key={perm}
                className="text-[10px] font-mono text-zinc-300 truncate"
              >
                • {perm}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons when Pending */}
      {isPending ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="emerald"
              size="sm"
              onClick={() => onApprove(gate.id)}
              className="font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Step
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeny(gate.id)}
              className="font-semibold"
            >
              <XOctagon className="w-3.5 h-3.5" />
              Deny & Stop
            </Button>

            <Button
              type="button"
              variant="amber"
              size="sm"
              onClick={() => setShowCorrectionInput((prev) => !prev)}
              className="font-semibold"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              Correct Path (provide feedback text input)
            </Button>
          </div>

          {/* Inline Feedback Input for "Correct Path" */}
          {showCorrectionInput && (
            <form
              onSubmit={handleCorrectionSubmit}
              className="rounded-lg border border-amber-500/40 bg-zinc-950/90 p-3 space-y-2"
            >
              <label className="block text-[11px] font-medium text-amber-200">
                Operator Path Correction Instructions (reroutes multi-agent planner):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter constraint override, budget adjustment, or tract substitution..."
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <Button type="submit" variant="amber" size="sm">
                  <Send className="w-3.5 h-3.5" />
                  Apply & Resume
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/75 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-zinc-300">
            {gate.status === "approved" && (
              <span>
                <strong className="text-emerald-300">Step Approved:</strong>{" "}
                $540,000 FY26 capital commitment locked and City Council ordinance packet dispatched.
              </span>
            )}
            {gate.status === "denied" && (
              <span>
                <strong className="text-red-300">Step Denied & Stopped:</strong>{" "}
                Agent stream terminated prior to budget encumbrance. No external mutations committed.
              </span>
            )}
            {gate.status === "corrected" && (
              <span>
                <strong className="text-sky-300">Path Corrected by Human:</strong>{" "}
                &ldquo;{gate.userFeedback}&rdquo;
              </span>
            )}
          </div>
          {gate.resolvedAt && (
            <span className="text-[10px] font-mono text-zinc-500">
              Resolved at {gate.resolvedAt}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
