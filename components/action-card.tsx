"use client";

import { useState } from "react";

export interface PendingActionProps {
  actionRequestId: string;
  toolName: string;
  actionType: string;
  target?: any;
  before?: any;
  proposedAfter?: any;
  consequence: string;
  createdAt?: string;
  onResolved?: () => void;
}

export function ActionConfirmationCard({
  actionRequestId,
  toolName,
  actionType,
  before,
  proposedAfter,
  consequence,
  onResolved,
}: PendingActionProps) {
  const [loading, setLoading] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<"PENDING" | "CONFIRMED" | "REJECTED">("PENDING");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/actions/${actionRequestId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");
      setResolvedStatus("CONFIRMED");
      onResolved?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/actions/${actionRequestId}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");
      setResolvedStatus("REJECTED");
      onResolved?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (resolvedStatus === "CONFIRMED") {
    return (
      <div className="border border-green-800 bg-neutral-950 p-4 rounded text-xs text-green-400 font-mono my-3">
        <p className="font-bold">✓ ACTION EXECUTED & COMMITTED</p>
        <p className="text-neutral-400 mt-1">{consequence}</p>
      </div>
    );
  }

  if (resolvedStatus === "REJECTED") {
    return (
      <div className="border border-neutral-800 bg-neutral-950 p-4 rounded text-xs text-neutral-400 font-mono my-3">
        <p className="font-bold text-neutral-500">✕ ACTION REJECTED & CANCELLED</p>
        <p className="text-neutral-500 mt-1">No external changes were made.</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-amber-600/70 bg-neutral-950 p-4 rounded my-3 text-xs font-mono shadow-lg text-neutral-200">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="text-amber-500 font-bold uppercase tracking-wider">
          ⚠ EXTERNAL ACTION REQUIRING CONFIRMATION
        </span>
        <span className="text-neutral-500">{actionType}</span>
      </div>

      <div className="my-3 space-y-2">
        <p className="text-neutral-300 font-medium">{consequence}</p>

        {before && (
          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 text-neutral-400">
            <span className="text-neutral-500 text-[10px] uppercase font-bold block mb-1">
              CURRENT STATE
            </span>
            <pre className="text-[11px] whitespace-pre-wrap">
              {JSON.stringify(before, null, 2)}
            </pre>
          </div>
        )}

        {proposedAfter && (
          <div className="bg-neutral-900/80 p-2 rounded border border-amber-900/40 text-neutral-300">
            <span className="text-amber-400 text-[10px] uppercase font-bold block mb-1">
              PROPOSED STATE
            </span>
            <pre className="text-[11px] whitespace-pre-wrap">
              {JSON.stringify(proposedAfter, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 my-2">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-neutral-100 hover:bg-white text-black font-bold px-4 py-1.5 rounded transition disabled:opacity-50"
        >
          {loading ? "EXECUTING…" : "CONFIRM & EXECUTE"}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-1.5 rounded transition disabled:opacity-50"
        >
          REJECT
        </button>
      </div>
    </div>
  );
}

