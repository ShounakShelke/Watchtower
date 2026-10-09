"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect, useRef } from "react";
import { ActionConfirmationCard } from "@/components/action-card";

interface ToolTrace {
  toolName: string;
  label: string;
  status: "executing" | "completed" | "needs_confirmation" | "failed";
}

interface PendingConfirmation {
  actionRequestId: string;
  toolName: string;
  actionType: string;
  target?: any;
  before?: any;
  proposedAfter?: any;
  consequence: string;
  createdAt?: string;
}

interface Recommendation {
  id?: string;
  title: string;
  project: string;
  priority: string;
  reason: string;
  estimatedMinutes?: number | null;
}

interface Alternative {
  id?: string;
  title: string;
  project: string;
  priority: string;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  toolTraces?: ToolTrace[];
  pendingConfirmations?: PendingConfirmation[];
  recommendation?: Recommendation;
  alternatives?: Alternative[];
}

export default function Agent() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((d) => setCalendarConnected(Boolean(d.connected)))
      .catch(() => setCalendarConnected(false));
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function submit(e?: FormEvent) {
    if (e) e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setHistory((h) => [...h, { role: "user", content: prompt }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, sessionId }),
      });

      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);

      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: data.message || data.answer || "Request executed.",
          toolTraces: data.toolTraces || [],
          pendingConfirmations: data.pendingConfirmations || [],
          recommendation: data.recommendation,
          alternatives: data.alternatives,
        },
      ]);
    } catch {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "Watchtower was unable to reach the orchestration service. Please verify server logs.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function runSuggestion(text: string) {
    setInput(text);
  }

  return (
    <main className="terminal-page">
      <Link className="back" href="/">
        ← COMMAND CENTER
      </Link>
      <header>
        <p className="eyebrow">WATCHTOWER V2 AGENT</p>
        <h1>AUTONOMOUS CONTEXT ENGINE.</h1>
        <div className="terminal-status">
          ● SYSTEM ONLINE　{calendarConnected ? "● CALENDAR CONNECTED" : "○ CALENDAR DISCONNECTED"}　● PROJECT STATE LOADED　● MEMORY READY
        </div>
      </header>

      <section className="terminal">
        <div className="boot">
          WATCHTOWER V2 / ORCHESTRATION LAYER<br />
          Deterministic priority authoritative · Internal actions execute immediately · External mutations staged for confirmation.
        </div>

        {history.map((turn, i) => (
          <article key={i}>
            {turn.role === "user" ? (
              <p style={{ color: "#eee", fontWeight: 600 }}>
                <span style={{ color: "#888", marginRight: 8 }}>›</span>
                {turn.content}
              </p>
            ) : (
              <div>
                {turn.toolTraces && turn.toolTraces.length > 0 && (
                  <div style={{ margin: "10px 0", display: "grid", gap: "4px" }}>
                    {turn.toolTraces.map((trace, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "11px",
                          color: trace.status === "failed" ? "#f87171" : trace.status === "needs_confirmation" ? "#fbbf24" : "#4ade80",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        {trace.status === "needs_confirmation"
                          ? "⚠ "
                          : trace.status === "failed"
                          ? "✕ "
                          : "◉ "}
                        {trace.label}
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{turn.content}</p>

                {turn.pendingConfirmations && turn.pendingConfirmations.length > 0 && (
                  <div>
                    {turn.pendingConfirmations.map((conf) => (
                      <ActionConfirmationCard key={conf.actionRequestId} {...conf} />
                    ))}
                  </div>
                )}

                {turn.recommendation && (
                  <div className="result">
                    <b>{turn.recommendation.title}</b>
                    <span>
                      {turn.recommendation.project} · {turn.recommendation.priority}
                    </span>
                    <small>{turn.recommendation.reason}</small>
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <Link
                        href={`/focus`}
                        style={{
                          background: "#fff",
                          color: "#000",
                          padding: "5px 12px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        START FOCUS
                      </Link>
                    </div>
                  </div>
                )}

                {turn.alternatives && turn.alternatives.length > 0 && (
                  <div className="alternatives" style={{ marginTop: 12 }}>
                    <span style={{ fontSize: "10px", color: "#888", display: "block", width: "100%" }}>
                      VALID ALTERNATIVES:
                    </span>
                    {turn.alternatives.map((alt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(`Switch focus to ${alt.title}`);
                        }}
                      >
                        {alt.title} <small>{alt.project}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}

        {loading && (
          <p className="loading">
            ◉ REASONING OVER LIVE STATE & CONSTRAINTS…
          </p>
        )}

        <div ref={terminalEndRef} />

        <form onSubmit={submit}>
          <span>›</span>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="what should i work on now? or plan my day"
          />
          <button disabled={loading}>RUN</button>
        </form>
      </section>

      <div className="suggestions">
        {[
          "Plan my day",
          "What should I work on now?",
          "I only have 1 hour",
          "Move my ML class to tomorrow",
          "I'm tired",
          "What did I decide about MedLMP?",
        ].map((s) => (
          <button key={s} onClick={() => runSuggestion(s)}>
            {s}
          </button>
        ))}
      </div>
    </main>
  );
}
