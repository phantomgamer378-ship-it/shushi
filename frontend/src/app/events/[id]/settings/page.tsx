"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Copy, Check, ShieldAlert, Globe, FileCode } from "lucide-react";
import { Button } from "@/components/ui/Primitives";

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
    : `https://api.shushi.io/v1/webhooks/google-forms/${event?.id || eventId}`;

  const sampleAppsScript = `/**
 * Google Apps Script Webhook Forwarder for Shushi
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
  var urn = "";
  var attending = "Yes";
  
  for (var i = 0; i < itemResponses.length; i++) {
    var title = itemResponses[i].getItem().getTitle().toLowerCase();
    var val = itemResponses[i].getResponse();
    if (title.indexOf("name") !== -1 && title.indexOf("attend") === -1) name = val;
    if (title.indexOf("email") !== -1) email = val;
    if (title.indexOf("phone") !== -1 || title.indexOf("contact") !== -1) phone = val;
    if (title.indexOf("urn") !== -1 || title.indexOf("roll") !== -1 || title.indexOf("reg") !== -1) urn = val;
    if (title.indexOf("attend") !== -1) attending = val;
  }

  var payloadObj = {
    response_id: responseId,
    name: name,
    email: email,
    phone: phone,
    urn: urn,
    attending: attending,
    custom_fields: {
      urn: urn,
      attending: attending
    }
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
    <div className="space-y-6 max-w-4xl">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-pitch/10 dark:border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-crimson inline-block" />
          <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-pitch/60 dark:text-cream/60">
            06 // INGESTION INTEGRATION
          </span>
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight text-pitch dark:text-cream uppercase">
          Google Forms Webhook Configuration
        </h1>
        <p className="font-mono text-xs text-pitch/60 dark:text-cream/60 mt-1">
          Stream submissions directly from Google Forms into Shushi with timing-safe HMAC-SHA256 validation.
        </p>
      </div>

      {/* Inbound Endpoint Box */}
      <div className="editorial-card p-6 space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-pitch dark:text-cream">
          <Globe className="w-4 h-4 text-crimson" />
          <span>INBOUND WEBHOOK ENDPOINT</span>
        </div>
        <p className="font-mono text-xs text-pitch/70 dark:text-cream/70">
          Dedicated endpoint for event <strong className="text-pitch dark:text-cream">{event?.title || "Shushi"}</strong>. All inbound POST requests require constant-time HMAC signatures.
        </p>
        <div className="flex items-center gap-2 font-mono text-xs">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 px-3.5 py-2.5 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/15 text-pitch dark:text-cream select-all focus:outline-none"
          />
          <Button size="sm" onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}>
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "COPIED" : "COPY"}</span>
          </Button>
        </div>
      </div>

      {/* Step by Step Setup */}
      <div className="editorial-card p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center gap-2 font-bold uppercase text-pitch dark:text-cream">
          <FileCode className="w-4 h-4 text-crimson" />
          <span>Google Apps Script Setup (3-Step Pipeline)</span>
        </div>

        <ol className="space-y-3 text-pitch/80 dark:text-cream/80 list-decimal list-inside leading-relaxed text-[11px]">
          <li>
            Open your target Google Form or linked Google Sheet, click <strong className="text-pitch dark:text-cream font-bold">Extensions &gt; Apps Script</strong>.
          </li>
          <li>
            Paste the script below into the code editor, substituting <code className="text-crimson font-bold">PASTE_YOUR_EVENT_WEBHOOK_SECRET_HERE</code> with the webhook secret.
          </li>
          <li>
            In Apps Script, click <strong className="text-pitch dark:text-cream font-bold">Triggers</strong> (alarm icon) &gt; <strong className="text-pitch dark:text-cream font-bold">Add Trigger</strong> &gt; Select function <strong className="text-pitch dark:text-cream font-bold">onFormSubmit</strong> &gt; Event type: <strong className="text-pitch dark:text-cream font-bold">On form submit</strong>.
          </li>
        </ol>

        <div className="relative mt-4">
          <button
            onClick={() => copyToClipboard(sampleAppsScript, setCopiedScript)}
            className="absolute top-3 right-3 px-3 py-1 bg-sand dark:bg-carbon border border-pitch/20 dark:border-white/20 text-pitch dark:text-cream text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors z-10"
          >
            {copiedScript ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedScript ? "COPIED CODE" : "COPY CODE"}</span>
          </button>
          <pre className="p-4 bg-sand dark:bg-carbon border border-pitch/15 dark:border-white/10 font-mono text-[11px] text-pitch/90 dark:text-cream/90 overflow-x-auto leading-relaxed max-h-96">
            {sampleAppsScript}
          </pre>
        </div>
      </div>

      {/* Cryptographic note */}
      <div className="p-4 bg-pitch text-cream dark:bg-cream dark:text-pitch border-l-4 border-crimson font-mono text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5 uppercase tracking-wider">
            CRYPTOGRAPHIC INTEGRITY GUARANTEE
          </strong>
          Every incoming webhook payload is verified using timing-safe constant-time HMAC-SHA256 comparison. Unsigned requests or replayed response IDs are rejected with RFC 7807 problem details.
        </div>
      </div>
    </div>
  );
}
