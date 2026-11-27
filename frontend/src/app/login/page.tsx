"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  QrCode,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

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
        setSuccessMessage("Account created! Check your email for verification link, or sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/events");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address first to receive a magic link.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setSuccessMessage("Magic login link sent! Check your inbox.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#10172A] text-slate-100 relative overflow-hidden">
      {/* Controlled Ambient Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#635BFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-0 w-96 h-96 bg-[#36C8E8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Column: Desktop 3D Spatial Digital Ticket Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/10 bg-[#18233D]/40 relative z-10">
        <div className="flex items-center gap-3 font-display font-bold text-xl tracking-tight text-white">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#635BFF] to-[#36C8E8] flex items-center justify-center text-white shadow-lg shadow-[#635BFF]/30">
            <QrCode className="w-5 h-5" />
          </div>
          <span>EventFlow</span>
        </div>

        {/* 3D Perspective Digital Ticket */}
        <div className="my-auto flex flex-col items-center justify-center perspective-1000">
          <motion.div
            initial={{ rotateX: 8, rotateY: -12, opacity: 0, y: 16 }}
            animate={{ rotateX: 4, rotateY: -6, opacity: 1, y: 0 }}
            whileHover={{ rotateX: 0, rotateY: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-[24px] p-6 bg-gradient-to-br from-[#18233D] via-[#10172A] to-[#0f172a] border border-white/15 shadow-2xl preserve-3d relative overflow-hidden"
          >
            {/* Subtle specular reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#635BFF]/20 text-[#36C8E8] border border-[#36C8E8]/30">
                VERIFIED PASS
              </span>
              <span className="font-mono text-xs text-slate-400">ef:v1:9f82...a41c</span>
            </div>

            <h2 className="font-display text-xl font-bold text-white mb-1">
              Global Tech Summit 2026
            </h2>
            <p className="text-xs text-slate-400 mb-6">BKC Convention Center • Gate A1</p>

            <div className="p-4 rounded-[16px] bg-white flex items-center justify-between mb-5 shadow-inner">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cryptographic Credential
                </div>
                <div className="font-display font-bold text-slate-900 text-sm">
                  Zero-PII QR Token
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>256-bit Entropy</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <QrCode className="w-10 h-10" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/10">
              <span>Atomic Gate Locking</span>
              <span className="font-mono text-[#36C8E8]">SELECT FOR UPDATE</span>
            </div>
          </motion.div>

          <div className="mt-10 text-center max-w-md">
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">
              The future of effortless event management.
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Ingest Google Forms RSVPs, issue zero-PII cryptographic passes, and verify gate entry in sub-second atomic transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-[#36C8E8]" />
          <span>Powered by Supabase Auth & PostgreSQL Mumbai (`ap-south-1`)</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-[24px] border border-white/10 shadow-2xl">
          <div className="flex lg:hidden flex-col items-center text-center mb-6">
            <div className="w-11 h-11 rounded-[10px] bg-gradient-to-tr from-[#635BFF] to-[#36C8E8] flex items-center justify-center text-white shadow-lg shadow-[#635BFF]/25 mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">EventFlow</h1>
          </div>

          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              {isSignUp ? "Create Staff Account" : "Sign in to Console"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isSignUp
                ? "Register with your organizer email address."
                : "Access your event dashboards, attendee rosters, and gate scanners."}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-[10px] bg-[#DC4545]/10 border border-[#DC4545]/25 text-red-300 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC4545]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-[10px] bg-[#16A34A]/10 border border-[#16A34A]/25 text-emerald-300 text-xs flex items-center gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@eventflow.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#36C8E8] hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-[10px] bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5249F5] active:scale-[0.99] text-white text-sm font-semibold shadow-lg shadow-[#635BFF]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>
                {loading
                  ? "Authenticating..."
                  : isSignUp
                  ? "Create Staff Account"
                  : "Sign In to Console"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="text-xs font-medium text-[#36C8E8] hover:text-cyan-300 transition-colors"
            >
              Send passwordless magic link via email
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "New organizer? Create a staff account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
