"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { apiClient, ApiError } from "@/lib/api";
import { Calendar, Plus, MapPin, Users, ArrowUpRight, Clock, Shield } from "lucide-react";

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
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Event Modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [venue, setVenue] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        slug,
        venue_name: venue,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        timezone: "Asia/Kolkata",
        max_capacity: capacity ? parseInt(capacity) : null,
      };

      const res = await apiClient<{ id: string; webhook_secret?: string }>("events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.webhook_secret) {
        setCreatedSecret(res.webhook_secret);
      } else {
        setShowModal(false);
        fetchEvents();
      }
    } catch (err: any) {
      alert(err.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Your Managed Events</h1>
            <p className="text-sm text-slate-400 mt-1">
              Select an event to access check-in scanners, attendee rosters, and webhook metrics.
            </p>
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setCreatedSecret(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="glass-panel p-6 rounded-2xl border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Events Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              You are not assigned to any events yet. Create your first event to start accepting registrations.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                      {evt.status}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {evt.user_role}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {evt.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{evt.venue_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(evt.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
                  <span>Manage Dashboard & Scanners</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl">
              {createdSecret ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Event Created Successfully!</h3>
                  <p className="text-xs text-slate-300">
                    Here is your webhook signing secret. Copy this secret now — you will need to paste it into your Google Apps Script properties (`WEBHOOK_SECRET`).
                  </p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/10 font-mono text-xs text-indigo-300 break-all select-all">
                    {createdSecret}
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setCreatedSecret(null);
                      fetchEvents();
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
                  >
                    Done & Return to Events
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Create New Event</h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }}
                      placeholder="Tech Summit 2026"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Slug (URL friendly)</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="tech-summit-2026"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Name</label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Grand Convention Center, Hall B"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Max Capacity (Optional)</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="500"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                    >
                      {submitting ? "Creating..." : "Save Event"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
