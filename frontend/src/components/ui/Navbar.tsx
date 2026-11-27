"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, QrCode, Users, BarChart3, Settings, LogOut, ChevronDown } from "lucide-react";

export function Navbar({ eventTitle, eventId }: { eventTitle?: string; eventId?: string }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/events" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-white group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <span>EventFlow</span>
        </Link>

        {eventId && eventTitle && (
          <div className="flex items-center gap-2 text-sm text-slate-400 pl-4 border-l border-white/10">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-slate-200">{eventTitle}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {userEmail && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-indigo-400">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
