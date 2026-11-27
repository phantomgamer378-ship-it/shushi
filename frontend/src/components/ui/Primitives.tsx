"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Inbox } from "lucide-react";

// 1. Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#635BFF] hover:bg-[#5249F5] text-white shadow-lg shadow-[#635BFF]/25 border border-transparent",
    secondary:
      "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10",
    danger:
      "bg-[#DC4545] hover:bg-red-700 text-white shadow-lg shadow-red-600/20 border border-transparent",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-[10px]",
    md: "px-4 py-2.5 text-sm rounded-[10px]",
    lg: "px-5 py-3 text-base rounded-[10px]",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#635BFF]/50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// 2. Semantic Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "brand" | "success" | "warning" | "danger";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variants = {
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10",
    brand: "bg-[#635BFF]/10 text-[#635BFF] dark:text-[#817BFF] border-[#635BFF]/25",
    success: "bg-[#16A34A]/10 text-[#16A34A] dark:text-emerald-400 border-[#16A34A]/25",
    warning: "bg-[#EAAA24]/15 text-amber-700 dark:text-amber-300 border-[#EAAA24]/30",
    danger: "bg-[#DC4545]/10 text-[#DC4545] dark:text-red-400 border-[#DC4545]/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// 3. MetricCard with Skeleton support
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  context?: string;
  loading?: boolean;
  progressPercent?: number;
}

export function MetricCard({
  label,
  value,
  icon,
  context,
  loading = false,
  progressPercent,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 rounded-[16px] animate-pulse space-y-3">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 rounded-[16px] shadow-card-light dark:shadow-card-dark hover:-translate-y-0.5">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-lg bg-[#635BFF]/10 text-[#635BFF] dark:text-[#36C8E8]">
          {icon}
        </div>
      </div>
      <div className="font-display text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>
      {context && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{context}</p>
      )}
      {typeof progressPercent === "number" && (
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#635BFF] to-[#36C8E8] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// 4. EmptyState
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card p-12 rounded-[24px] text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] dark:text-[#36C8E8] flex items-center justify-center mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
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
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md glass-panel p-6 rounded-[20px] shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#DC4545]/10 text-[#DC4545] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
