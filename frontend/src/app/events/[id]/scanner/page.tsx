"use client";

import React from "react";
import { useParams } from "next/navigation";
import { QrScanner } from "@/components/scanner/QrScanner";

export default function EventScannerPage() {
  const params = useParams();
  const eventId = params.id as string;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-pitch/10 dark:border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-crimson inline-block" />
          <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-pitch/60 dark:text-cream/60">
            01 // ADMISSION SCANNER
          </span>
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight text-pitch dark:text-cream uppercase">
          Gate Admission Viewfinder
        </h1>
        <p className="font-mono text-xs text-pitch/60 dark:text-cream/60 mt-1">
          Zero-PII QR pass scanner. Validates tokens atomically via PostgreSQL row locks with instantaneous cryptographic hashing.
        </p>
      </div>

      <QrScanner eventId={eventId} />
    </div>
  );
}
