"use client";

import React from "react";
import { useParams } from "next/navigation";
import { QrScanner } from "@/components/scanner/QrScanner";

export default function EventScannerPage() {
  const params = useParams();
  const eventId = params.id as string;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Gate Admission Scanner</h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan attendee QR codes at event entry gates. Tokens are hashed on arrival and checked atomically against the database.
        </p>
      </div>

      <QrScanner eventId={eventId} />
    </div>
  );
}
