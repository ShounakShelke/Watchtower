import React from "react";
import { PlanItemType, Priority } from "@/lib/types";

export interface PlanViewProps {
  plan: {
    id: string;
    summary: string | null;
    items: {
      id: string;
      title: string;
      type: PlanItemType;
      startAt: string | null;
      endAt: string | null;
      durationMinutes: number | null;
      priority: Priority;
      rationale: string | null;
      status: string;
    }[];
  } | null;
}

export function PlanView({ plan }: PlanViewProps) {
  if (!plan || plan.items.length === 0) {
    return (
      <div className="panel">
        <p className="eyebrow">TODAY&apos;S DAILY PLAN</p>
        <p className="muted">No active plan generated yet for today.</p>
        <a href="/agent" className="under">
          ASK AGENT TO PLAN MY DAY →
        </a>
      </div>
    );
  }

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p className="eyebrow">TODAY&apos;S DAILY PLAN</p>
        <span style={{ fontSize: "10px", color: "var(--gray)" }}>{plan.items.length} BLOCKS</span>
      </div>
      <p style={{ fontSize: "13px", fontWeight: 600, margin: "6px 0 14px" }}>
        {plan.summary || "Daily execution schedule"}
      </p>

      <div style={{ display: "grid", gap: "8px" }}>
        {plan.items.map((item, idx) => {
          let badgeColor = "#555";
          if (item.type === "FIXED") badgeColor = "#2563eb";
          if (item.type === "RECOMMENDED") badgeColor = "#16a34a";
          if (item.type === "BUFFER") badgeColor = "#d97706";
          if (item.type === "REST") badgeColor = "#9333ea";

          return (
            <div
              key={item.id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderTop: "1px solid var(--line)",
                paddingTop: "8px",
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "2px 6px",
                  background: badgeColor,
                  color: "#fff",
                  borderRadius: "2px",
                  minWidth: "60px",
                  textAlign: "center",
                }}
              >
                {item.type}
              </span>

              <div style={{ flex: 1 }}>
                <b>{item.title}</b>
                {item.rationale && (
                  <small style={{ display: "block", color: "var(--gray)", fontSize: "10px" }}>
                    {item.rationale}
                  </small>
                )}
              </div>

              {item.durationMinutes && (
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--gray)" }}>
                  {item.durationMinutes}m
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

