"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  QrCode,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({
  eventId,
  mobileOpen = false,
  onCloseMobile,
}: {
  eventId: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  const links = [
    { href: `/events/${eventId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/events/${eventId}/scanner`, label: "QR Scanner", icon: QrCode, highlight: true },
    { href: `/events/${eventId}/registrations`, label: "Registrations", icon: Users },
    { href: `/events/${eventId}/attendance`, label: "Live Attendance", icon: BarChart3 },
    { href: `/events/${eventId}/reports`, label: "Reports & Export", icon: FileSpreadsheet },
    { href: `/events/${eventId}/staff`, label: "Staff & RBAC", icon: ShieldCheck },
    { href: `/events/${eventId}/settings`, label: "Webhooks & Setup", icon: Settings },
  ];

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-1">
        <Link
          href="/events"
          onClick={onCloseMobile}
          className="flex items-center gap-2 px-3.5 py-2 mb-3 rounded-[10px] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Events</span>
        </Link>

        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/25"
                  : link.highlight
                  ? "text-[#635BFF] dark:text-[#36C8E8] hover:bg-[#635BFF]/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 px-3 py-2 text-[11px] text-slate-400">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Security Boundary
        </div>
        <div className="mt-0.5">Zero-PII Token Verification</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-200 dark:border-white/10 p-4 hidden md:flex flex-col min-h-[calc(100vh-57px)] shrink-0">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[80vw] bg-white dark:bg-[#10172A] border-r border-slate-200 dark:border-white/10 p-5 flex flex-col h-full shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
