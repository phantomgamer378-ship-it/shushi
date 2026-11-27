"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { apiClient } from "@/lib/api";
import { Badge, Button, EmptyState } from "@/components/ui/Primitives";
import { Plus, ArrowUpRight, Clock, MapPin } from "lucide-react";

interface EventSummary {
  id: string;
  slug: string;
  title: string;
  venue_name: string;
  start_time: string;
  end_time: string;
  status: string;
  user_role: string;
}

export default function EventsListPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<EventSummary[]>("events");
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C] text-[#F4F0EA]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-[#27272A] pb-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#D72638] mb-1">
              01 // WORKSPACES
            </div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
              Event Operations
            </h1>
            <p className="font-mono text-xs text-slate-400 mt-1">
              Select an active event workspace to launch admission scanners and monitor attendance.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="editorial-card p-6 h-44 animate-pulse bg-[#121214] border border-[#27272A]" />
            ))}
          </div>
        ) : error ? (
          <div className="editorial-card p-6 border border-[#D72638] text-[#D72638] font-mono text-xs">
            {error}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No Active Events Found"
            description="No events are currently registered under this account."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="editorial-card p-6 bg-[#121214] border border-[#27272A] hover:border-[#D72638] group flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-[#D72638] text-white font-bold uppercase tracking-widest">
                      {evt.status}
                    </span>
                    <span className="text-slate-400 uppercase tracking-widest">
                      ROLE // {evt.user_role}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-black uppercase text-white group-hover:text-[#D72638] transition-colors">
                    {evt.title}
                  </h3>

                  <div className="mt-4 space-y-1.5 font-mono text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#D72638]" />
                      <span>{evt.venue_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(evt.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#27272A] flex items-center justify-between font-mono text-xs uppercase font-bold text-slate-300 group-hover:text-[#D72638] transition-colors">
                  <span>Enter Event Workspace</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
