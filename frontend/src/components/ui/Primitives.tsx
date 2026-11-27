"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Inbox } from "lucide-react";

// 1. Button (Editorial Brutalist: Sharp borders, stark black/crimson)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "crimson";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "crimson",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    crimson:
      "bg-[#D72638] hover:bg-[#BF1E2F] text-white border border-[#D72638] shadow-sm uppercase tracking-wider font-mono",
    primary:
      "bg-[#0A0A0C] dark:bg-[#F4F0EA] text-[#F4F0EA] dark:text-[#0A0A0C] hover:opacity-90 border border-black dark:border-white uppercase tracking-wider font-mono",
    secondary:
      "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#0A0A0C] dark:text-[#F4F0EA] border border-black/30 dark:border-white/20 uppercase tracking-wider font-mono",
    danger:
      "bg-[#D72638] hover:bg-[#BF1E2F] text-white border border-[#D72638] uppercase tracking-wider font-mono",
    ghost:
      "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-sm",
    md: "px-4 py-2.5 text-xs rounded-sm",
    lg: "px-5 py-3 text-sm rounded-sm",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-all duration-100 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-[#D72638]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// 2. Semantic Badge (Editorial Mono Style)
interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "crimson" | "success" | "warning";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variants = {
    neutral:
      "bg-black/5 dark:bg-white/5 text-slate-800 dark:text-slate-200 border-black/20 dark:border-white/20",
    crimson: "bg-[#D72638] text-white border-[#D72638]",
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// 3. MetricCard (Minimalist Editorial Layout)
interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  context?: string;
  loading?: boolean;
  prefix?: string;
}

export function MetricCard({
  label,
  value,
  context,
  loading = false,
  prefix = "01 //",
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="editorial-card p-5 animate-pulse space-y-3">
        <div className="h-3 w-24 bg-slate-300 dark:bg-slate-800" />
        <div className="h-8 w-16 bg-slate-300 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="editorial-card p-5 relative overflow-hidden">
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
        <span>
          <strong className="text-[#D72638]">{prefix}</strong> {label}
        </span>
      </div>
      <div className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>
      {context && (
        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-2">
          {context}
        </p>
      )}
    </div>
  );
}

// 4. EmptyState
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="editorial-card p-12 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 border border-[#D72638] text-[#D72638] flex items-center justify-center mb-4 font-mono font-bold">
        !
      </div>
      <h3 className="font-display text-lg font-black uppercase text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 font-mono">
        {description}
      </p>
      {action}
    </div>
  );
}

// 5. ConfirmDialog
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <div className="w-full max-w-md editorial-card bg-[#121214] text-white p-6 space-y-4 border border-[#27272A]">
        <div className="flex items-start gap-3">
          <div className="p-2 border border-[#D72638] text-[#D72638] font-mono text-xs font-bold">
            WARN
          </div>
          <div>
            <h3 className="font-display text-base font-bold uppercase text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="crimson" size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
