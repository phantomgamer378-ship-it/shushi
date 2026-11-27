"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Primitives";

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-cream dark:bg-pitch text-pitch dark:text-cream">
      <div className="w-full max-w-md editorial-card p-8 shadow-brutal space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-pitch/10 dark:border-white/10">
          <div className="w-9 h-9 bg-pitch text-cream dark:bg-cream dark:text-pitch font-mono font-black text-sm flex items-center justify-center border border-crimson">
            SH
          </div>
          <div>
            <h1 className="font-display text-xl font-black uppercase text-pitch dark:text-cream tracking-tight">
              Reset Password
            </h1>
            <p className="font-mono text-[10px] text-pitch/60 dark:text-cream/60 uppercase">
              Shushi Staff Recovery
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-crimson/10 border-l-4 border-crimson font-mono text-xs text-crimson flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="space-y-5 font-mono text-xs">
            <div className="p-4 bg-[#16A34A]/10 border-l-4 border-[#16A34A] text-[#16A34A] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold uppercase mb-1">Recovery Email Dispatched</strong>
                If an account exists for <strong className="underline">{email}</strong>, you will receive a secure password recovery link shortly.
              </div>
            </div>
            <Link
              href="/login"
              className="w-full py-2.5 bg-pitch text-cream dark:bg-cream dark:text-pitch font-mono font-bold uppercase text-xs flex items-center justify-center gap-2 border border-pitch dark:border-cream hover:bg-crimson hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO SIGN IN</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 font-mono text-xs">
            <p className="text-pitch/70 dark:text-cream/70 text-[11px] leading-relaxed">
              Enter your registered staff email address to receive a secure recovery token via Supabase Auth.
            </p>
            <div>
              <label
                htmlFor="reset-email"
                className="block text-[10px] font-bold uppercase tracking-wider text-pitch/70 dark:text-cream/70 mb-1.5"
              >
                STAFF EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-pitch/40 dark:text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@shushi.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-xs text-pitch dark:text-cream placeholder-pitch/30 dark:placeholder-cream/30 focus:outline-none focus:border-crimson"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "DISPATCHING..." : "SEND RECOVERY LINK"}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-pitch/60 dark:text-cream/60 hover:text-crimson transition-colors uppercase"
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
