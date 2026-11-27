"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Badge, Button, MetricCard } from "@/components/ui/Primitives";
import {
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  Link2,
  Calendar,
  MapPin,
  ArrowRight,
  TrendingUp,
  DoorOpen,
} from "lucide-react";

interface EventStats {
  event_id: string;
  total_registrations: number;
  total_admitted: number;
  pending_admission: number;
  max_capacity: number | null;
  admission_rate_percent: number;
}

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  venue_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface CheckInRecord {
  id: string;
  ticket_id: string;
  attendee_name: string;
  gate_name: string;
  checked_in_at: string;
}

export default function EventOverviewPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [stats, setStats] = useState<EventStats | null>(null);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [eventData, statsData, checkinsData] = await Promise.all([
          apiClient<EventDetail>(`events/${eventId}`),
          apiClient<EventStats>(`events/${eventId}/stats`),
          apiClient<CheckInRecord[]>(`events/${eventId}/check-ins?limit=5`).catch(() => []),
        ]);
        setEvent(eventData);
        setStats(statsData);
        setRecentCheckins(checkinsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  return (
    <div className="space-y-8">
      {/* Event Header Banner */}
      <div className="glass-card p-6 rounded-[20px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <Badge variant={event?.status === "ACTIVE" ? "success" : "brand"}>
              {event?.status || "LOADING"}
            </Badge>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {event?.slug}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {event?.title || "Event Dashboard"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#635BFF] dark:text-[#36C8E8]" />
              <span>{event?.venue_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#635BFF] dark:text-[#36C8E8]" />
              <span>
                {event?.start_time ? new Date(event.start_time).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </div>

        <Link href={`/events/${eventId}/scanner`}>
          <Button size="md">
            <QrCode className="w-4 h-4" />
            <span>Launch Gate Scanner</span>
          </Button>
        </Link>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Registrations"
          value={stats?.total_registrations ?? 0}
          icon={<Users className="w-4 h-4" />}
          context={
            stats?.max_capacity
              ? `Capacity limit: ${stats.max_capacity}`
              : "Confirmed RSVP attendees"
          }
          loading={loading}
        />
        <MetricCard
          label="Admitted At Gate"
          value={stats?.total_admitted ?? 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          context="Atomic check-ins verified"
          loading={loading}
        />
        <MetricCard
          label="Pending Arrival"
          value={stats?.pending_admission ?? 0}
          icon={<Clock className="w-4 h-4" />}
          context="Active tickets awaiting entry"
          loading={loading}
        />
        <MetricCard
          label="Admission Rate"
          value={`${stats?.admission_rate_percent ?? 0}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          progressPercent={stats?.admission_rate_percent ?? 0}
          loading={loading}
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-[16px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Recent Gate Check-ins
            </h3>
            <Link
              href={`/events/${eventId}/attendance`}
              className="text-xs font-semibold text-[#635BFF] dark:text-[#36C8E8] hover:underline flex items-center gap-1"
            >
              View Live Stream <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentCheckins.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No gate check-ins recorded yet. Launch the QR scanner when doors open.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/5">
              {recentCheckins.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {c.attendee_name}
                      </div>
                      <div className="text-slate-500 flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" /> {c.gate_name}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-slate-500">
                    {new Date(c.checked_in_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href={`/events/${eventId}/registrations`}
            className="block glass-card p-5 rounded-[16px] group"
          >
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-1">
              Attendee Roster & Passes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Search attendees, export CSVs, reissue emails, or revoke tickets.
            </p>
            <span className="text-xs font-semibold text-[#635BFF] dark:text-[#36C8E8] flex items-center gap-1">
              Manage Attendees <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href={`/events/${eventId}/settings`}
            className="block glass-card p-5 rounded-[16px] group"
          >
            <div className="flex items-center gap-2 text-[#635BFF] dark:text-[#36C8E8] mb-1">
              <Link2 className="w-4 h-4" />
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Google Forms Webhook
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Copy HMAC endpoint URL & Apps Script trigger snippet.
            </p>
            <span className="text-xs font-semibold text-[#635BFF] dark:text-[#36C8E8] flex items-center gap-1">
              Configure Integration <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
