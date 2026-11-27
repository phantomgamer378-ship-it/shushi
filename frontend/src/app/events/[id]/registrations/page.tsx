"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Badge, Button, ConfirmDialog, EmptyState } from "@/components/ui/Primitives";
import { Search, Mail, Phone, RefreshCw, Download, X, User, Ticket as TicketIcon, UserPlus, CheckCircle2, XCircle, QrCode, Copy, Check } from "lucide-react";

interface Registration {
  id: string;
  event_id: string;
  external_form_response_id?: string;
  source_response_id?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  urn?: string;
  metadata_json?: Record<string, any>;
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

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newUrn, setNewUrn] = useState("");
  const [newAttending, setNewAttending] = useState("Yes");
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Drawer & Dialog state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [revokeTargetTicketId, setRevokeTargetTicketId] = useState<string | null>(null);

  // QR Viewer Modal / Drawer State
  const [viewingQrTicketId, setViewingQrTicketId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ qr_payload: string; qr_image_data_url: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const loadTicketQr = async (ticketId: string) => {
    try {
      setViewingQrTicketId(ticketId);
      setQrLoading(true);
      setQrData(null);
      const res = await apiClient<{ qr_payload: string; qr_image_data_url: string }>(
        `events/${eventId}/tickets/${ticketId}/qr`
      );
      setQrData(res);
    } catch (err: any) {
      alert(err.message || "Unable to retrieve QR code. If the pass was already dispatched, re-issue it to regenerate.");
      setViewingQrTicketId(null);
    } finally {
      setQrLoading(false);
    }
  };

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

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      await apiClient(`events/${eventId}/registrations`, {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone || undefined,
          urn: newUrn || undefined,
          attending: newAttending,
        }),
      });
      setToastMessage(
        newAttending === "Yes"
          ? "Attendee registered successfully. Cryptographic pass issued."
          : "Attendee RSVP saved as Declined (No ticket issued)."
      );
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewUrn("");
      setNewAttending("Yes");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to register attendee");
    } finally {
      setSubmittingAdd(false);
    }
  };

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
      setToastMessage("Ticket revoked. Gate scanners will reject this pass immediately.");
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
    const urnText = (r.urn || "").toLowerCase();
    const phoneText = (r.attendee_phone || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      r.attendee_name.toLowerCase().includes(q) ||
      r.attendee_email.toLowerCase().includes(q) ||
      urnText.includes(q) ||
      phoneText.includes(q) ||
      respId.includes(q);

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const header = ["Attendee Name", "Email", "Phone", "URN", "Attending Response", "Registration Status", "Ticket Status", "Registered At"];
    const rows = filteredRegistrations.map((r) => {
      const t = ticketByRegId.get(r.id);
      const isAttending = r.status !== "CANCELLED";
      return [
        `"${r.attendee_name.replace(/"/g, '""')}"`,
        `"${r.attendee_email}"`,
        `"${r.attendee_phone || ""}"`,
        `"${r.urn || ""}"`,
        isAttending ? "Yes" : "No",
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
    a.download = `shushi-attendees-${eventId.slice(0, 8)}.csv`;
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
              02 // ATTENDEES & ROSTER
            </span>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-pitch dark:text-cream uppercase">
            Attendee Registrations
          </h1>
          <p className="font-mono text-xs text-pitch/60 dark:text-cream/60 mt-1">
            Ingested from Google Forms (Name, Email, Phone, URN, RSVP). Atomic token issuance and gate credential audit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ ADD ATTENDEE</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filteredRegistrations.length === 0}>
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>REFRESH</span>
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-pitch text-cream dark:bg-cream dark:text-pitch font-mono text-xs flex items-center justify-between border-l-4 border-crimson">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold hover:text-crimson">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-pitch/40 dark:text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, URN, phone, or response ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-sm text-pitch dark:text-cream font-mono focus:outline-none focus:border-crimson"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by registration status"
          className="px-4 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono uppercase focus:outline-none focus:border-crimson"
        >
          <option value="ALL">ALL STATUSES</option>
          <option value="CONFIRMED">CONFIRMED (ATTENDING)</option>
          <option value="CANCELLED">CANCELLED / DECLINED</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      {loading ? (
        <div className="border border-pitch/15 dark:border-white/10 p-8 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-pitch/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          title="NO ATTENDEES FOUND"
          description="No attendee records match the current filter query or Google Form submissions."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-pitch/20 dark:border-white/15 bg-cream dark:bg-pitch overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand dark:bg-carbon text-pitch/70 dark:text-cream/70 border-b border-pitch/15 dark:border-white/10 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">ATTENDEE</th>
                    <th className="px-5 py-3.5">URN / ROLL NO.</th>
                    <th className="px-5 py-3.5">ATTENDING RSVP</th>
                    <th className="px-5 py-3.5">TICKET CREDENTIAL</th>
                    <th className="px-5 py-3.5">REGISTERED AT</th>
                    <th className="px-5 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pitch/10 dark:divide-white/10 font-mono">
                  {filteredRegistrations.map((reg) => {
                    const ticket = ticketByRegId.get(reg.id);
                    const isRevoked = ticket?.status === "REVOKED";
                    const isConfirmed = reg.status === "CONFIRMED";

                    return (
                      <tr
                        key={reg.id}
                        onClick={() => setSelectedReg(reg)}
                        className="hover:bg-sand/60 dark:hover:bg-carbon/60 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-display font-bold text-pitch dark:text-cream text-sm">
                            {reg.attendee_name}
                          </div>
                          <div className="text-pitch/60 dark:text-cream/60 text-xs flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-crimson" />
                            <span>{reg.attendee_email}</span>
                            {reg.attendee_phone && (
                              <>
                                <span className="opacity-40">•</span>
                                <Phone className="w-3 h-3 text-pitch/40 dark:text-cream/40" />
                                <span>{reg.attendee_phone}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {reg.urn ? (
                            <span className="px-2 py-0.5 bg-pitch/5 dark:bg-white/5 border border-pitch/20 dark:border-white/20 font-mono text-xs font-bold text-pitch dark:text-cream">
                              {reg.urn}
                            </span>
                          ) : (
                            <span className="text-pitch/40 dark:text-cream/40">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={isConfirmed ? "success" : "neutral"}>
                            {isConfirmed ? "YES (CONFIRMED)" : "NO (DECLINED)"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          {ticket ? (
                            <Badge variant={isRevoked ? "crimson" : "neutral"}>
                              {ticket.status}
                            </Badge>
                          ) : (
                            <span className="text-pitch/40 dark:text-cream/40 text-[10px] uppercase">
                              NO TICKET (DECLINED)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-pitch/60 dark:text-cream/60 text-[11px]">
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
                                RESEND
                              </Button>
                              {!isRevoked && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={actionLoading === ticket.id}
                                  onClick={() => setRevokeTargetTicketId(ticket.id)}
                                >
                                  REVOKE
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
              const isConfirmed = reg.status === "CONFIRMED";
              return (
                <div
                  key={reg.id}
                  onClick={() => setSelectedReg(reg)}
                  className="editorial-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display font-bold text-pitch dark:text-cream text-sm">
                        {reg.attendee_name}
                      </div>
                      <div className="font-mono text-xs text-pitch/60 dark:text-cream/60">{reg.attendee_email}</div>
                      {reg.urn && (
                        <div className="font-mono text-[11px] text-pitch/80 dark:text-cream/80 mt-1 font-bold">
                          URN: {reg.urn}
                        </div>
                      )}
                    </div>
                    <Badge variant={isConfirmed ? "success" : "neutral"}>
                      {isConfirmed ? "ATTENDING" : "DECLINED"}
                    </Badge>
                  </div>
                  {ticket && (
                    <div className="flex items-center gap-2 pt-2 border-t border-pitch/10 dark:border-white/10">
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
                        RESEND
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
                          REVOKE
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

      {/* Manual Add Attendee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cream dark:bg-pitch border-2 border-pitch dark:border-white/20 p-6 shadow-brutal space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-pitch/15 dark:border-white/10">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-crimson" />
                <h3 className="font-display text-base font-black uppercase text-pitch dark:text-cream">
                  Add Attendee (Form Entry)
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="hover:text-crimson">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Divyanshu Kubde"
                  className="w-full px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono focus:outline-none focus:border-crimson"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. attendee@college.edu"
                  className="w-full px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono focus:outline-none focus:border-crimson"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono focus:outline-none focus:border-crimson"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  URN (University Roll Number) *
                </label>
                <input
                  type="text"
                  required
                  value={newUrn}
                  onChange={(e) => setNewUrn(e.target.value)}
                  placeholder="e.g. 2201948"
                  className="w-full px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono uppercase focus:outline-none focus:border-crimson"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  Are you attending the event? *
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="attending"
                      value="Yes"
                      checked={newAttending === "Yes"}
                      onChange={() => setNewAttending("Yes")}
                      className="accent-[#D72638]"
                    />
                    <span>Yes (Issue Pass)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="attending"
                      value="No"
                      checked={newAttending === "No"}
                      onChange={() => setNewAttending("No")}
                      className="accent-[#D72638]"
                    />
                    <span>No (Decline)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pitch/15 dark:border-white/10">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAdd}
                >
                  {submittingAdd ? "REGISTERING..." : "CONFIRM REGISTRATION"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendee Detail Drawer */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cream dark:bg-pitch border-l border-pitch/20 dark:border-white/20 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-pitch/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-crimson" />
                  <h3 className="font-display text-lg font-black tracking-tight text-pitch dark:text-cream uppercase">
                    ATTENDEE PROFILE
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  aria-label="Close drawer"
                  className="p-1 hover:text-crimson transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider">FULL NAME</div>
                  <div className="font-display text-lg font-bold text-pitch dark:text-cream mt-0.5">
                    {selectedReg.attendee_name}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider">EMAIL</div>
                  <div className="text-xs text-pitch dark:text-cream mt-0.5">
                    {selectedReg.attendee_email}
                  </div>
                </div>
                {selectedReg.attendee_phone && (
                  <div>
                    <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider">PHONE NUMBER</div>
                    <div className="text-xs text-pitch dark:text-cream mt-0.5">
                      {selectedReg.attendee_phone}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider">URN (ROLL NUMBER)</div>
                  <div className="text-xs font-bold text-crimson mt-0.5">
                    {selectedReg.urn || "Not Specified"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider">ATTENDING STATUS</div>
                  <div className="text-xs mt-0.5">
                    {selectedReg.status === "CONFIRMED" ? (
                      <span className="text-[#16A34A] font-bold">YES — Attending (Active Pass)</span>
                    ) : (
                      <span className="text-crimson font-bold">NO — Declined / Cancelled</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider">FORM RESPONSE ID</div>
                  <div className="text-xs text-pitch/70 dark:text-cream/70 mt-0.5">
                    {selectedReg.external_form_response_id || selectedReg.source_response_id}
                  </div>
                </div>

                {ticketByRegId.get(selectedReg.id) && (
                  <div className="p-4 bg-sand dark:bg-carbon border border-pitch/15 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-display font-bold text-pitch dark:text-cream text-xs uppercase">
                        <TicketIcon className="w-4 h-4 text-crimson" />
                        <span>CRYPTOGRAPHIC CREDENTIAL</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const t = ticketByRegId.get(selectedReg.id);
                          if (t) loadTicketQr(t.id);
                        }}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>VIEW QR CODE</span>
                      </Button>
                    </div>

                    <div>
                      <div className="text-[10px] text-pitch/50 dark:text-cream/50 uppercase tracking-wider mb-1">
                        TOKEN SHA-256 HASH:
                      </div>
                      <div className="font-mono text-[10px] break-all text-pitch/80 dark:text-cream/80 bg-pitch/5 dark:bg-white/5 p-2 border border-pitch/10 dark:border-white/10">
                        {ticketByRegId.get(selectedReg.id)?.token_hash}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button variant="secondary" onClick={() => setSelectedReg(null)}>
              CLOSE
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

      {/* QR Code Pass Preview Modal */}
      {viewingQrTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-cream dark:bg-pitch border-2 border-pitch dark:border-white/20 p-6 shadow-brutal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pitch/15 dark:border-white/10">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-crimson" />
                <h3 className="font-display text-sm font-black uppercase text-pitch dark:text-cream">
                  Digital Pass QR Code
                </h3>
              </div>
              <button
                onClick={() => {
                  setViewingQrTicketId(null);
                  setQrData(null);
                }}
                className="hover:text-crimson"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-crimson" />
                <span className="font-mono text-xs text-pitch/60 dark:text-cream/60">Decrypting pass payload...</span>
              </div>
            ) : qrData ? (
              <div className="space-y-4">
                <div className="flex justify-center p-4 bg-white border border-pitch/20 rounded shadow-inner">
                  <img
                    src={qrData.qr_image_data_url}
                    alt="Attendee QR Pass"
                    className="w-56 h-56 object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-pitch/60 dark:text-cream/60 uppercase">
                    <span>Scanner Raw Token Payload</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrData.qr_payload);
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 2000);
                      }}
                      className="flex items-center gap-1 text-crimson hover:underline"
                    >
                      {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPayload ? "COPIED" : "COPY"}</span>
                    </button>
                  </div>
                  <div className="p-2 font-mono text-[10px] break-all bg-pitch/5 dark:bg-white/5 border border-pitch/10 dark:border-white/10 text-pitch dark:text-cream">
                    {qrData.qr_payload}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <a
                    href={qrData.qr_image_data_url}
                    download={`ticket-${viewingQrTicketId}.png`}
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full">
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD PNG</span>
                    </Button>
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setViewingQrTicketId(null);
                      setQrData(null);
                    }}
                  >
                    CLOSE
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
