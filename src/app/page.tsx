"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/events/EventCard";
import { EventForm } from "@/components/events/EventForm";
import { Button, Modal, Spinner, EmptyState, Toast } from "@/components/ui";
import type { CreateEventInput } from "@/types";

type Filter = "all" | "open" | "full" | "past";

export default function Home() {
  const { events, loading, error, createEvent, updateEvent, refresh } = useEvents();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me").then(r => r.json()).then(j => setIsAdmin(j.isAdmin ?? false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: loginPassword }),
    });
    const json = await res.json();
    if (json.success) {
      setIsAdmin(true);
      setLoginOpen(false);
      setLoginPassword("");
      setToast({ message: "Logged in as admin.", type: "success" });
    } else {
      setLoginError(json.error ?? "Login failed.");
    }
    setLoginLoading(false);
  };

  const handleLogout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
    setToast({ message: "Logged out.", type: "success" });
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter(e => {
      const isPast = new Date(e.date).getTime() < now;
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === "open") return !isPast && !e.isFull;
      if (filter === "full") return !isPast && e.isFull;
      if (filter === "past") return isPast;
      return true;
    });
  }, [events, filter, search]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: events.length,
      upcoming: events.filter(e => new Date(e.date).getTime() > now).length,
      registrations: events.reduce((s, e) => s + e.registrationCount, 0),
    };
  }, [events]);

  const handleCreate = async (data: CreateEventInput) => {
    const result = await createEvent(data);
    if (result.success) { setCreateOpen(false); setToast({ message: "Event created.", type: "success" }); }
    return result;
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "14px",
    color: "var(--text-primary)",
  };

  const filterOptions: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "full", label: "Full" },
    { value: "past", label: "Past" },
  ];

  return (
    <>
      <nav style={{ background: "#fff", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
              📅
            </div>
            <span style={{ fontSize: "15px", fontWeight: 600 }}>Event Manager</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isAdmin ? (
              <>
                <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "100px", background: "var(--accent-subtle)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>Admin</span>
                <Button variant="secondary" size="sm" onClick={handleLogout}>Log out</Button>
                <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>+ New event</Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setLoginOpen(true)}>Admin login</Button>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "4px" }}>Events</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Manage your events and attendee registrations.</p>
        </div>

        {!loading && events.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Total events", value: stats.total },
              { label: "Upcoming", value: stats.upcoming },
              { label: "Total registrations", value: stats.registrations },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontSize: "24px", fontWeight: 600 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "15px", pointerEvents: "none" }}>🔍</span>
            <input type="search" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#fff", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", padding: "7px 12px 7px 32px", fontSize: "14px", color: "var(--text-primary)", height: "36px" }} />
          </div>
          <div style={{ display: "flex", background: "#fff", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", padding: "2px", gap: "2px", boxShadow: "var(--shadow-sm)" }}>
            {filterOptions.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                style={{ fontSize: "13px", fontWeight: 500, padding: "4px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "var(--font)", transition: "all var(--transition)",
                  background: filter === f.value ? "var(--accent)" : "transparent",
                  color: filter === f.value ? "#fff" : "var(--text-secondary)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}><Spinner size={24} color="var(--accent)" /></div>
        ) : error ? (
          <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--danger-subtle)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: "14px" }}>{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search || filter !== "all" ? "No events found" : "No events yet"}
            subtitle={search || filter !== "all" ? "Try adjusting your search or filter." : isAdmin ? "Create your first event to get started." : "No events have been created yet."}
            action={isAdmin && !search && filter === "all" ? <Button variant="primary" onClick={() => setCreateOpen(true)}>+ Create event</Button> : undefined}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} isAdmin={isAdmin} onUpdate={updateEvent} onRefresh={refresh}
                style={{ animationDelay: `${i * 0.04}s` }} />
            ))}
          </div>
        )}
      </main>

      {isAdmin && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create new event">
          <EventForm mode="create" onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>
      )}

      <Modal open={loginOpen} onClose={() => { setLoginOpen(false); setLoginError(null); setLoginPassword(""); }} title="Admin login">
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Password</label>
            <input style={inputStyle} type="password" placeholder="Enter admin password" value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)} required autoFocus />
          </div>
          {loginError && (
            <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--danger-subtle)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: "13px" }}>
              {loginError}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Button variant="secondary" type="button" onClick={() => { setLoginOpen(false); setLoginError(null); setLoginPassword(""); }}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loginLoading}>Log in</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
