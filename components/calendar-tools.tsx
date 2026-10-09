"use client";

import { useState } from "react";
import { ActionConfirmationCard } from "./action-card";

export function CalendarTools() {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reminder, setReminder] = useState("");
  const [when, setWhen] = useState("");
  const [message, setMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [stagedAction, setStagedAction] = useState<any>(null);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: reminder,
        triggerAt: new Date(when).toISOString(),
      }),
    });
    setMessage(r.ok ? "Reminder created." : "Reminder needs a title and time.");
    if (r.ok) {
      setReminder("");
      setTimeout(() => location.reload(), 500);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setMessage(`Synchronized ${data.syncedCount} events successfully.`);
        setTimeout(() => location.reload(), 800);
      } else {
        setMessage(data.error || "Calendar is disconnected.");
      }
    } catch {
      setMessage("Failed to reach calendar sync endpoint.");
    } finally {
      setSyncing(false);
    }
  }

  async function proposeEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Trigger agent to stage the calendar action
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Schedule event "${title}" from ${startTime} to ${endTime}`,
        }),
      });
      const data = await res.json();
      if (data.pendingConfirmations && data.pendingConfirmations.length > 0) {
        setStagedAction(data.pendingConfirmations[0]);
        setMessage("Event proposal staged. Review confirmation below.");
      } else {
        setMessage(data.message || "Proposal prepared.");
      }
    } catch {
      setMessage("Could not prepare event proposal.");
    }
  }

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <p className="eyebrow">TWO-WAY SYNCHRONIZATION</p>
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="notice-button"
          style={{ width: "100%", marginBottom: "10px" }}
        >
          {syncing ? "SYNCING GOOGLE CALENDAR…" : "SYNC CALENDAR NOW"}
        </button>
      </div>

      <form className="stack-form" onSubmit={addReminder} style={{ marginBottom: "20px" }}>
        <p className="eyebrow">INTERNAL REMINDER</p>
        <label>
          REMIND ME
          <input
            required
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            placeholder="e.g. Submit GT2 report"
          />
        </label>
        <label>
          WHEN
          <input
            required
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </label>
        <button>CREATE REMINDER</button>
      </form>

      <form className="stack-form" onSubmit={proposeEvent}>
        <p className="eyebrow">STAGE GOOGLE CALENDAR EVENT</p>
        <label>
          EVENT TITLE
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. GT2 Project Review"
          />
        </label>
        <label>
          START TIME
          <input
            required
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label>
          END TIME
          <input
            required
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
        <button>STAGE FOR CONFIRMATION</button>
      </form>

      {stagedAction && (
        <div style={{ marginTop: "16px" }}>
          <ActionConfirmationCard
            {...stagedAction}
            onResolved={() => {
              setStagedAction(null);
              setTimeout(() => location.reload(), 1000);
            }}
          />
        </div>
      )}

      {message && (
        <div className="event-notice" style={{ marginTop: "12px" }}>
          <b>STATUS</b>
          {message}
        </div>
      )}
    </>
  );
}
