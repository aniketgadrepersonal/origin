"use client";

import { useState } from "react";
import type { EventResponse } from "@/types";
import { Button, Badge } from "@/components/ui";
import { useRegistrations } from "@/hooks/useRegistrations";

interface RegisterPanelProps {
  event: EventResponse;
  mode: "register" | "unregister";
  onSuccess: () => void;
  onCancel: () => void;
}

export function RegisterPanel({ event, mode, onSuccess, onCancel }: RegisterPanelProps) {
  const [userId, setUserId] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { register, unregister } = useRegistrations();

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "14px",
    color: "var(--text-primary)", transition: "border-color var(--transition)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: 500,
    color: "var(--text-primary)", marginBottom: "6px",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let result: { success: boolean; registrationId?: string; error?: string };

    if (mode === "register") {
      if (!userId.trim()) { setError("Please enter a user ID."); setSubmitting(false); return; }
      result = await register(event.id, userId.trim());
      if (result.success && result.registrationId) {
        setConfirmedId(result.registrationId);
        setSubmitting(false);
        return;
      }
    } else {
      if (!registrationId.trim()) { setError("Please enter a registration ID."); setSubmitting(false); return; }
      result = await unregister(registrationId.trim());
    }

    if (!result.success) setError(result.error ?? "Operation failed.");
    else onSuccess();
    setSubmitting(false);
  };

  const handleCopy = () => {
    if (!confirmedId) return;
    navigator.clipboard.writeText(confirmedId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (confirmedId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500 }}>{event.title}</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <Badge variant="green">Registered</Badge>
        </div>

        <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#15803d", marginBottom: "8px" }}>
            Registration confirmed
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>
            Save your registration ID — you&apos;ll need it to unregister.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #bbf7d0", borderRadius: "var(--radius-md)", padding: "8px 10px" }}>
            <code style={{ flex: 1, fontSize: "12px", color: "var(--text-primary)", wordBreak: "break-all", fontFamily: "monospace" }}>
              {confirmedId}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              style={{ flexShrink: 0, fontSize: "12px", fontWeight: 500, padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid #bbf7d0", background: copied ? "#dcfce7" : "#fff", color: copied ? "#15803d" : "var(--text-secondary)", cursor: "pointer", transition: "all var(--transition)" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" type="button" onClick={onSuccess}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Event summary */}
      <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 500 }}>{event.title}</p>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <Badge variant="blue">{event.availableSpots} spots left</Badge>
      </div>

      {mode === "register" ? (
        <div>
          <label style={labelStyle}>User ID</label>
          <input style={inputStyle} type="text" placeholder="e.g. user-123 or email" value={userId}
            onChange={e => setUserId(e.target.value)} required autoFocus />
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px" }}>Any unique identifier for the attendee.</p>
        </div>
      ) : (
        <div>
          <label style={labelStyle}>Registration ID</label>
          <input style={inputStyle} type="text" placeholder="e.g. registration-uuid" value={registrationId}
            onChange={e => setRegistrationId(e.target.value)} required autoFocus />
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px" }}>The ID returned when the user registered.</p>
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--danger-subtle)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant={mode === "unregister" ? "danger" : "primary"} type="submit" loading={submitting}>
          {mode === "register" ? "Confirm registration" : "Confirm unregister"}
        </Button>
      </div>
    </form>
  );
}
