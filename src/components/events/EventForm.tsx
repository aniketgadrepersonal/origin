"use client";

import { useState, useRef } from "react";
import type { EventResponse } from "@/types";
import { Button } from "@/components/ui";

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
      <div>
        <label style={labelStyle}>Title</label>
        <input style={inputStyle} type="text" placeholder="Event title" value={form.title} onChange={set("title")} required maxLength={200} autoFocus />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px", lineHeight: 1.5 }}
          placeholder="Describe the event" value={form.description} onChange={set("description")} required />
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
