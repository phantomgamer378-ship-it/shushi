"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, Users, BarChart3, Settings, ShieldCheck, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ eventId }: { eventId: string }) {
  const pathname = usePathname();

  const links = [
    { href: `/events/${eventId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/events/${eventId}/scanner`, label: "QR Scanner", icon: QrCode, highlight: true },
    { href: `/events/${eventId}/registrations`, label: "Registrations", icon: Users },
    { href: `/events/${eventId}/attendance`, label: "Attendance", icon: BarChart3 },
    { href: `/events/${eventId}/staff`, label: "Staff & RBAC", icon: ShieldCheck },
    { href: `/events/${eventId}/settings`, label: "Settings & Webhooks", icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/10 p-4 flex flex-col gap-1 hidden md:flex min-h-[calc(100vh-57px)]">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : link.highlight
                ? "text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
