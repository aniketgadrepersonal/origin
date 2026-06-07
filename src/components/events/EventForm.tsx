"use client";

import { useState, useRef } from "react";
import type { EventResponse } from "@/types";
import { Button, Spinner } from "@/components/ui";

interface EventFormProps {
  initial?: EventResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  mode?: "create" | "edit";
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, onSubmit, onCancel, mode = "create" }: EventFormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date ? toLocalDatetime(initial.date) : "",
    maxCapacity: initial?.maxCapacity?.toString() ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParseError, setAiParseError] = useState<string | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date ? new Date(form.date).toISOString() : "",
      maxCapacity: parseInt(form.maxCapacity, 10),
    });
    if (!result.success) setError(result.error ?? "Something went wrong.");
    setSubmitting(false);
  };

  const handleAIParse = async () => {
    if (!aiPrompt.trim()) return;
    setAiParsing(true);
    setAiParseError(null);
    try {
      const res = await fetch("/api/ai/parse-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const json = await res.json();
      if (!json.success) {
        setAiParseError(json.error ?? "Failed to parse event.");
      } else {
        const { title, description, date, maxCapacity } = json.data;
        setForm({
          title: title ?? "",
          description: description ?? "",
          date: date ? toLocalDatetime(date) : "",
          maxCapacity: String(Math.min(50, Math.max(1, maxCapacity ?? 20))),
        });
        setAiPrompt("");
      }
    } catch {
      setAiParseError("Network error. Please try again.");
    }
    setAiParsing(false);
  };

  const handleGenerateDescription = async () => {
    if (!form.title.trim()) return;
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title }),
      });
      const json = await res.json();
      if (json.success) {
        setForm(f => ({ ...f, description: json.data.description }));
      }
    } catch {
      // silently fail — user can still type manually
    }
    setGeneratingDesc(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "14px",
    color: "var(--text-primary)", transition: "border-color var(--transition)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: 500,
    color: "var(--text-primary)", marginBottom: "6px",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* AI natural language input — create mode only */}
      {mode === "create" && (
        <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--accent-subtle)", border: "1px solid var(--accent-border)" }}>
          <label style={{ ...labelStyle, color: "var(--accent)", marginBottom: "8px" }}>
            ✦ Create with AI
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type="text"
              placeholder='e.g. "team lunch next Friday at noon for 15 people"'
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAIParse(); } }}
            />
            <Button
              variant="primary"
              type="button"
              size="sm"
              onClick={handleAIParse}
              disabled={!aiPrompt.trim() || aiParsing}
              loading={aiParsing}
            >
              Fill form
            </Button>
          </div>
          {aiParseError && (
            <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "6px" }}>{aiParseError}</p>
          )}
          <p style={{ fontSize: "12px", color: "var(--accent)", marginTop: "6px", opacity: 0.8 }}>
            Describe your event and AI will fill in the fields below. You can edit them before creating.
          </p>
        </div>
      )}

      <div>
        <label style={labelStyle}>Title</label>
        <input style={inputStyle} type="text" placeholder="Event title" value={form.title} onChange={set("title")} required maxLength={200} autoFocus={mode === "edit"} />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={!form.title.trim() || generatingDesc}
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              fontSize: "12px", fontWeight: 500, padding: "2px 8px",
              borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-border)",
              background: "var(--accent-subtle)", color: "var(--accent)",
              cursor: !form.title.trim() || generatingDesc ? "not-allowed" : "pointer",
              opacity: !form.title.trim() ? 0.5 : 1,
              transition: "all var(--transition)",
            }}
          >
            {generatingDesc ? <Spinner size={10} /> : "✦"} Generate
          </button>
        </div>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: "80px", lineHeight: 1.5 }}
          placeholder="Describe the event"
          value={form.description}
          onChange={set("description")}
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelStyle}>Date & time</label>
          <div style={{ position: "relative" }}>
            <input
              ref={dateInputRef}
              style={{ ...inputStyle, cursor: "pointer", caretColor: "transparent" }}
              type="datetime-local"
              value={form.date}
              onChange={set("date")}
              onKeyDown={(e) => e.preventDefault()}
              onClick={() => dateInputRef.current?.showPicker?.()}
              required
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Max capacity <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(max 50)</span></label>
          <input style={inputStyle} type="number" placeholder="50" min={1} max={50} step={1} value={form.maxCapacity} onChange={set("maxCapacity")} required />
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--danger-subtle)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={submitting}>
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
