"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QrCode, Mail, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#10172A] text-slate-100">
      <div className="w-full max-w-md glass-panel p-8 rounded-[24px] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-tr from-[#635BFF] to-[#36C8E8] flex items-center justify-center text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Reset Password</h1>
            <p className="text-xs text-slate-400">EventFlow Staff Recovery</p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-[10px] bg-[#DC4545]/10 border border-[#DC4545]/25 text-red-300 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC4545]" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="space-y-5">
            <div className="p-4 rounded-[12px] bg-[#16A34A]/10 border border-[#16A34A]/25 text-emerald-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 text-[#16A34A]" />
              <div>
                <strong className="block font-semibold mb-1">Recovery Email Dispatched</strong>
                If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
              </div>
            </div>
            <Link
              href="/login"
              className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5249F5] text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your registered staff email address and Supabase Auth will send you a secure password recovery link.
            </p>
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@eventflow.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5249F5] text-white text-sm font-semibold shadow-lg shadow-[#635BFF]/25 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Recovery Link"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
