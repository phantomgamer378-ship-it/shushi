"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Copy, Check, ShieldAlert, Key, Globe, FileCode, CheckCircle2 } from "lucide-react";

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  venue_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function EventSettingsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (eventId) {
      apiClient<EventDetail>(`events/${eventId}`)
        .then(setEvent)
        .catch(console.error);
    }
  }, [eventId]);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin.replace(":3000", ":8000")}/v1/webhooks/google-forms/${event?.id || eventId}`
    : `https://api.eventflow.io/v1/webhooks/google-forms/${event?.id || eventId}`;

  const sampleAppsScript = `/**
 * Google Apps Script Webhook Forwarder for EventFlow
 * Attach this script to your Google Form or linked Google Sheet.
 */
function onFormSubmit(e) {
  var WEBHOOK_URL = "${webhookUrl}";
  var WEBHOOK_SECRET = "PASTE_YOUR_EVENT_WEBHOOK_SECRET_HERE";

  var responseId = e.response ? e.response.getId() : ("SUB-" + new Date().getTime());
  var itemResponses = e.response ? e.response.getItemResponses() : [];
  
  var name = "Guest";
  var email = "";
  var phone = "";
  
  for (var i = 0; i < itemResponses.length; i++) {
    var title = itemResponses[i].getItem().getTitle().toLowerCase();
    var val = itemResponses[i].getResponse();
    if (title.indexOf("name") !== -1) name = val;
    if (title.indexOf("email") !== -1) email = val;
    if (title.indexOf("phone") !== -1) phone = val;
  }

  var payloadObj = {
    response_id: responseId,
    name: name,
    email: email,
    phone: phone
  };

  var payloadJson = JSON.stringify(payloadObj);
  var signature = Utilities.computeHmacSha256Signature(payloadJson, WEBHOOK_SECRET);
  var hexSignature = signature.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length == 1 ? "0" + v : v;
  }).join("");

  var timestampEpoch = Math.floor(Date.now() / 1000).toString();

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Webhook-Signature": hexSignature,
      "X-Webhook-Timestamp": timestampEpoch
    },
    payload: payloadJson,
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`;

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Google Forms Webhook Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect your Google Form or Google Sheet to EventFlow for instant, cryptographically verified RSVP ingestion.
        </p>
      </div>

      {/* Inbound Endpoint Box */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Globe className="w-4 h-4" />
          <span>Inbound Webhook Endpoint URL</span>
        </div>
        <p className="text-xs text-slate-400">
          This is the dedicated webhook URL for event <strong className="text-slate-200">{event?.title}</strong>. All submissions sent here require HMAC-SHA256 signature verification.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-slate-200 select-all"
          />
          <button
            onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Step by Step Setup */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <FileCode className="w-4 h-4" />
          <span>Google Apps Script Setup (3-Step Guide)</span>
        </div>

        <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
          <li>
            Open your Google Form or connected Google Sheet, click <strong className="text-white">Extensions &gt; Apps Script</strong>.
          </li>
          <li>
            Paste the script below into the code editor, replacing <code className="text-indigo-400 font-mono">PASTE_YOUR_EVENT_WEBHOOK_SECRET_HERE</code> with the webhook secret generated when creating the event.
          </li>
          <li>
            In Apps Script, click <strong className="text-white">Triggers</strong> (alarm icon in left sidebar) &gt; <strong className="text-white">Add Trigger</strong> &gt; Select function <strong className="text-white">onFormSubmit</strong> &gt; Event type: <strong className="text-white">On form submit</strong>.
          </li>
        </ol>

        <div className="relative mt-4">
          <button
            onClick={() => copyToClipboard(sampleAppsScript, setCopiedScript)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors z-10"
          >
            {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedScript ? "Copied Script" : "Copy Script"}</span>
          </button>
          <pre className="p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-96">
            {sampleAppsScript}
          </pre>
        </div>
      </div>

      {/* Security note */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Cryptographic Integrity Guarantee</strong>
          Every incoming webhook payload is checked using timing-safe constant-time HMAC-SHA256 comparison. Unsigned requests, replayed response IDs, or invalid digests are immediately rejected with RFC 7807 problem details.
        </div>
      </div>
    </div>
  );
}
