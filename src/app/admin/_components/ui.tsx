"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

import type { OrderStatus } from "@/lib/admin-types";
import { statusLabel } from "../_lib/format";
import styles from "../admin.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export function Card({ children, className = "", delay = 0, as = "section" }: { children: ReactNode; className?: string; delay?: number; as?: "section" | "div" | "article" }) {
  const Component = as === "div" ? motion.div : as === "article" ? motion.article : motion.section;
  return (
    <Component
      className={`${styles.glass} min-w-0 rounded-[26px] p-5 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease, delay }}
    >
      {children}
    </Component>
  );
}

export function PageTitle({ title, accent, subtitle, actions }: { title: string; accent?: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <motion.div className="mb-5 flex flex-wrap items-end justify-between gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
      <div>
        <h1 className="text-[clamp(28px,3vw,38px)] font-semibold leading-tight tracking-[-0.03em]">
          {title} {accent && <span className={`${styles.serif} text-[1.12em] text-[var(--deep-2)]`}>{accent}</span>}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function Button({
  children, onClick, variant = "dark", type = "button", disabled, title, className = "", size = "md",
}: {
  children: ReactNode; onClick?: () => void; variant?: "dark" | "accent" | "ghost" | "danger" | "light";
  type?: "button" | "submit"; disabled?: boolean; title?: string; className?: string; size?: "sm" | "md";
}) {
  const tones = {
    dark: "bg-[var(--deep)] text-white hover:bg-[var(--deep-2)]",
    accent: "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-105",
    ghost: "bg-white/70 text-[var(--ink)] ring-1 ring-[var(--line)] hover:bg-white",
    danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100",
    light: "bg-[var(--mint)] text-[var(--deep)] hover:brightness-95",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${tones[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

const statusTone: Record<OrderStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  refund_requested: "bg-orange-50 text-orange-700 ring-orange-200",
  refunded: "bg-slate-100 text-slate-600 ring-slate-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusTone[status]}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabel[status]}</span>;
}

export function Pill({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "accent" | "slate" | "dark" | "rose" }) {
  const tones = {
    mint: "bg-[var(--mint)] text-[var(--deep)]",
    accent: "bg-orange-100 text-orange-800",
    slate: "bg-slate-100 text-slate-600",
    dark: "bg-[var(--deep)] text-white",
    rose: "bg-rose-100 text-rose-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition disabled:opacity-40 ${checked ? "bg-[var(--deep)]" : "bg-slate-300"}`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className={`h-5 w-5 rounded-full bg-white shadow ${checked ? "ml-auto" : ""}`} />
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid grid-cols-1 gap-1.5 text-sm">
      <span className="font-semibold text-[var(--ink)]">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass = "h-11 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-3.5 text-sm outline-none transition focus:border-[var(--deep-2)] focus:ring-4 focus:ring-[#21463f1f]";
export const textareaClass = "min-h-24 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-3.5 py-3 text-sm outline-none transition focus:border-[var(--deep-2)] focus:ring-4 focus:ring-[#21463f1f]";

/** Slide-over panel used for editing details. */
export function Drawer({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-[#0b1f1b]/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={id}
            className={`fixed inset-y-3 right-3 z-50 flex flex-col overflow-hidden rounded-[28px] bg-[#f7faf8] shadow-2xl`}
            style={{ width: `min(calc(100vw - 24px), ${wide ? 720 : 520}px)` }}
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-4">
              <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-[var(--line)] hover:bg-slate-50"><X size={16} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Initials({ name, className = "" }: { name: string; className?: string }) {
  const colors = ["bg-[#cfe8df] text-[#17332f]", "bg-[#fde2c8] text-[#7a3610]", "bg-[#dfe3fb] text-[#2d3a8c]", "bg-[#f6dbe4] text-[#8a2449]", "bg-[#e6f0c8] text-[#46561a]"];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  const letters = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return <span className={`inline-grid h-9 w-9 flex-none place-items-center rounded-full text-xs font-bold ring-2 ring-white ${colors[index]} ${className}`} aria-hidden="true">{letters}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-sm text-[var(--muted)]">{children}</p>;
}

export function Segmented<T extends string>({ value, onChange, options, id }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; id: string }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-white/70 p-1 ring-1 ring-[var(--line)]" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${value === option.value ? "text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
        >
          {value === option.value && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-[var(--deep)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
