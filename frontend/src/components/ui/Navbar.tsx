"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QrCode, Calendar, LogOut, Sun, Moon, Menu, X } from "lucide-react";

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
      setUserEmail(data.user?.email || null);
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
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 sm:gap-5">
        {eventId && onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link
          href="/events"
          className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white group"
        >
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#635BFF] to-[#36C8E8] flex items-center justify-center text-white shadow-lg shadow-[#635BFF]/25 group-hover:scale-105 transition-transform">
            <QrCode className="w-4 h-4" />
          </div>
          <span>Shushi</span>
        </Link>

        {eventId && eventTitle && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 pl-4 border-l border-slate-200 dark:border-white/10">
            <Calendar className="w-4 h-4 text-[#635BFF] dark:text-[#36C8E8]" />
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
              {eventTitle}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {userEmail && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/10">
            <div className="w-7 h-7 rounded-full bg-[#635BFF]/15 border border-[#635BFF]/30 flex items-center justify-center text-xs font-bold text-[#635BFF] dark:text-[#36C8E8]">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium hidden md:inline">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="text-slate-500 dark:text-slate-400 hover:text-[#DC4545] p-1.5 rounded-[10px] hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
