"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { ShieldCheck, UserPlus, Users, Shield, Plus } from "lucide-react";

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
      alert(err.message || "Failed to add staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const roleColors: Record<string, string> = {
    owner: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    staff: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    viewer: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Event Staff & Access Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage granular roles (Owner, Admin, Check-in Staff, Viewer) for this specific event.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Assign Staff Role</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No staff records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Staff User ID (UUID)</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Assigned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-white">
                      {member.user_id}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                          roleColors[member.role] || "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl">
            <form onSubmit={handleAddStaff} className="space-y-4">
              <h3 className="text-lg font-bold text-white">Assign Staff Member</h3>
              <p className="text-xs text-slate-400">
                Enter the Supabase User UUID and select their event privilege tier.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase User ID (UUID)
                </label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role Privilege</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="staff">Staff (Gate Scanner Only)</option>
                  <option value="viewer">Viewer (Read-only Dashboards)</option>
                  <option value="admin">Admin (Ticket Reissue & Revocation)</option>
                  <option value="owner">Owner (Full Control & Webhooks)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
