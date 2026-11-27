"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Sun, Moon, Menu, X } from "lucide-react";

export function Navbar({
  eventTitle,
  eventId,
  onToggleMobileMenu,
  mobileMenuOpen,
}: {
  eventTitle?: string;
  eventId?: string;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      } else if (typeof window !== "undefined") {
        const demo = localStorage.getItem("shushi_demo_user");
        if (demo) setUserEmail(demo);
      }
    });

    if (typeof document !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("shushi_demo_token");
      localStorage.removeItem("shushi_demo_user");
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0C] border-b border-[#27272A] px-4 sm:px-6 py-3 flex items-center justify-between text-white">
      <div className="flex items-center gap-4">
        {eventId && onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 border border-white/20 text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <Link href="/events" className="flex items-center gap-3 group">
          {/* Brutalist Logo Block */}
          <div className="w-7 h-7 bg-white text-black font-mono font-black text-xs flex items-center justify-center border border-white">
            SH
          </div>
          <span className="font-display font-black tracking-tight text-base uppercase">
            Shushi
          </span>
        </Link>

        {eventId && eventTitle && (
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#27272A] font-mono text-xs text-slate-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#D72638] animate-pulse" />
            <span className="text-white font-bold">{eventTitle}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Subtle Status Dots (matching reference image) */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D72638]" title="Live Admission Gateway" />
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Supabase Mumbai Pooler" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Operational Status" />
          <span className="ml-1 tracking-widest text-[11px] text-slate-300">SYSTEM READY</span>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="p-1.5 border border-white/20 hover:bg-white/10 text-slate-300"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {userEmail && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#27272A]">
            <span className="font-mono text-xs text-slate-300 hidden md:inline">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 border border-[#D72638] text-[#D72638] hover:bg-[#D72638] hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
