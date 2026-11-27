"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const demoToken = typeof window !== "undefined" ? localStorage.getItem("shushi_demo_token") : null;
      if (session || demoToken) {
        router.replace("/events");
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading Shushi...</p>
      </div>
    </div>
  );
}
