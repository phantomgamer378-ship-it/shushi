"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { CheckCircle2, RefreshCw, Clock, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/Primitives";

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
      const interval = setInterval(fetchCheckins, 5000);
      return () => clearInterval(interval);
    }
  }, [eventId]);

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-pitch/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-crimson animate-pulse inline-block" />
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-pitch/60 dark:text-cream/60">
              03 // REAL-TIME ADMISSION TELEMETRY
            </span>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-pitch dark:text-cream uppercase">
            Live Attendance Stream
          </h1>
          <p className="font-mono text-xs text-pitch/60 dark:text-cream/60 mt-1">
            Chronological audit log of attendees passing gate checkpoints. Polled every 5.0 seconds.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchCheckins}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REFRESH FEED</span>
        </Button>
      </div>

      <div className="border border-pitch/20 dark:border-white/15 bg-cream dark:bg-pitch overflow-hidden shadow-brutal">
        {loading && checkins.length === 0 ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-crimson border-t-transparent animate-spin" />
          </div>
        ) : checkins.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 flex items-center justify-center text-pitch/40 dark:text-cream/40 mb-3">
              <DoorOpen className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-sm uppercase text-pitch dark:text-cream">
              NO ADMISSION EVENTS LOGGED
            </h3>
            <p className="font-mono text-xs text-pitch/50 dark:text-cream/50 mt-1 max-w-sm">
              As attendees scan QR passes at checkpoints, timestamped check-in records will appear in this real-time ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-pitch/10 dark:divide-white/10 font-mono">
            {checkins.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-sand/60 dark:hover:bg-carbon/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-[#16A34A]/10 border border-[#16A34A]/30 flex items-center justify-center text-[#16A34A]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm uppercase text-pitch dark:text-cream">
                      {item.attendee_name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-pitch/60 dark:text-cream/60 mt-0.5">
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-crimson" />
                        {item.gate_name}
                      </span>
                      <span className="text-[10px] text-pitch/40 dark:text-cream/40">
                        PASS: {item.ticket_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-pitch/60 dark:text-cream/60">
                  <Clock className="w-3.5 h-3.5" />
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
