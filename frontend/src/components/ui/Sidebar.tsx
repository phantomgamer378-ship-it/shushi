"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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
    { href: `/events/${eventId}`, label: "Overview", num: "01" },
    { href: `/events/${eventId}/scanner`, label: "QR Scanner", num: "02", highlight: true },
    { href: `/events/${eventId}/registrations`, label: "Registrations", num: "03" },
    { href: `/events/${eventId}/attendance`, label: "Live Stream", num: "04" },
    { href: `/events/${eventId}/reports`, label: "Reports", num: "05" },
    { href: `/events/${eventId}/staff`, label: "Staff RBAC", num: "06" },
    { href: `/events/${eventId}/settings`, label: "Webhooks", num: "07" },
  ];

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-1">
        <Link
          href="/events"
          onClick={onCloseMobile}
          className="flex items-center gap-2 px-3 py-2 mb-4 font-mono text-xs text-slate-400 hover:text-white border border-transparent hover:border-white/20 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Events</span>
        </Link>

        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider transition-all duration-100 border",
                isActive
                  ? "bg-[#D72638] text-white border-[#D72638] font-bold"
                  : link.highlight
                  ? "border-[#D72638]/50 text-[#D72638] hover:bg-[#D72638] hover:text-white"
                  : "border-transparent text-slate-400 hover:text-white hover:border-white/20"
              )}
            >
              <span>{link.label}</span>
              <span className="opacity-75">{link.num}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 border-t border-[#27272A] px-3 py-2 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
        <div>SECURITY BOUNDARY</div>
        <div className="text-slate-400 mt-0.5">SHUSHI GATE ENGINE</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-[#0A0A0C] border-r border-[#27272A] p-4 hidden md:flex flex-col min-h-[calc(100vh-53px)] shrink-0">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-64 bg-[#0A0A0C] border-r border-[#27272A] p-5 flex flex-col h-full shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
