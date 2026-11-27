"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import {
  Users,
  CheckCircle2,
  Clock,
  Percent,
  QrCode,
  Link2,
  Calendar,
  MapPin,
  ArrowRight,
  TrendingUp,
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

export default function EventOverviewPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [stats, setStats] = useState<EventStats | null>(null);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [eventData, statsData] = await Promise.all([
          apiClient<EventDetail>(`events/${eventId}`),
          apiClient<EventStats>(`events/${eventId}/stats`),
        ]);
        setEvent(eventData);
        setStats(statsData);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Event Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {event?.status || "ACTIVE"}
            </span>
            <span className="text-xs text-slate-400">Slug: {event?.slug}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{event?.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>{event?.venue_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {event?.start_time ? new Date(event.start_time).toLocaleString() : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/events/${eventId}/scanner`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch Gate Scanner</span>
          </Link>
        </div>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Registrations</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats?.total_registrations ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Confirmed RSVP attendees</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Admitted At Gate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats?.total_admitted ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Atomic check-ins verified</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Arrival</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats?.pending_admission ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Tickets ready for scanning</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Admission Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats?.admission_rate_percent ?? 0}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats?.admission_rate_percent || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Operational Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/events/${eventId}/scanner`}
          className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Mobile Gate Scanner</h3>
          <p className="text-xs text-slate-400 mb-4">
            ZXing-powered camera scanner with sub-second token lookup, duplicate check-in prevention, and audio chimes.
          </p>
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300">
            Open Scanner <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href={`/events/${eventId}/registrations`}
          className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Attendee Management</h3>
          <p className="text-xs text-slate-400 mb-4">
            Browse registration rosters, search by attendee name or email, reissue digital tickets, and revoke credentials.
          </p>
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300">
            View Attendees <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href={`/events/${eventId}/settings`}
          className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-105 transition-transform">
            <Link2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Google Forms Integration</h3>
          <p className="text-xs text-slate-400 mb-4">
            View your HMAC-SHA256 webhook signing secret, copy Google Apps Script triggers, and view inbound logs.
          </p>
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300">
            Configure Webhook <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
