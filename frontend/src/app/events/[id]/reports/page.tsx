"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Button, MetricCard } from "@/components/ui/Primitives";
import { Download, Users, CheckCircle2, Clock, TrendingUp, DoorOpen } from "lucide-react";

interface EventStats {
  total_registrations: number;
  total_admitted: number;
  pending_admission: number;
  admission_rate_percent: number;
}

interface CheckInRecord {
  id: string;
  ticket_id: string;
  attendee_name: string;
  gate_name: string;
  checked_in_at: string;
}

export default function ReportsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [stats, setStats] = useState<EventStats | null>(null);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statsData, checkinsData] = await Promise.all([
          apiClient<EventStats>(`events/${eventId}/stats`),
          apiClient<CheckInRecord[]>(`events/${eventId}/check-ins?limit=500`),
        ]);
        setStats(statsData);
        setCheckins(checkinsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (eventId) load();
  }, [eventId]);

  // Aggregate check-ins by gate
  const gateCounts = checkins.reduce<Record<string, number>>((acc, item) => {
    acc[item.gate_name] = (acc[item.gate_name] || 0) + 1;
    return acc;
  }, {});

  const downloadAttendanceReport = () => {
    const header = ["Check-In ID", "Attendee Name", "Gate", "Timestamp"];
    const rows = checkins.map((c) =>
      [
        c.id,
        `"${c.attendee_name.replace(/"/g, '""')}"`,
        `"${c.gate_name.replace(/"/g, '""')}"`,
        c.checked_in_at,
      ].join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shushi-attendance-report-${eventId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-pitch/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-crimson inline-block" />
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-pitch/60 dark:text-cream/60">
              04 // METRICS & AUDIT EXPORT
            </span>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-pitch dark:text-cream uppercase">
            Gate Analytics & Reports
          </h1>
          <p className="font-mono text-xs text-pitch/60 dark:text-cream/60 mt-1">
            Real-time throughput metrics derived directly from PostgreSQL check-in transactions.
          </p>
        </div>
        <Button size="sm" onClick={downloadAttendanceReport} disabled={checkins.length === 0}>
          <Download className="w-4 h-4" />
          <span>EXPORT CSV AUDIT</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="01 // REGISTERED PASSES"
          value={stats?.total_registrations ?? 0}
          icon={<Users className="w-4 h-4 text-crimson" />}
          loading={loading}
        />
        <MetricCard
          label="02 // ADMITTED (IN)"
          value={stats?.total_admitted ?? 0}
          icon={<CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
          loading={loading}
        />
        <MetricCard
          label="03 // REMAINING (OUT)"
          value={stats?.pending_admission ?? 0}
          icon={<Clock className="w-4 h-4 text-pitch/60 dark:text-cream/60" />}
          loading={loading}
        />
        <MetricCard
          label="04 // ATTENDANCE RATE"
          value={`${stats?.admission_rate_percent ?? 0}%`}
          icon={<TrendingUp className="w-4 h-4 text-crimson" />}
          loading={loading}
        />
      </div>

      <div className="editorial-card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-pitch/10 dark:border-white/10">
          <h3 className="font-display text-base font-black uppercase text-pitch dark:text-cream">
            Check-Ins by Gate Location
          </h3>
          <span className="font-mono text-xs text-pitch/60 dark:text-cream/60">
            {Object.keys(gateCounts).length} ACTIVE GATES
          </span>
        </div>

        {Object.keys(gateCounts).length === 0 ? (
          <p className="font-mono text-xs text-pitch/50 dark:text-cream/50 py-8 text-center uppercase">
            No gate admission activity recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(gateCounts).map(([gate, count]) => {
              const pct = stats?.total_admitted
                ? Math.round((count / stats.total_admitted) * 100)
                : 0;
              return (
                <div key={gate} className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold uppercase text-pitch dark:text-cream">
                      <DoorOpen className="w-3.5 h-3.5 text-crimson" />
                      {gate}
                    </span>
                    <span className="text-pitch/60 dark:text-cream/60 text-[11px]">
                      {count} ADMITTED ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-sand dark:bg-carbon border border-pitch/15 dark:border-white/10 h-3 overflow-hidden">
                    <div
                      className="bg-crimson h-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
