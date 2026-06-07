"use client";

import { useState } from "react";
import type { EventResponse, UpdateEventInput } from "@/types";
import { Badge, Button, Modal, Toast } from "@/components/ui";
import { EventForm } from "./EventForm";
import { RegisterPanel } from "./RegisterPanel";
import { RegistrationsModal } from "@/components/admin/RegistrationsModal";

interface EventCardProps {
  event: EventResponse;
  isAdmin?: boolean;
  onUpdate: (id: string, data: UpdateEventInput) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
  style?: React.CSSProperties;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    isPast: d.getTime() < Date.now(),
  };
}

export function EventCard({ event, isAdmin = false, onUpdate, onRefresh, style }: EventCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [unregisterOpen, setUnregisterOpen] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { date, time, isPast } = formatDate(event.date);
  const pct = event.maxCapacity > 0 ? event.registrationCount / event.maxCapacity : 0;

  const statusBadge = isPast
    ? <Badge variant="gray">Past</Badge>
    : event.isFull
    ? <Badge variant="red">Full</Badge>
    : pct >= 0.8
    ? <Badge variant="yellow">{event.availableSpots} left</Badge>
    : <Badge variant="green">Open</Badge>;

  const handleUpdate = async (data: UpdateEventInput) => {
    const result = await onUpdate(event.id, data);
    if (result.success) { setEditOpen(false); setToast({ message: "Event updated.", type: "success" }); }
    return result;
  };

  const barColor = pct >= 1 ? "var(--danger)" : pct >= 0.8 ? "var(--warning)" : "var(--accent)";

  return (
    <>
      <div style={{
        background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
        padding: "20px", display: "flex", flexDirection: "column", gap: "14px",
        boxShadow: "var(--shadow-sm)", transition: "box-shadow var(--transition), border-color var(--transition)",
        animation: "fadeUp 0.3s ease both", ...style,
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.description}</p>
          </div>
          {statusBadge}
        </div>

        {/* Date row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <span>📅</span>
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{date}</span>
          <span>·</span>
          <span>{time}</span>
        </div>

        {/* Capacity */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span>Capacity</span>
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{event.registrationCount} / {event.maxCapacity}</span>
          </div>
          <div style={{ height: "4px", background: "var(--bg-muted)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: barColor, borderRadius: "2px", transition: "width 0.5s ease" }} />
          </div>
        </div>

        {/* Admin actions row */}
        {isAdmin && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Edit</Button>
            {event.registrationCount > 0 && (
              <button onClick={() => setRegistrationsOpen(true)} style={{
                fontSize: "13px", fontWeight: 500, padding: 0, background: "none",
                border: "none", color: "var(--accent)", cursor: "pointer",
                fontFamily: "var(--font)", textDecoration: "underline", textUnderlineOffset: "2px",
              }}>
                View registrations ({event.registrationCount})
              </button>
            )}
          </div>
        )}

        {/* Attendee actions row */}
        <div style={{ display: "flex", gap: "8px", paddingTop: "2px", alignItems: "center" }}>
          {!isPast && event.registrationCount > 0 && (
            <Button variant="danger" size="sm" onClick={() => setUnregisterOpen(true)}>Unregister</Button>
          )}
          {!isPast && (
            <Button variant="primary" size="sm" onClick={() => setRegisterOpen(true)} disabled={event.isFull}>
              {event.isFull ? "Full" : "Register"}
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit event">
          <EventForm initial={event} mode="edit" onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </Modal>
      )}

      {isAdmin && (
        <Modal open={registrationsOpen} onClose={() => setRegistrationsOpen(false)} title={`Registrations — ${event.title}`} width={640}>
          <RegistrationsModal event={event} />
        </Modal>
      )}

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register for event">
        <RegisterPanel event={event} mode="register"
          onSuccess={() => { setRegisterOpen(false); setToast({ message: "Registered successfully.", type: "success" }); onRefresh(); }}
          onCancel={() => setRegisterOpen(false)} />
      </Modal>

      <Modal open={unregisterOpen} onClose={() => setUnregisterOpen(false)} title="Unregister from event">
        <RegisterPanel event={event} mode="unregister"
          onSuccess={() => { setUnregisterOpen(false); setToast({ message: "Unregistered successfully.", type: "success" }); onRefresh(); }}
          onCancel={() => setUnregisterOpen(false)} />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
