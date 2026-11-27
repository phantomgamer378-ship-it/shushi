"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { UserPlus, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/Primitives";

interface StaffMember {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export default function StaffPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await apiClient<StaffMember[]>(`events/${eventId}/staff`);
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchStaff();
    }
  }, [eventId]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient(`events/${eventId}/staff`, {
        method: "POST",
        body: JSON.stringify({
          user_id: newUserId,
          role: newRole,
        }),
      });
      setShowAddModal(false);
      setNewUserId("");
      fetchStaff();
    } catch (err: any) {
      alert(err.message || "Failed to assign staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const roleStyles: Record<string, string> = {
    owner: "bg-crimson text-white border-crimson",
    admin: "bg-pitch text-cream dark:bg-cream dark:text-pitch border-pitch dark:border-cream",
    staff: "bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/40",
    viewer: "bg-sand dark:bg-carbon text-pitch/70 dark:text-cream/70 border-pitch/20 dark:border-white/20",
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-pitch/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-crimson inline-block" />
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-pitch/60 dark:text-cream/60">
              05 // RBAC & PERMISSIONS
            </span>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-pitch dark:text-cream uppercase">
            Event Staff & Access Control
          </h1>
          <p className="font-mono text-xs text-pitch/60 dark:text-cream/60 mt-1">
            Manage granular roles (Owner, Admin, Check-in Staff, Viewer) for this event instance.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" />
          <span>ASSIGN STAFF ROLE</span>
        </Button>
      </div>

      <div className="border border-pitch/20 dark:border-white/15 bg-cream dark:bg-pitch overflow-hidden shadow-brutal">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-crimson border-t-transparent animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-pitch/50 dark:text-cream/50 uppercase">
            No staff records registered for this event.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-sand dark:bg-carbon text-pitch/70 dark:text-cream/70 border-b border-pitch/15 dark:border-white/10 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">USER UUID</th>
                  <th className="px-5 py-3.5">ASSIGNED PRIVILEGE</th>
                  <th className="px-5 py-3.5">ASSIGNED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch/10 dark:divide-white/10">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-sand/60 dark:hover:bg-carbon/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-pitch dark:text-cream">
                      {member.user_id}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase border tracking-wider ${
                          roleStyles[member.role] || "bg-sand text-pitch"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-pitch/60 dark:text-cream/60 text-[11px]">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cream dark:bg-pitch border-2 border-pitch dark:border-white/20 p-6 shadow-brutal space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-pitch/15 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-crimson" />
                <h3 className="font-display text-base font-black uppercase text-pitch dark:text-cream">
                  Assign Staff Member
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="hover:text-crimson">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  Supabase User ID (UUID)
                </label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000001"
                  className="w-full px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono focus:outline-none focus:border-crimson"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1">
                  Role Tier
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream font-mono uppercase focus:outline-none focus:border-crimson"
                >
                  <option value="staff">Staff (Gate Scanner Only)</option>
                  <option value="viewer">Viewer (Read-only Dashboards)</option>
                  <option value="admin">Admin (Ticket Reissue & Revocation)</option>
                  <option value="owner">Owner (Full Control & Webhooks)</option>
                </select>
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
                  disabled={submitting}
                >
                  {submitting ? "ASSIGNING..." : "CONFIRM ASSIGNMENT"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
