"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QrCode, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage("Account created. Check your email or sign in directly.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/events");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0A0C] text-[#F4F0EA]">
      {/* Left Column: Editorial Brutalist Showcase (Inspired by Reference Design) */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 sm:p-14 bg-[#EDE8DF] text-[#0A0A0C] border-b lg:border-b-0 lg:border-r border-[#27272A] relative overflow-hidden">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-[#0A0A0C]/70">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-[#0A0A0C] text-[#EDE8DF] font-bold flex items-center justify-center">
              SH
            </span>
            <span className="font-bold text-[#0A0A0C]">SHUSHI // 2026</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#D72638]" />
            <span className="text-[#D72638]">ACTIVE GATEWAY</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="my-12 max-w-lg">
          <div className="font-mono text-xs text-[#0A0A0C]/60 uppercase tracking-widest mb-3">
            A4 // EVENT ACCESS INFRASTRUCTURE
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-[#0A0A0C] leading-[0.92]">
            SHUSHI
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#0A0A0C]/80 mt-6 leading-relaxed">
            High-throughput event management, signed Google Forms webhooks, and atomic QR code admission control.
          </p>

          {/* Red Accent Ribbon (Referenced directly from uploaded design) */}
          <div className="mt-8 -mx-8 sm:-mx-14 py-3 bg-[#D72638] text-white font-mono text-xs sm:text-sm font-black tracking-widest uppercase overflow-hidden whitespace-nowrap shadow-sm">
            <div className="flex items-center gap-6 px-4">
              <span>✦ POSTGRESQL</span>
              <span>✦ FASTAPI</span>
              <span>✦ ATOMIC SCANNER</span>
              <span>✦ NEXT.JS</span>
              <span>✦ ZERO-PII QR</span>
              <span>✦ SUPABASE</span>
            </div>
          </div>
        </div>

        {/* Technical Guarantee Footer */}
        <div className="font-mono text-[11px] text-[#0A0A0C]/60 flex items-center justify-between border-t border-[#0A0A0C]/15 pt-4 uppercase">
          <span>01 // CRYPTOGRAPHIC ADMISSION</span>
          <span>POSTGRES 17 MUMBAI</span>
        </div>
      </div>

      {/* Right Column: High-Contrast Minimalist Console Login */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-14 bg-[#0A0A0C]">
        <div className="w-full max-w-md editorial-card bg-[#121214] p-8 sm:p-10 border border-[#27272A] shadow-brutal">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-6">
            <span className="text-[#D72638] font-bold">02 // CONSOLE</span>
            <span>STAFF LOGIN</span>
          </div>

          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight mb-2">
            {isSignUp ? "Create Staff Access" : "Sign In to Shushi"}
          </h2>
          <p className="font-mono text-xs text-slate-400 mb-6">
            Authorized gate operators and event administrators only.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 border border-[#D72638] bg-[#D72638]/15 text-[#D72638] font-mono text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-4 p-3 border border-emerald-500 bg-emerald-500/10 text-emerald-400 font-mono text-xs flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizer@shushi.io"
                className="w-full px-3.5 py-2.5 bg-[#0A0A0C] border border-[#27272A] text-white font-mono text-xs focus:outline-none focus:border-[#D72638]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block font-mono text-[11px] uppercase tracking-wider text-slate-400"
                >
                  Password
                </label>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="font-mono text-[11px] text-slate-400 hover:text-[#D72638]"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#0A0A0C] border border-[#27272A] text-white font-mono text-xs focus:outline-none focus:border-[#D72638]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white text-black hover:bg-slate-200 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white transition-all disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : isSignUp ? "Create Staff Access" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#27272A] text-center font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              {isSignUp ? "Already registered? Sign In" : "Need access? Request Staff Registration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
