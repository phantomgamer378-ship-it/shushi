"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Badge, Button, ConfirmDialog, EmptyState } from "@/components/ui/Primitives";
import { Search, Mail, RefreshCw, Download, X, User, Ticket as TicketIcon } from "lucide-react";

interface Registration {
  id: string;
  event_id: string;
  external_form_response_id?: string;
  source_response_id?: string;
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Dialog state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [revokeTargetTicketId, setRevokeTargetTicketId] = useState<string | null>(null);

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
    if (eventId) fetchData();
  }, [eventId]);

  const handleResend = async (ticketId: string) => {
    try {
      setActionLoading(ticketId);
      await apiClient(`events/${eventId}/tickets/${ticketId}/resend`, { method: "POST" });
      setToastMessage("Ticket re-enqueued in transactional email outbox.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to resend ticket");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTargetTicketId) return;
    try {
      setActionLoading(revokeTargetTicketId);
      await apiClient(`events/${eventId}/tickets/${revokeTargetTicketId}/revoke`, {
        method: "POST",
      });
      setToastMessage("Ticket revoked. Gate scanners will immediately reject this pass.");
      setRevokeTargetTicketId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke ticket");
    } finally {
      setActionLoading(null);
    }
  };

  const ticketByRegId = new Map(tickets.map((t) => [t.registration_id, t]));

  const filteredRegistrations = registrations.filter((r) => {
    const respId = (r.external_form_response_id || r.source_response_id || "").toLowerCase();
    const matchesSearch =
      r.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.attendee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      respId.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const header = ["Attendee Name", "Email", "Registration Status", "Ticket Status", "Registered At"];
    const rows = filteredRegistrations.map((r) => {
      const t = ticketByRegId.get(r.id);
      return [
        `"${r.attendee_name.replace(/"/g, '""')}"`,
        `"${r.attendee_email}"`,
        r.status,
        t?.status || "NONE",
        new Date(r.registered_at).toISOString(),
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventflow-attendees-${eventId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendee Registrations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search attendees, inspect ticket status, export rosters, or revoke credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filteredRegistrations.length === 0}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-[10px] bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] dark:text-emerald-300 text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendee name, email, or response ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by registration status"
          className="px-3.5 py-2.5 rounded-[10px] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-8 rounded-[16px] space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-[10px]" />
          ))}
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          title="No Matching Attendees"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-card rounded-[16px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Attendee</th>
                    <th className="px-5 py-3.5">Registration</th>
                    <th className="px-5 py-3.5">Ticket Status</th>
                    <th className="px-5 py-3.5">Registered At</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {filteredRegistrations.map((reg) => {
                    const ticket = ticketByRegId.get(reg.id);
                    const isRevoked = ticket?.status === "REVOKED";

                    return (
                      <tr
                        key={reg.id}
                        onClick={() => setSelectedReg(reg)}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {reg.attendee_name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{reg.attendee_email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={reg.status === "CONFIRMED" ? "success" : "warning"}>
                            {reg.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          {ticket ? (
                            <Badge variant={isRevoked ? "danger" : "brand"}>{ticket.status}</Badge>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(reg.registered_at).toLocaleString()}
                        </td>
                        <td
                          className="px-5 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ticket && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={actionLoading === ticket.id || isRevoked}
                                onClick={() => handleResend(ticket.id)}
                              >
                                Resend
                              </Button>
                              {!isRevoked && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={actionLoading === ticket.id}
                                  onClick={() => setRevokeTargetTicketId(ticket.id)}
                                >
                                  Revoke
                                </Button>
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
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden space-y-3">
            {filteredRegistrations.map((reg) => {
              const ticket = ticketByRegId.get(reg.id);
              const isRevoked = ticket?.status === "REVOKED";
              return (
                <div
                  key={reg.id}
                  onClick={() => setSelectedReg(reg)}
                  className="glass-card p-4 rounded-[16px] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {reg.attendee_name}
                      </div>
                      <div className="text-xs text-slate-500">{reg.attendee_email}</div>
                    </div>
                    <Badge variant={isRevoked ? "danger" : "brand"}>
                      {ticket?.status || reg.status}
                    </Badge>
                  </div>
                  {ticket && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        disabled={isRevoked}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResend(ticket.id);
                        }}
                      >
                        Resend Email
                      </Button>
                      {!isRevoked && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRevokeTargetTicketId(ticket.id);
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Attendee Detail Drawer */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#10172A] border-l border-slate-200 dark:border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-[#635BFF]" />
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Attendee Profile
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  aria-label="Close drawer"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-slate-500 uppercase font-semibold">Full Name</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedReg.attendee_name}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase font-semibold">Email</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedReg.attendee_email}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase font-semibold">Form Response ID</div>
                  <div className="font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedReg.external_form_response_id || selectedReg.source_response_id}
                  </div>
                </div>

                {ticketByRegId.get(selectedReg.id) && (
                  <div className="p-4 rounded-[12px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <TicketIcon className="w-4 h-4 text-[#635BFF]" />
                      <span>Cryptographic Credential</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Token Hash (SHA-256):
                    </div>
                    <div className="font-mono text-[10px] break-all text-slate-600 dark:text-slate-400">
                      {ticketByRegId.get(selectedReg.id)?.token_hash}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button variant="secondary" onClick={() => setSelectedReg(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(revokeTargetTicketId)}
        title="Revoke Digital Ticket?"
        description="This action invalidates the attendee's QR pass immediately. Gate scanners will reject admission with TICKET_REVOKED."
        confirmLabel="Revoke Ticket"
        loading={Boolean(actionLoading)}
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeTargetTicketId(null)}
      />
    </div>
  );
}
