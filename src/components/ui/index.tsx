"use client";

import React from "react";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "secondary", size = "md", loading = false, children, disabled, style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: "6px", fontFamily: "var(--font)", fontWeight: 500,
    borderRadius: "var(--radius-md)", transition: "all var(--transition)",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    whiteSpace: "nowrap", ...style,
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: "13px", padding: "5px 12px", height: "30px" },
    md: { fontSize: "14px", padding: "7px 14px", height: "36px" },
    lg: { fontSize: "14px", padding: "9px 18px", height: "40px" },
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" },
    secondary: { background: "#fff", color: "var(--text-primary)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-sm)" },
    ghost:     { background: "transparent", color: "var(--text-secondary)", border: "1px solid transparent" },
    danger:    { background: "var(--danger-subtle)", color: "var(--danger)", border: "1px solid var(--danger-border)" },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }} disabled={disabled || loading} {...props}>
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export function Spinner({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }} aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "blue" | "red" | "green" | "yellow" | "gray" }) {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: "var(--bg-muted)",     color: "var(--text-secondary)",  border: "1px solid var(--border)" },
    blue:    { background: "var(--accent-subtle)", color: "var(--accent)",          border: "1px solid var(--accent-border)" },
    red:     { background: "var(--danger-subtle)", color: "var(--danger)",          border: "1px solid var(--danger-border)" },
    green:   { background: "var(--success-subtle)",color: "var(--success)",         border: "1px solid #bbf7d0" },
    yellow:  { background: "var(--warning-subtle)",color: "var(--warning)",         border: "1px solid #fde68a" },
    gray:    { background: "var(--bg-muted)",      color: "var(--text-muted)",      border: "1px solid var(--border)" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "12px", fontWeight: 500, padding: "2px 8px",
      borderRadius: "100px", ...variants[variant],
    }}>{children}</span>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 24px", gap: "8px" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-lg)", background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px", fontSize: "20px" }}>
        📅
      </div>
      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</p>
      {subtitle && <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "300px" }}>{subtitle}</p>}
      {action && <div style={{ marginTop: "12px" }}>{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 16px", borderRadius: "var(--radius-lg)",
      background: "#fff", border: "1px solid var(--border)",
      boxShadow: "var(--shadow-lg)", fontSize: "14px", fontWeight: 500,
      animation: "fadeUp 0.2s ease", maxWidth: "360px", color: "var(--text-primary)",
    }}>
      <span style={{ fontSize: "16px" }}>{type === "success" ? "✓" : "✕"}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1, background: "none", border: "none", padding: "0 2px" }}>×</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

const MODAL_TITLE_ID = "modal-title";
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, width = 480 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number }) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Escape to close
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus first focusable element when modal opens
  React.useEffect(() => {
    if (!open || !dialogRef.current) return;
    const first = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [open]);

  // Focus trap — Tab and Shift+Tab cycle within the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", animation: "fadeIn 0.15s ease" }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={MODAL_TITLE_ID}
        onKeyDown={handleKeyDown}
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: `${width}px`, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)", animation: "fadeUp 0.2s ease" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 id={MODAL_TITLE_ID} style={{ fontSize: "15px", fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </div>
  );
}
