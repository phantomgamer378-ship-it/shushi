"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Sidebar } from "@/components/ui/Sidebar";
import { apiClient } from "@/lib/api";

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  venue_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);

  useEffect(() => {
    if (eventId) {
      apiClient<EventDetail>(`events/${eventId}`)
        .then(setEvent)
        .catch(() => {});
    }
  }, [eventId]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar eventId={eventId} eventTitle={event?.title} />
      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
