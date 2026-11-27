"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Search, Mail, Ban, RefreshCw, CheckCircle, AlertTriangle, XCircle, ArrowUpDown } from "lucide-react";

interface Registration {
  id: string;
  event_id: string;
  source_response_id: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  registered_at: string;
}

interface Ticket {
  id: string;
  event_id: string;
  registration_id: string;
  token_hash: string;
  status: string;
  created_at: string;
}

export default function RegistrationsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regsData, ticketsData] = await Promise.all([
        apiClient<Registration[]>(`events/${eventId}/registrations`),
        apiClient<Ticket[]>(`events/${eventId}/tickets`),
      ]);
      setRegistrations(regsData);
      setTickets(ticketsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const handleResend = async (ticketId: string) => {
    if (!confirm("Re-issue and resend digital ticket email to attendee?")) return;
    try {
      setActionLoading(ticketId);
      await apiClient(`events/${eventId}/tickets/${ticketId}/resend`, { method: "POST" });
      setToastMessage("Ticket reissued and enqueued in email outbox.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to resend ticket");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (ticketId: string) => {
    if (!confirm("Are you sure you want to REVOKE this ticket? The attendee will NOT be granted gate admission.")) return;
    try {
      setActionLoading(ticketId);
      await apiClient(`events/${eventId}/tickets/${ticketId}/revoke`, { method: "POST" });
      setToastMessage("Ticket revoked successfully.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke ticket");
    } finally {
      setActionLoading(null);
    }
  };

  const ticketByRegId = new Map(tickets.map((t) => [t.registration_id, t]));

  const filteredRegistrations = registrations.filter((r) =>
    r.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.attendee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.source_response_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Attendee Registrations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse registered attendees from Google Forms webhooks, manage digital tickets, and revoke or re-issue passes.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by attendee name, email address, or Google Forms response ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No attendees matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Attendee</th>
                  <th className="px-5 py-3.5">Source Response ID</th>
                  <th className="px-5 py-3.5">Registration Status</th>
                  <th className="px-5 py-3.5">Ticket Status</th>
                  <th className="px-5 py-3.5">Registered At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRegistrations.map((reg) => {
                  const ticket = ticketByRegId.get(reg.id);
                  const isRevoked = ticket?.status === "REVOKED";

                  return (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white text-sm">{reg.attendee_name}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{reg.attendee_email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                        {reg.source_response_id}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {ticket ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isRevoked
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(reg.registered_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {ticket && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResend(ticket.id)}
                              disabled={actionLoading === ticket.id || isRevoked}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-[11px] font-medium transition-colors disabled:opacity-30"
                              title="Re-issue & Resend Ticket"
                            >
                              Resend
                            </button>
                            {!isRevoked && (
                              <button
                                onClick={() => handleRevoke(ticket.id)}
                                disabled={actionLoading === ticket.id}
                                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[11px] font-medium transition-colors disabled:opacity-30"
                                title="Revoke Ticket"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
