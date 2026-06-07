"use client";

import { useState, useEffect } from "react";
import type { Registration, EventResponse } from "@/types";
import { Spinner } from "@/components/ui";

interface RegistrationsModalProps {
  event: EventResponse;
}

export function RegistrationsModal({ event }: RegistrationsModalProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/events/${event.id}/registrations`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setRegistrations(json.data);
        else setError(json.error ?? "Failed to load registrations.");
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [event.id]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <Spinner size={20} color="var(--accent)" />
    </div>
  );

  if (error) return (
    <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--danger-subtle)", color: "var(--danger)", fontSize: "13px" }}>{error}</div>
  );

  if (registrations.length === 0) return (
    <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>No registrations yet.</p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
        {registrations.length} of {event.maxCapacity} spots filled
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr auto", gap: "12px", padding: "10px 14px", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
          {["Name", "Email", "About me", "Registered"].map(h => (
            <span key={h} style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {registrations.map((r, i) => (
          <div key={r.id} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr auto", gap: "12px",
            padding: "12px 14px", borderBottom: i < registrations.length - 1 ? "1px solid var(--border)" : "none",
            alignItems: "start",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", wordBreak: "break-all" }}>{r.email}</span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: r.aboutMe ? "normal" : "italic" }}>
              {r.aboutMe || "—"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {new Date(r.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
