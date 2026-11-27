"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Button, MetricCard } from "@/components/ui/Primitives";
import { QrCode, ArrowRight, DoorOpen } from "lucide-react";

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
    <div className="space-y-8 text-[#F4F0EA]">
      {/* Editorial Header Banner */}
      <div className="editorial-card p-6 sm:p-8 bg-[#121214] border border-[#27272A] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] mb-2 uppercase tracking-widest">
            <span className="px-2 py-0.5 bg-[#D72638] text-white font-bold">
              {event?.status || "ACTIVE"}
            </span>
            <span className="text-slate-400">SLUG // {event?.slug}</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            {event?.title || "Shushi"}
          </h1>
          <div className="font-mono text-xs text-slate-400 mt-2 flex flex-wrap gap-4">
            <span>VENUE // {event?.venue_name}</span>
            <span>
              DATE // {event?.start_time ? new Date(event.start_time).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>

        <Link href={`/events/${eventId}/scanner`}>
          <Button variant="crimson" size="lg">
            <QrCode className="w-4 h-4" />
            <span>Launch Gate Scanner</span>
          </Button>
        </Link>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          prefix="01 //"
          label="Total Registrations"
          value={stats?.total_registrations ?? 0}
          context={
            stats?.max_capacity ? `Limit: ${stats.max_capacity} attendees` : "Confirmed RSVP records"
          }
          loading={loading}
        />
        <MetricCard
          prefix="02 //"
          label="Admitted At Gate"
          value={stats?.total_admitted ?? 0}
          context="Verified check-ins"
          loading={loading}
        />
        <MetricCard
          prefix="03 //"
          label="Pending Arrival"
          value={stats?.pending_admission ?? 0}
          context="Awaiting entry scan"
          loading={loading}
        />
        <MetricCard
          prefix="04 //"
          label="Admission Rate"
          value={`${stats?.admission_rate_percent ?? 0}%`}
          context="Capacity throughput"
          loading={loading}
        />
      </div>

      {/* Gate Stream & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 editorial-card p-6 bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3 mb-4">
            <div className="font-mono text-xs uppercase tracking-wider text-white font-bold">
              Recent Gate Admissions
            </div>
            <Link
              href={`/events/${eventId}/attendance`}
              className="font-mono text-[11px] uppercase text-[#D72638] hover:underline flex items-center gap-1 font-bold"
            >
              Live Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCheckins.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-slate-500">
              No admissions logged yet. Launch the scanner to begin admitting guests.
            </div>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {recentCheckins.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between font-mono text-xs">
                  <div>
                    <div className="font-bold text-white">{c.attendee_name}</div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <DoorOpen className="w-3 h-3 text-[#D72638]" /> {c.gate_name}
                    </div>
                  </div>
                  <span className="text-slate-500 text-[11px]">
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
            className="block editorial-card p-5 bg-[#121214] border border-[#27272A] hover:border-[#D72638] group transition-all"
          >
            <div className="font-mono text-[10px] uppercase text-[#D72638] font-bold mb-1">
              01 // ROSTER
            </div>
            <h3 className="font-display text-base font-bold uppercase text-white mb-1">
              Guest Management
            </h3>
            <p className="font-mono text-xs text-slate-400 mb-3">
              Search attendees, export CSV data, or revoke admission passes.
            </p>
            <span className="font-mono text-xs font-bold uppercase text-[#D72638] flex items-center gap-1">
              Open Roster <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href={`/events/${eventId}/settings`}
            className="block editorial-card p-5 bg-[#121214] border border-[#27272A] hover:border-[#D72638] group transition-all"
          >
            <div className="font-mono text-[10px] uppercase text-[#D72638] font-bold mb-1">
              02 // INGESTION
            </div>
            <h3 className="font-display text-base font-bold uppercase text-white mb-1">
              Google Forms Webhook
            </h3>
            <p className="font-mono text-xs text-slate-400 mb-3">
              View your HMAC signing secret and copy the Apps Script forwarder.
            </p>
            <span className="font-mono text-xs font-bold uppercase text-[#D72638] flex items-center gap-1">
              Configure Webhook <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
