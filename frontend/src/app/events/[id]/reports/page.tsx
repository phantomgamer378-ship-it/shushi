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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendance Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time gate throughput metrics computed directly from PostgreSQL admission records.
          </p>
        </div>
        <Button size="sm" onClick={downloadAttendanceReport} disabled={checkins.length === 0}>
          <Download className="w-4 h-4" />
          <span>Download CSV Report</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Eligible"
          value={stats?.total_registrations ?? 0}
          icon={<Users className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          label="Successful Check-Ins"
          value={stats?.total_admitted ?? 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          label="Remaining"
          value={stats?.pending_admission ?? 0}
          icon={<Clock className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          label="Attendance %"
          value={`${stats?.admission_rate_percent ?? 0}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          progressPercent={stats?.admission_rate_percent ?? 0}
          loading={loading}
        />
      </div>

      <div className="glass-card p-6 rounded-[16px]">
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
          Check-Ins by Entry Gate
        </h3>
        {Object.keys(gateCounts).length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No gate admission activity recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(gateCounts).map(([gate, count]) => {
              const pct = stats?.total_admitted
                ? Math.round((count / stats.total_admitted) * 100)
                : 0;
              return (
                <div key={gate} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <DoorOpen className="w-3.5 h-3.5 text-[#635BFF]" />
                      {gate}
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} admitted ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#635BFF] to-[#36C8E8] h-2 rounded-full"
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
