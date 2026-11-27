"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { apiClient } from "@/lib/api";
import { Badge, Button, EmptyState } from "@/components/ui/Primitives";
import {
  Calendar,
  Plus,
  MapPin,
  ArrowUpRight,
  Clock,
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
} from "lucide-react";

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

  // Guided 3-step Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

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

  const resetWizard = () => {
    setWizardStep(1);
    setTitle("");
    setSlug("");
    setDescription("");
    setVenue("");
    setStartTime("");
    setEndTime("");
    setCapacity("");
    setWizardError(null);
    setCreatedSecret(null);
    setShowWizard(false);
  };

  const handleCreateEvent = async () => {
    setSubmitting(true);
    setWizardError(null);
    try {
      const payload = {
        title,
        slug,
        description: description || null,
        venue_name: venue,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        timezone,
        max_capacity: capacity ? parseInt(capacity, 10) : null,
      };

      const res = await apiClient<{ id: string; webhook_secret?: string }>("events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.webhook_secret) {
        setCreatedSecret(res.webhook_secret);
      } else {
        resetWizard();
        fetchEvents();
      }
    } catch (err: any) {
      setWizardError(err.message || "Failed to create event. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Managed Events
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select an event workspace to open gate scanners, attendee rosters, and analytics.
            </p>
          </div>
          <Button
            onClick={() => {
              setWizardStep(1);
              setCreatedSecret(null);
              setWizardError(null);
              setShowWizard(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 rounded-[16px] h-48 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-6 rounded-[16px] border border-[#DC4545]/30 text-[#DC4545] text-sm">
            {error}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No Events Found"
            description="You are not assigned to any events yet. Launch the guided wizard to create your first event."
            action={
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4" />
                <span>Create Your First Event</span>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="glass-card p-6 rounded-[16px] shadow-card-light dark:shadow-card-dark hover:-translate-y-0.5 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={evt.status === "ACTIVE" ? "success" : "neutral"}>
                      {evt.status}
                    </Badge>
                    <Badge variant="brand">
                      <Shield className="w-3 h-3" />
                      {evt.user_role}
                    </Badge>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#635BFF] dark:group-hover:text-[#36C8E8] transition-colors line-clamp-1">
                    {evt.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{evt.venue_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(evt.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#635BFF] dark:text-[#36C8E8]">
                  <span>Open Event Console</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Guided Multi-Step Event Creation Wizard */}
        {showWizard && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg glass-panel p-6 sm:p-7 rounded-[20px] shadow-2xl">
              {createdSecret ? (
                <div className="space-y-4">
                  <Badge variant="success">Event Created</Badge>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Save Your Webhook Signing Secret
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                    Copy this secret now — it is shown only once. Paste it into your Google Apps Script{" "}
                    <code className="font-mono text-[#635BFF] dark:text-[#36C8E8]">WEBHOOK_SECRET</code>.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-slate-900 rounded-[10px] border border-white/10 font-mono text-xs text-[#36C8E8] break-all select-all">
                      {createdSecret}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                    >
                      {copiedSecret ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetWizard();
                      fetchEvents();
                    }}
                  >
                    Done & Return to Events
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        Create Event — Step {wizardStep} of 3
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {wizardStep === 1 && "Basic Information & Venue"}
                        {wizardStep === 2 && "Schedule & Capacity"}
                        {wizardStep === 3 && "Review & Confirm"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 w-6 rounded-full transition-colors ${
                            wizardStep >= step ? "bg-[#635BFF]" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {wizardError && (
                    <div className="p-3 rounded-[10px] bg-[#DC4545]/10 border border-[#DC4545]/25 text-[#DC4545] text-xs">
                      {wizardError}
                    </div>
                  )}

                  {wizardStep === 1 && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTitle(val);
                            setSlug(
                              val
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "")
                            );
                          }}
                          placeholder="Tech Summit 2026"
                          className="w-full px-3.5 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          URL Slug *
                        </label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="tech-summit-2026"
                          className="w-full px-3.5 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Venue Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder="BKC Convention Center, Mumbai"
                          className="w-full px-3.5 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief overview shown on ticket emails..."
                          className="w-full px-3.5 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                        />
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Start Time *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            End Time *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Timezone
                          </label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-3 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Max Capacity (Optional)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            placeholder="500"
                            className="w-full px-3 py-2 rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="p-4 rounded-[12px] bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Title</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Slug</span>
                        <span className="font-mono text-[#635BFF] dark:text-[#36C8E8]">{slug}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Venue</span>
                        <span className="font-medium text-slate-900 dark:text-white">{venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Schedule</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {startTime ? new Date(startTime).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacity</span>
                        <span className="text-slate-700 dark:text-slate-300">{capacity || "Unlimited"}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
                    <Button variant="ghost" size="sm" onClick={resetWizard}>
                      Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                      {wizardStep > 1 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setWizardStep((s) => (s - 1) as 1 | 2 | 3)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back</span>
                        </Button>
                      )}
                      {wizardStep < 3 ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (wizardStep === 1 && (!title || !slug || !venue)) {
                              setWizardError("Please fill in Event Title, Slug, and Venue.");
                              return;
                            }
                            if (wizardStep === 2 && (!startTime || !endTime)) {
                              setWizardError("Please specify both Start Time and End Time.");
                              return;
                            }
                            setWizardError(null);
                            setWizardStep((s) => (s + 1) as 1 | 2 | 3);
                          }}
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" loading={submitting} onClick={handleCreateEvent}>
                          Create Event
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
