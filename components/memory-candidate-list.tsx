"use client";

import { useState } from "react";

export interface CandidateItem {
  id: string;
  category: string;
  key: string;
  value: string;
  reason: string | null;
  confidence: number;
}

export function MemoryCandidateList({ initialCandidates }: { initialCandidates: CandidateItem[] }) {
  const [candidates, setCandidates] = useState<CandidateItem[]>(initialCandidates);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/memory/candidates/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/memory/candidates/${id}/reject`, { method: "POST" });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (candidates.length === 0) {
    return (
      <p className="muted" style={{ margin: "10px 0" }}>
        No pending memory candidates. Historical facts require confidence & approval before becoming durable.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
      {candidates.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid var(--line)",
            padding: "12px",
            background: "#fff",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>[{c.category.toUpperCase()}] {c.key}</b>
            <span style={{ fontSize: "10px", color: "var(--gray)" }}>
              {Math.round(c.confidence * 100)}% CONFIDENCE
            </span>
          </div>

          <p style={{ margin: "6px 0", color: "#111" }}>{c.value}</p>
          {c.reason && (
            <small className="muted" style={{ display: "block", marginBottom: "8px" }}>
              Source: {c.reason}
            </small>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleApprove(c.id)}
              disabled={loadingId === c.id}
              style={{
                background: "#111",
                color: "#fff",
                border: "1px solid #111",
                padding: "4px 10px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              APPROVE TO PERMANENT MEMORY
            </button>
            <button
              onClick={() => handleReject(c.id)}
              disabled={loadingId === c.id}
              style={{
                background: "transparent",
                color: "#666",
                border: "1px solid #ccc",
                padding: "4px 10px",
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              DISMISS
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

