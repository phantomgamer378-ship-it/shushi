"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { CheckCircle2, RefreshCw, Clock, DoorOpen, User, Shield } from "lucide-react";

interface CheckInRecord {
  id: string;
  ticket_id: string;
  attendee_name: string;
  gate_name: string;
  checked_in_at: string;
  staff_id: string | null;
}

export default function AttendancePage() {
  const params = useParams();
  const eventId = params.id as string;

  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const data = await apiClient<CheckInRecord[]>(`events/${eventId}/check-ins`);
      setCheckins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchCheckins();
      // Optional polling every 5 seconds for live attendance monitoring
      const interval = setInterval(fetchCheckins, 5000);
      return () => clearInterval(interval);
    }
  }, [eventId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Attendance Stream</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of attendees passing through gate scanners. Auto-refreshes every 5 seconds.
          </p>
        </div>
        <button
          onClick={fetchCheckins}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Now</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {loading && checkins.length === 0 ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : checkins.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 mb-3">
              <DoorOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Check-Ins Recorded Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              When tickets are scanned at event gates, check-in records will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {checkins.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.attendee_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                        {item.gate_name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Ticket: {item.ticket_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(item.checked_in_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
